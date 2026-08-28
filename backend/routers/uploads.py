import io
import logging
import mimetypes
import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

try:
    import fitz  # type: ignore[import]
except ImportError:
    fitz = None

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.models.models import User
from backend.services.upload_storage import (
    UPLOAD_CATEGORIES,
    UploadStorageService,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/uploads", tags=["File Storage & Recycle Bin"])


# -------------------------------------------------------------
# 1. Static Metadata & Category Endpoints
# -------------------------------------------------------------

@router.get("/categories")
def get_upload_categories(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Retrieve storage statistics for all upload categories."""
    return UploadStorageService.get_category_stats()


# -------------------------------------------------------------
# 2. PDF Rendering Engine for In-App Live Previews (Zero Download Prompt)
# -------------------------------------------------------------

@router.get("/pdf-info/{category}/{filename}")
def get_pdf_metadata(
    category: str,
    filename: str,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get total pages and metadata for a PDF document."""
    file_path = UploadStorageService.get_file_path(category, filename)
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
    current_user: User = Depends(get_current_user),
):
    """Render a specific PDF page directly as a PNG image for interactive browser display."""
    file_path = UploadStorageService.get_file_path(category, filename)
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


@router.get("/trash/pdf-info/{trash_id}")
def get_trash_pdf_metadata(
    trash_id: str,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    file_path = UploadStorageService.get_trash_file_path(trash_id)
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
):
    file_path = UploadStorageService.get_trash_file_path(trash_id)
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
# 3. Recycle Bin Endpoints
# -------------------------------------------------------------

@router.get("/trash/stats")
def get_trash_statistics(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get total item count and byte usage of Recycle Bin."""
    return UploadStorageService.get_trash_stats()


@router.get("/trash/items")
@router.get("/trash")
def list_trash_items(
    category: Optional[str] = Query(None, description="Filter by original category"),
    search: Optional[str] = Query(None, description="Search term in filename"),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """List all items currently stored in the Recycle Bin."""
    items = UploadStorageService.list_trash()
    if category and category != "ALL":
        items = [i for i in items if i["category"] == category]
    if search:
        s_lower = search.lower().strip()
        items = [i for i in items if s_lower in i["filename"].lower() or s_lower in i.get("category_name", "").lower()]
    return items


@router.delete("/trash")
def empty_all_trash(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Empty the entire Recycle Bin permanently."""
    purged_count = UploadStorageService.empty_trash()
    return {
        "success": True,
        "purged_count": purged_count,
        "message": f"Successfully emptied Recycle Bin ({purged_count} items purged).",
    }


@router.get("/trash/{trash_id}/download")
@router.get("/trash/download/{trash_id}")
def download_trash_file(
    trash_id: str,
    download: bool = Query(False, description="If True, downloads as attachment; if False, previews inline"),
    current_user: User = Depends(get_current_user),
):
    """Download or live-preview a file directly from the Recycle Bin."""
    file_path = UploadStorageService.get_trash_file_path(trash_id)
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
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Restore a file from Recycle Bin back to its original subfolder."""
    try:
        result = UploadStorageService.restore_from_trash(trash_id)
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
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Permanently delete a specific item from Recycle Bin and disk."""
    success = UploadStorageService.permanently_delete_from_trash(trash_id)
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
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Move an active file to the Recycle Bin (soft delete)."""
    try:
        trash_record = UploadStorageService.move_to_trash(
            category=category,
            filename=filename,
            deleted_by=current_user.full_name or current_user.email or "Operator",
        )
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
def list_uploaded_files(
    category: Optional[str] = Query(None, description="Category filter"),
    search: Optional[str] = Query(None, description="Search term"),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """List uploaded files across all or specific category."""
    files = UploadStorageService.list_files(category)
    if search:
        s_lower = search.lower().strip()
        files = [f for f in files if s_lower in f["filename"].lower() or s_lower in f.get("category_name", "").lower()]
    return files


@router.post("/{category}")
async def upload_file_to_category(
    category: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Upload a file directly into a specific category subfolder."""
    if category not in UPLOAD_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category: {category}. Valid categories: {list(UPLOAD_CATEGORIES.keys())}",
        )

    filename = file.filename or "uploaded_file"
    content_bytes = await file.read()

    result = UploadStorageService.save_file(
        category=category,
        filename=filename,
        content_bytes=content_bytes,
    )
    logger.info(f"FILE_UPLOADED_TO_CATEGORY user_id='{current_user.id}' category='{category}' filename='{result['filename']}'")
    return result


@router.get("/{category}/{filename}")
def download_uploaded_file(
    category: str,
    filename: str,
    download: bool = Query(False, description="If True, downloads as attachment; if False, previews inline"),
    current_user: User = Depends(get_current_user),
):
    """Download / view a specific uploaded file."""
    file_path = UploadStorageService.get_file_path(category, filename)
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
) -> Dict[str, Any]:
    """Delete a file. By default moves to Recycle Bin (soft delete); if permanent=True, deletes immediately."""
    if permanent:
        deleted = UploadStorageService.delete_file(category, filename)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or could not be permanently deleted",
            )
        logger.info(f"FILE_PERMANENTLY_DELETED user_id='{current_user.id}' category='{category}' filename='{filename}'")
        return {
            "success": True,
            "message": f"File '{filename}' permanently deleted from uploads/{category}/",
            "category": category,
            "filename": filename,
            "permanent": True,
        }
    else:
        try:
            trash_record = UploadStorageService.move_to_trash(
                category=category,
                filename=filename,
                deleted_by=current_user.full_name or current_user.email or "Operator",
            )
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
