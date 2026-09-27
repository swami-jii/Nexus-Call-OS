import io
import json
import logging
import mimetypes
import os
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, Response, UploadFile, Header, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

try:
    import pymupdf as fitz  # type: ignore[import]
except ImportError:
    try:
        import fitz  # type: ignore[import]
    except ImportError:
        fitz = None

from backend.auth.deps import get_current_user, get_current_user_optional, get_effective_org_id
from backend.database.session import get_db
from backend.models.models import AgentMemoryFact, AgentSessionMemory, KnowledgeDocument, User
from backend.repositories.repositories import contact_repo, knowledge_repo
from backend.services.knowledge_pipeline import BackgroundKnowledgeWorker
from backend.services.upload_storage import (
    CATEGORY_ALIASES,
    UPLOAD_CATEGORIES,
    UploadStorageService,
)
from backend.utils.document_lead_parser import DocumentLeadParser

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/uploads", tags=["File Storage & Recycle Bin"])


def _session_to_trash_dict(s: AgentSessionMemory) -> Dict[str, Any]:
    """Helper to convert AgentSessionMemory to a full JSON dict for download/preview."""
    return {
        "id": s.id,
        "session_id": s.session_id,
        "agent_id": s.agent_id,
        "agent_name": s.agent_name or "Agent",
        "device_id": s.device_id or "gsm_gateway_01",
        "device_name": s.device_name or "GSM Gateway",
        "phone_number": s.phone_number or "",
        "caller_name": s.caller_name or "Unknown Caller",
        "status": s.status or "completed",
        "started_at": s.started_at.isoformat() if s.started_at else None,
        "ended_at": s.ended_at.isoformat() if s.ended_at else None,
        "duration_sec": s.duration_sec or 0,
        "turn_count": s.turn_count or 0,
        "sentiment": s.sentiment or "neutral",
        "summary": s.summary or "",
        "recording_url": s.recording_url,
        "entities": s.entities or [],
        "key_points": s.key_points or [],
        "turns": s.turns or [],
        "is_deleted": s.is_deleted,
        "deleted_at": s.deleted_at.isoformat() if s.deleted_at else None,
    }


# -------------------------------------------------------------
# 1. Static Metadata & Category Endpoints
# -------------------------------------------------------------

@router.get("/categories")
def get_upload_categories(
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Retrieve storage statistics for all upload categories isolated to current user's organization."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)
    return UploadStorageService.get_category_stats(organization_id=org_id)


# -------------------------------------------------------------
# 2. PDF Rendering Engine for In-App Live Previews (Zero Download Prompt)
# -------------------------------------------------------------

@router.get("/pdf-info/{category}/{filename}")
def get_pdf_metadata(
    category: str,
    filename: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_target_organization_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Get total pages and metadata for a PDF document."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)
    file_path = UploadStorageService.get_file_path(category, filename, organization_id=org_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    if not fitz:
        return {"total_pages": 1, "filename": filename, "supported": False}

    try:
        doc = fitz.open(file_path)
        total_pages = len(doc)
        doc.close()
        return {
            "total_pages": total_pages,
            "filename": filename,
            "category": category,
            "supported": True,
        }
    except Exception as e:
        logger.error(f"Error reading PDF {file_path}: {e}")
        return {"total_pages": 1, "filename": filename, "supported": False, "error": str(e)}


@router.get("/pdf-page/{category}/{filename}")
def render_pdf_page_image(
    category: str,
    filename: str,
    page: int = Query(1, ge=1, description="1-indexed page number"),
    dpi: int = Query(150, ge=72, le=300, description="DPI resolution for rendered page"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_target_organization_id: Optional[str] = Header(None),
):
    """Render a specific PDF page directly as a PNG image for interactive browser display."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)
    file_path = UploadStorageService.get_file_path(category, filename, organization_id=org_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    if not fitz:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="PyMuPDF not installed")

    try:
        doc = fitz.open(file_path)
        page_idx = page - 1
        if page_idx < 0 or page_idx >= len(doc):
            doc.close()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Page {page} out of range (1-{len(doc)})")

        pdf_page = doc[page_idx]
        pix = pdf_page.get_pixmap(dpi=dpi)
        png_bytes = pix.tobytes("png")
        doc.close()

        return Response(content=png_bytes, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to render PDF page {page} for {file_path}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/extracted/{category}/{filename}")
def get_extracted_document_text(
    category: str,
    filename: str,
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Retrieve full multi-page extracted text, chunk count, and page metrics for an uploaded file."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)
    file_path = UploadStorageService.get_file_path(category, filename, organization_id=org_id)
    base_dir = os.path.dirname(file_path) if file_path else ""

    candidates = [
        f"{file_path}.extracted.json" if file_path else "",
        os.path.join(base_dir, f"{filename}.extracted.json") if base_dir else "",
        os.path.join(base_dir, "cache", f"{filename}.extracted.json") if base_dir else "",
    ]

    for cp in candidates:
        if cp and os.path.isfile(cp):
            try:
                with open(cp, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data.get("text"):
                        return {
                            "filename": filename,
                            "category": category,
                            "page_count": data.get("page_count", 1),
                            "chunk_count": data.get("chunk_count", len(data.get("chunks", [])) or 1),
                            "char_count": data.get("char_count", len(data.get("text", ""))),
                            "text": data.get("text", ""),
                            "status": "ready",
                        }
            except Exception as e:
                logger.warning(f"Error loading extracted file {cp}: {e}")

    # Fallback to reading file if text or code
    if file_path and os.path.isfile(file_path):
        ext = os.path.splitext(filename)[1].lower().replace(".", "")
        if ext in ["txt", "md", "csv", "json", "py", "js", "ts", "tsx", "html"]:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as tf:
                    raw_text = tf.read()
                    return {
                        "filename": filename,
                        "category": category,
                        "page_count": 1,
                        "chunk_count": max(1, math.ceil(len(raw_text) / 750)),
                        "char_count": len(raw_text),
                        "text": raw_text,
                        "status": "ready",
                    }
            except Exception:
                pass

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extracted text content not found")


@router.get("/trash/pdf-info/{trash_id}")
def get_trash_pdf_metadata(
    trash_id: str,
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    org_id = get_effective_org_id(current_user, x_target_organization_id)
    file_path = UploadStorageService.get_trash_file_path(trash_id, organization_id=org_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trash item not found")

    if not fitz:
        return {"total_pages": 1, "supported": False}

    try:
        doc = fitz.open(file_path)
        total_pages = len(doc)
        doc.close()
        return {"total_pages": total_pages, "supported": True}
    except Exception:
        return {"total_pages": 1, "supported": False}


@router.get("/trash/pdf-page/{trash_id}")
def render_trash_pdf_page_image(
    trash_id: str,
    page: int = Query(1, ge=1),
    dpi: int = Query(150, ge=72, le=300),
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
):
    org_id = get_effective_org_id(current_user, x_target_organization_id)
    file_path = UploadStorageService.get_trash_file_path(trash_id, organization_id=org_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trash file not found")

    if not fitz:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="PyMuPDF not installed")

    try:
        doc = fitz.open(file_path)
        page_idx = page - 1
        if page_idx < 0 or page_idx >= len(doc):
            doc.close()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Page out of range")

        pdf_page = doc[page_idx]
        pix = pdf_page.get_pixmap(dpi=dpi)
        png_bytes = pix.tobytes("png")
        doc.close()

        return Response(content=png_bytes, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to render trash PDF page: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# -------------------------------------------------------------
# 3. Recycle Bin Endpoints (Unified with DB Soft-Deleted Records)
# -------------------------------------------------------------

@router.get("/trash/stats")
def get_trash_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Get total item count and byte usage of Recycle Bin across files and DB records for current tenant."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)
    file_stats = UploadStorageService.get_trash_stats(organization_id=org_id)

    trashed_sessions = db.query(AgentSessionMemory).filter(
        AgentSessionMemory.is_deleted == True,
        AgentSessionMemory.organization_id == org_id,
    ).all()
    trashed_facts = db.query(AgentMemoryFact).filter(
        AgentMemoryFact.is_deleted == True,
        AgentMemoryFact.organization_id == org_id,
    ).all()

    session_bytes = sum(len(json.dumps(_session_to_trash_dict(s)).encode("utf-8")) for s in trashed_sessions)
    fact_bytes = sum(len(json.dumps({"id": f.id, "fact": f.fact, "category": f.category}).encode("utf-8")) for f in trashed_facts)

    total_items = file_stats["total_items"] + len(trashed_sessions) + len(trashed_facts)
    total_bytes = file_stats["total_bytes"] + session_bytes + fact_bytes

    all_dates: List[str] = []
    if file_stats.get("oldest_item"):
        all_dates.append(file_stats["oldest_item"])
    for s in trashed_sessions:
        if s.deleted_at:
            all_dates.append(s.deleted_at.isoformat())
    for f in trashed_facts:
        if f.deleted_at:
            all_dates.append(f.deleted_at.isoformat())

    all_dates.sort()
    oldest_item = all_dates[0] if all_dates else None

    return {
        "total_items": total_items,
        "total_bytes": total_bytes,
        "total_formatted": UploadStorageService.format_size(total_bytes),
        "oldest_item": oldest_item,
        "newest_item": all_dates[-1] if all_dates else None,
        "sessions_count": len(trashed_sessions),
        "facts_count": len(trashed_facts),
        "files_count": file_stats["total_items"],
    }


@router.get("/trash/items")
@router.get("/trash")
def list_trash_items(
    category: Optional[str] = Query(None, description="Filter by original category"),
    search: Optional[str] = Query(None, description="Search term in filename"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
) -> List[Dict[str, Any]]:
    """List all items currently stored in the Recycle Bin for the authenticated user's organization."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)
    items: List[Dict[str, Any]] = []

    # 1. File items from tenant disk upload storage
    file_items = UploadStorageService.list_trash(organization_id=org_id)
    items.extend(file_items)

    # 2. Soft-deleted Call Sessions & Audio Recordings for tenant
    trashed_sessions = db.query(AgentSessionMemory).filter(
        AgentSessionMemory.is_deleted == True,
        AgentSessionMemory.organization_id == org_id,
    ).all()
    for s in trashed_sessions:
        s_dict = _session_to_trash_dict(s)
        s_bytes = len(json.dumps(s_dict).encode("utf-8"))
        filename = f"{s.session_id}.json"

        ag_id = (s.agent_id or "").lower()
        sid_lower = (s.session_id or "").lower()
        c_lower = (s.caller_name or "").lower()
        p_lower = (s.phone_number or "").lower()

        if ag_id in ["dept_rag_knowledge", "agent_rag"] or "rag" in sid_lower or "1.pdf" in c_lower or "doc:" in p_lower:
            dept_id = "rag_knowledge"
            dept_label = "Knowledge Base (RAG)"
        elif ag_id == "dept_workflows" or "workflow" in sid_lower or "loan" in c_lower or "ivr" in c_lower or "wf" in sid_lower:
            dept_id = "workflows"
            dept_label = "Voice Workflows"
        elif ag_id == "dept_demo_studio" or "studio" in sid_lower or "sandbox" in c_lower or "webrtc" in sid_lower:
            dept_id = "demo_studio"
            dept_label = "Live Call Studio"
        elif ag_id == "dept_gsm_gateway" or "gsm" in sid_lower or "sim" in c_lower:
            dept_id = "gsm_gateway"
            dept_label = "Pair & Apps GSM Gateway"
        else:
            dept_id = "voice_agents"
            dept_label = f"AI Voice Agent ({s.agent_name or 'Agent'})"

        items.append({
            "trash_id": f"session_{s.session_id or s.id}",
            "filename": filename,
            "stored_filename": filename,
            "category": "agent_memory_brain",
            "category_name": "Agent Memory & Sessions",
            "department_id": dept_id,
            "department_label": dept_label,
            "file_type": "JSON",
            "size_bytes": s_bytes,
            "size_formatted": UploadStorageService.format_size(s_bytes),
            "deleted_at": s.deleted_at.isoformat() if s.deleted_at else (s.started_at.isoformat() if s.started_at else datetime.now(timezone.utc).isoformat()),
            "deleted_by": s.agent_name or "Agent Memory Brain",
            "original_path": f"uploads/agent_memory_brain/{s.session_id}.json",
            "caller_name": s.caller_name,
            "phone_number": s.phone_number,
            "duration_sec": s.duration_sec,
            "turn_count": s.turn_count,
            "summary": s.summary,
            "item_kind": "session_memory",
            "agent_name": s.agent_name or "Agent",
            "agent_id": s.agent_id,
        })

    # 3. Soft-deleted Facts for tenant
    trashed_facts = db.query(AgentMemoryFact).filter(
        AgentMemoryFact.is_deleted == True,
        AgentMemoryFact.organization_id == org_id,
    ).all()
    for f in trashed_facts:
        f_bytes = len(json.dumps({"id": f.id, "fact": f.fact, "category": f.category}).encode("utf-8"))
        filename = f"memory_fact_{f.category}_{f.id[:6]}.json"
        items.append({
            "trash_id": f"fact_{f.id}",
            "filename": filename,
            "stored_filename": filename,
            "category": "agent_memory_brain",
            "category_name": "Agent Memory & Sessions",
            "department_id": "facts",
            "department_label": "Extracted Knowledge Facts",
            "file_type": "JSON",
            "size_bytes": f_bytes,
            "size_formatted": UploadStorageService.format_size(f_bytes),
            "deleted_at": f.deleted_at.isoformat() if f.deleted_at else (f.created_at.isoformat() if f.created_at else datetime.now(timezone.utc).isoformat()),
            "deleted_by": f"Agent {f.agent_id}",
            "original_path": f"uploads/agent_memory_brain/facts/{filename}",
            "fact_text": f.fact,
            "item_kind": "agent_fact",
            "category_tag": f.category,
            "agent_id": f.agent_id,
        })

    # Filter by category
    if category and isinstance(category, str) and category.strip().upper() != "ALL":
        target_cat = CATEGORY_ALIASES.get(category.strip().lower(), category.strip().lower())
        items = [
            i for i in items
            if i.get("category") == target_cat or CATEGORY_ALIASES.get(i.get("category", "").lower()) == target_cat or i.get("category") == category
        ]

    # Filter by search
    if search and isinstance(search, str):
        s_lower = search.lower().strip()
        items = [
            i for i in items
            if s_lower in i["filename"].lower()
            or s_lower in i.get("category_name", "").lower()
            or s_lower in i.get("deleted_by", "").lower()
            or s_lower in i.get("summary", "").lower()
            or s_lower in i.get("caller_name", "").lower()
            or s_lower in i.get("phone_number", "").lower()
            or s_lower in i.get("fact_text", "").lower()
        ]

    # Sort latest deleted first
    items.sort(key=lambda x: x.get("deleted_at") or "", reverse=True)
    return items


@router.delete("/trash")
def empty_all_trash(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Empty the entire Recycle Bin permanently for current tenant (disk files + DB sessions and facts)."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)
    purged_files = UploadStorageService.empty_trash(organization_id=org_id)
    purged_sessions = db.query(AgentSessionMemory).filter(
        AgentSessionMemory.is_deleted == True,
        AgentSessionMemory.organization_id == org_id,
    ).delete()
    purged_facts = db.query(AgentMemoryFact).filter(
        AgentMemoryFact.is_deleted == True,
        AgentMemoryFact.organization_id == org_id,
    ).delete()
    db.commit()

    total_purged = purged_files + purged_sessions + purged_facts
    return {
        "success": True,
        "purged_count": total_purged,
        "purged_files": purged_files,
        "purged_sessions": purged_sessions,
        "purged_facts": purged_facts,
        "message": f"Successfully emptied Recycle Bin ({total_purged} items purged from disk & database).",
    }


@router.get("/trash/{trash_id}/download")
@router.get("/trash/download/{trash_id}")
def download_trash_file(
    trash_id: str,
    download: bool = Query(False, description="If True, downloads as attachment; if False, previews inline"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
):
    """Download or live-preview a file or session JSON directly from the tenant's Recycle Bin."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)

    if trash_id.startswith("session_"):
        sid = trash_id.replace("session_", "")
        s = db.query(AgentSessionMemory).filter(
            ((AgentSessionMemory.session_id == sid) | (AgentSessionMemory.id == sid)),
            AgentSessionMemory.organization_id == org_id,
        ).first()
        if not s:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session record not found")
        content_bytes = json.dumps(_session_to_trash_dict(s), indent=2).encode("utf-8")
        disposition = f"{'attachment' if download else 'inline'}; filename={s.session_id}.json"
        return Response(content=content_bytes, media_type="application/json", headers={"Content-Disposition": disposition})

    if trash_id.startswith("fact_"):
        fid = trash_id.replace("fact_", "")
        f = db.query(AgentMemoryFact).filter(
            AgentMemoryFact.id == fid,
            AgentMemoryFact.organization_id == org_id,
        ).first()
        if not f:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fact record not found")
        content_bytes = json.dumps({"id": f.id, "agent_id": f.agent_id, "category": f.category, "fact": f.fact, "confidence": f.confidence}, indent=2).encode("utf-8")
        disposition = f"{'attachment' if download else 'inline'}; filename=fact_{f.id}.json"
        return Response(content=content_bytes, media_type="application/json", headers={"Content-Disposition": disposition})

    file_path = UploadStorageService.get_trash_file_path(trash_id, organization_id=org_id)
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trash item physical file not found",
        )

    media_type, _ = mimetypes.guess_type(file_path)
    if not media_type:
        media_type = "application/octet-stream"

    filename = os.path.basename(file_path)
    if download:
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type=media_type,
            content_disposition_type="attachment",
        )
    return FileResponse(
        path=file_path,
        media_type=media_type,
        content_disposition_type="inline",
    )


@router.post("/trash/{trash_id}/restore")
@router.post("/trash/restore/{trash_id}")
def restore_trash_file(
    trash_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Restore a file, deleted session memory, or fact from Recycle Bin back to its original location."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)

    # Check if session memory
    if trash_id.startswith("session_"):
        sid = trash_id.replace("session_", "")
        s = db.query(AgentSessionMemory).filter(
            ((AgentSessionMemory.session_id == sid) | (AgentSessionMemory.id == sid)),
            AgentSessionMemory.organization_id == org_id,
        ).first()
        if s:
            s.is_deleted = False
            s.deleted_at = None
            tied_facts = db.query(AgentMemoryFact).filter(
                ((AgentMemoryFact.source_session_id == s.session_id) | (AgentMemoryFact.source_session_id == s.id)),
                AgentMemoryFact.organization_id == org_id,
            ).all()
            for fact in tied_facts:
                fact.is_deleted = False
                fact.deleted_at = None
            db.commit()
            db.refresh(s)
            return {
                "success": True,
                "trash_id": trash_id,
                "filename": f"{s.session_id}.json",
                "category": "memory",
                "message": f"Session memory '{s.session_id}' and all tied knowledge facts restored to Agent Memory Brain.",
            }
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session '{sid}' not found in Recycle Bin")

    # Check if fact
    if trash_id.startswith("fact_"):
        fid = trash_id.replace("fact_", "")
        f = db.query(AgentMemoryFact).filter(
            AgentMemoryFact.id == fid,
            AgentMemoryFact.organization_id == org_id,
        ).first()
        if f:
            f.is_deleted = False
            f.deleted_at = None
            db.commit()
            db.refresh(f)
            return {
                "success": True,
                "trash_id": trash_id,
                "filename": f"fact_{fid}.json",
                "category": "memory",
                "message": f"Knowledge Fact '{fid}' restored to Agent Memory Brain.",
            }
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Fact '{fid}' not found in Recycle Bin")

    # Regular file restore
    try:
        result = UploadStorageService.restore_from_trash(trash_id, organization_id=org_id)
        if result.get("category") == "knowledge_base":
            fname = result.get("filename")
            fpath = result.get("restored_path")
            if fname and fpath and os.path.exists(fpath):
                existing = db.query(KnowledgeDocument).filter(
                    ((KnowledgeDocument.title == fname) | (KnowledgeDocument.file_path == fpath)),
                    KnowledgeDocument.organization_id == org_id,
                ).first()
                if not existing:
                    ext = os.path.splitext(fname)[1].lower().replace(".", "") or "PDF"
                    fsize = os.path.getsize(fpath)
                    fsize_str = f"{round(fsize / (1024*1024), 2)} MB" if fsize > 1024*1024 else f"{round(fsize/1024, 1)} KB"
                    chunk_c = max(1, math.ceil(fsize / 1024))
                    ext_json = f"{fpath}.extracted.json"
                    if os.path.exists(ext_json):
                        try:
                            with open(ext_json, "r", encoding="utf-8") as jf:
                                jdata = json.load(jf)
                                chunk_c = jdata.get("chunk_count", len(jdata.get("chunks", [])) or chunk_c)
                        except Exception:
                            pass
                    db_doc = KnowledgeDocument(
                        title=fname,
                        file_type=ext.upper(),
                        file_size=fsize_str,
                        file_path=fpath,
                        status="Indexed",
                        vector_status="Ready",
                        chunk_count=chunk_c,
                        organization_id=org_id,
                    )
                    db.add(db_doc)
                    db.commit()
        return result
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete("/trash/{trash_id}")
@router.delete("/trash/item/{trash_id}")
def permanently_delete_trash_item(
    trash_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Permanently delete a specific item from Recycle Bin and database."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)

    # Check if session memory
    if trash_id.startswith("session_"):
        sid = trash_id.replace("session_", "")
        s = db.query(AgentSessionMemory).filter(
            ((AgentSessionMemory.session_id == sid) | (AgentSessionMemory.id == sid)),
            AgentSessionMemory.organization_id == org_id,
        ).first()
        if s:
            tied_facts = db.query(AgentMemoryFact).filter(
                ((AgentMemoryFact.source_session_id == s.session_id) | (AgentMemoryFact.source_session_id == s.id)),
                AgentMemoryFact.organization_id == org_id,
            ).all()
            for fact in tied_facts:
                db.delete(fact)
            db.delete(s)
            db.commit()
            return {
                "success": True,
                "trash_id": trash_id,
                "message": f"Session memory '{s.session_id}' and all tied facts permanently deleted from database.",
            }
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session '{sid}' not found in Recycle Bin")

    # Check if fact
    if trash_id.startswith("fact_"):
        fid = trash_id.replace("fact_", "")
        f = db.query(AgentMemoryFact).filter(
            AgentMemoryFact.id == fid,
            AgentMemoryFact.organization_id == org_id,
        ).first()
        if f:
            db.delete(f)
            db.commit()
            return {
                "success": True,
                "trash_id": trash_id,
                "message": f"Knowledge Fact '{fid}' permanently deleted from database.",
            }
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Fact '{fid}' not found in Recycle Bin")

    # Regular file permanent deletion
    success = UploadStorageService.permanently_delete_from_trash(trash_id, organization_id=org_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trash record not found or could not be removed",
        )
    return {
        "success": True,
        "trash_id": trash_id,
        "message": "Item permanently deleted from disk.",
    }


@router.post("/trash/{category}/{filename}")
def move_file_to_trash(
    category: str,
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Move an active file to the Recycle Bin (soft delete)."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)
    try:
        trash_record = UploadStorageService.move_to_trash(
            category=category,
            filename=filename,
            deleted_by=current_user.full_name or current_user.email or "Operator",
            organization_id=org_id,
        )
        if category == "knowledge_base":
            kb_docs = db.query(KnowledgeDocument).filter(
                ((KnowledgeDocument.title == filename) | (KnowledgeDocument.file_path.like(f"%{filename}"))),
                KnowledgeDocument.organization_id == org_id,
            ).all()
            for kd in kb_docs:
                db.delete(kd)
            db.commit()
        return {
            "success": True,
            "message": f"File '{filename}' moved to Recycle Bin.",
            "item": trash_record,
        }
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


# -------------------------------------------------------------
# 4. Active Storage Category & File Endpoints (Dynamic)
# -------------------------------------------------------------

@router.get("")
@router.get("/list")
def list_uploaded_files(
    category: Optional[str] = Query(None, description="Category filter"),
    search: Optional[str] = Query(None, description="Search term"),
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
) -> List[Dict[str, Any]]:
    """List uploaded files for current user's organization."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)
    files = UploadStorageService.list_files(category, organization_id=org_id)
    if search:
        s_lower = search.lower().strip()
        files = [f for f in files if s_lower in f["filename"].lower() or s_lower in f.get("category_name", "").lower()]
    return files


@router.post("/{category}")
async def upload_file_to_category(
    category: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Upload a file directly into a specific category subfolder with auto-indexing and lead ingestion."""
    safe_category = CATEGORY_ALIASES.get(category.strip().lower(), category.strip().lower())
    if safe_category not in UPLOAD_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category: {category}. Valid categories: {list(UPLOAD_CATEGORIES.keys())}",
        )

    org_id = get_effective_org_id(current_user, x_target_organization_id)
    filename = file.filename or "uploaded_file"
    ext = os.path.splitext(filename)[1].lower().replace(".", "")
    content_bytes = await file.read()

    result = UploadStorageService.save_file(
        category=safe_category,
        filename=filename,
        content_bytes=content_bytes,
        organization_id=org_id,
    )
    saved_filename = result["filename"]
    saved_path = result["file_path"]
    file_size_formatted = result["file_size_formatted"]

    # 1. Automatic RAG indexing if uploaded to Knowledge Base
    if safe_category == "knowledge_base":
        doc_data = {
            "title": saved_filename,
            "file_type": ext.upper() or "DOC",
            "file_size": file_size_formatted,
            "file_path": saved_path,
            "status": "Indexed",
            "vector_status": "Ready",
            "chunk_count": max(1, math.ceil(len(content_bytes) / 1024)),
            "organization_id": org_id,
        }
        created_doc = knowledge_repo.create(db, doc_data)
        result["document_id"] = str(created_doc.id)

        # Trigger async knowledge worker
        org_id_str = str(org_id) if org_id else None
        user_id_str = str(current_user.id) if current_user and current_user.id else None
        background_tasks.add_task(
            BackgroundKnowledgeWorker.process_document_async,
            document_id=str(created_doc.id),
            filename=saved_filename,
            file_bytes=content_bytes,
            file_path=saved_path,
            ext=ext,
            org_id=org_id_str,
            user_id=user_id_str,
        )

    # 2. Automatic Lead ingestion if uploaded to Contacts
    elif safe_category == "contacts" and ext in ["csv", "xlsx", "xls", "txt"]:
        try:
            parsed_records = DocumentLeadParser.parse_document_bytes(
                content_bytes=content_bytes,
                filename=saved_filename,
            )
            imported_count = 0
            for record in parsed_records:
                custom_vars = dict(record.get("custom_variables") or {})
                custom_vars["source_file"] = saved_filename
                custom_vars["_source_file"] = saved_filename
                contact_data = {
                    **record,
                    "custom_variables": custom_vars,
                    "organization_id": org_id,
                }
                try:
                    contact_repo.create(db, contact_data)
                    imported_count += 1
                except Exception:
                    pass
            result["imported_contacts"] = imported_count
        except Exception as e:
            logger.warning(f"Error parsing contact file {saved_filename}: {e}")

    logger.info(f"FILE_UPLOADED_TO_CATEGORY user_id='{current_user.id if current_user else 'sys'}' category='{safe_category}' filename='{saved_filename}' org='{org_id}'")
    return result


@router.get("/{category}/{filename}")
def download_uploaded_file(
    category: str,
    filename: str,
    download: bool = Query(False, description="If True, downloads as attachment; if False, previews inline"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_target_organization_id: Optional[str] = Header(None),
):
    """Download / view a specific uploaded file."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)
    file_path = UploadStorageService.get_file_path(category, filename, organization_id=org_id)
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found in storage",
        )

    media_type, _ = mimetypes.guess_type(file_path)
    if not media_type:
        media_type = "application/octet-stream"

    if download:
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type=media_type,
            content_disposition_type="attachment",
        )
    return FileResponse(
        path=file_path,
        media_type=media_type,
        content_disposition_type="inline",
    )


@router.delete("/{category}/{filename}")
def delete_uploaded_file(
    category: str,
    filename: str,
    permanent: bool = Query(False, description="If True, bypasses recycle bin and deletes permanently"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_target_organization_id: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Delete a file. By default moves to Recycle Bin (soft delete); if permanent=True, deletes immediately."""
    org_id = get_effective_org_id(current_user, x_target_organization_id)
    safe_category = CATEGORY_ALIASES.get(category.strip().lower(), category.strip().lower())
    if permanent:
        deleted = UploadStorageService.delete_file(safe_category, filename, organization_id=org_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or could not be permanently deleted",
            )
        if safe_category == "knowledge_base":
            kb_docs = db.query(KnowledgeDocument).filter(
                ((KnowledgeDocument.title == filename) | (KnowledgeDocument.file_path.like(f"%{filename}"))),
                KnowledgeDocument.organization_id == org_id,
            ).all()
            for kd in kb_docs:
                db.delete(kd)
            db.commit()
        logger.info(f"FILE_PERMANENTLY_DELETED user_id='{current_user.id}' category='{safe_category}' filename='{filename}' org='{org_id}'")
        return {
            "success": True,
            "message": f"File '{filename}' permanently deleted from uploads/{safe_category}/",
            "category": safe_category,
            "filename": filename,
            "permanent": True,
        }
    else:
        try:
            trash_record = UploadStorageService.move_to_trash(
                category=safe_category,
                filename=filename,
                deleted_by=current_user.full_name or current_user.email or "Operator",
                organization_id=org_id,
            )
            if safe_category == "knowledge_base":
                kb_docs = db.query(KnowledgeDocument).filter(
                    ((KnowledgeDocument.title == filename) | (KnowledgeDocument.file_path.like(f"%{filename}"))),
                    KnowledgeDocument.organization_id == org_id,
                ).all()
                for kd in kb_docs:
                    db.delete(kd)
                db.commit()
            return {
                "success": True,
                "message": f"File '{filename}' moved to Recycle Bin. You can restore it anytime.",
                "trash_record": trash_record,
                "permanent": False,
            }
        except FileNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )

