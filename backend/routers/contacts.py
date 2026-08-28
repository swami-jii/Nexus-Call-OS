import os
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.models.models import User
from backend.repositories.repositories import contact_repo
from backend.schemas.schemas import (
    ContactCreate,
    ContactOut,
    ContactUpdate,
    PaginatedResponse,
)
from backend.services.upload_storage import UploadStorageService
from backend.services.webhook_dispatcher import emit_domain_event
from backend.utils.document_lead_parser import DocumentLeadParser

router = APIRouter(prefix="/api/contacts", tags=["Audience Contacts"])


class BulkDeleteRequest(BaseModel):
    ids: List[str]


@router.post("/import-csv")
async def import_contacts_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Upload any lead document (CSV, TSV, TXT, XLSX, XLS, JSON),
    save into uploads/contacts/, and bulk insert contacts with 100% dynamic variable preservation.
    """
    filename = file.filename or "contacts_import.csv"
    if not DocumentLeadParser.is_supported_file(filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported document format. Supported formats: .csv, .tsv, .txt, .xlsx, .xls, .json",
        )

    content_bytes = await file.read()
    
    # 1. Save original file to uploads/contacts/
    saved_file = UploadStorageService.save_file(
        category="contacts",
        filename=filename,
        content_bytes=content_bytes,
    )

    # 2. Universal parse rows & auto-extract 100% of columns into custom_variables
    try:
        parsed_records = DocumentLeadParser.parse_document_bytes(
            content_bytes=content_bytes,
            filename=filename,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not parse document '{filename}': {e}",
        )

    created_contacts: List[Any] = []
    saved_filename = saved_file["filename"]
    for record in parsed_records:
        custom_vars = dict(record.get("custom_variables") or {})
        custom_vars["source_file"] = saved_filename
        custom_vars["_source_file"] = saved_filename
        contact_data = {
            **record,
            "custom_variables": custom_vars,
            "organization_id": current_user.organization_id,
        }
        try:
            created = contact_repo.create(db, contact_data)
            created_contacts.append(ContactOut.model_validate(created))
        except Exception:
            continue

    return {
        "success": True,
        "imported_count": len(created_contacts),
        "file": saved_file,
        "message": f"Successfully imported {len(created_contacts)} contacts with dynamic variables from '{saved_file['filename']}'.",
    }


@router.post("/sync-file/{filename}")
def sync_contacts_from_uploaded_file(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Read an existing lead file from uploads/contacts/ and import rows into the active workspace,
    automatically preserving 100% of all column fields as custom variables and tagging source_file.
    """
    file_path = UploadStorageService.get_file_path(category="contacts", filename=filename)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact file '{filename}' not found in uploads/contacts/.",
        )

    try:
        with open(file_path, "rb") as f:
            content_bytes = f.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read contact file '{filename}': {e}",
        )

    try:
        parsed_records = DocumentLeadParser.parse_document_bytes(
            content_bytes=content_bytes,
            filename=filename,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not parse document '{filename}': {e}",
        )

    filters = {}
    if current_user.organization_id:
        filters["organization_id"] = current_user.organization_id
    existing_contacts = contact_repo.get_multi(db, limit=10000, filters=filters)
    
    # Isolate deduplication to contacts belonging to THIS specific file
    this_file_contacts = [
        c for c in existing_contacts
        if (c.custom_variables or {}).get("source_file") == filename
        or (c.custom_variables or {}).get("_source_file") == filename
    ]
    phone_to_file_contact = {
        (c.phone or "").replace(" ", "").replace("-", ""): c
        for c in this_file_contacts if c.phone
    }

    created_contacts: List[Any] = []
    updated_contacts: List[Any] = []

    for record in parsed_records:
        custom_vars = dict(record.get("custom_variables") or {})
        custom_vars["source_file"] = filename
        custom_vars["_source_file"] = filename

        phone_clean = (record.get("phone") or "").replace(" ", "").replace("-", "")
        if phone_clean and phone_clean in phone_to_file_contact:
            existing_c = phone_to_file_contact[phone_clean]
            merged_cv = {**(existing_c.custom_variables or {}), **custom_vars}
            update_payload = {
                "name": record.get("name") or existing_c.name,
                "email": record.get("email") or existing_c.email,
                "tags": list(set((existing_c.tags or []) + (record.get("tags") or []))),
                "custom_variables": merged_cv,
            }
            try:
                updated = contact_repo.update(db, existing_c, update_payload)
                updated_contacts.append(ContactOut.model_validate(updated))
            except Exception:
                pass
        else:
            contact_data = {
                **record,
                "custom_variables": custom_vars,
                "organization_id": current_user.organization_id,
            }
            try:
                created = contact_repo.create(db, contact_data)
                created_contacts.append(ContactOut.model_validate(created))
                if created.phone:
                    phone_to_file_contact[(created.phone or "").replace(" ", "").replace("-", "")] = created
            except Exception:
                continue

    total_synced = len(created_contacts) + len(updated_contacts)
    return {
        "success": True,
        "imported_count": total_synced,
        "created_count": len(created_contacts),
        "updated_count": len(updated_contacts),
        "message": f"Successfully synced {total_synced} contact(s) from '{filename}' into Contact Directory.",
    }


@router.post("/unimport-file/{filename}")
@router.delete("/unimport-file/{filename}")
def unimport_contacts_from_file(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Remove all contacts imported from this specific lead file from the active Directory,
    reverting the import while keeping the physical uploaded file intact in uploads/contacts/.
    """
    filters = {}
    if current_user.organization_id:
        filters["organization_id"] = current_user.organization_id

    contacts = contact_repo.get_multi(db, limit=10000, filters=filters)

    # Collect phones and names from the file in case contacts were imported before explicit source_file tagging
    file_phones = set()
    file_names = set()
    file_path = UploadStorageService.get_file_path(category="contacts", filename=filename)
    if file_path and os.path.exists(file_path):
        try:
            with open(file_path, "rb") as fp:
                parsed = DocumentLeadParser.parse_document_bytes(fp.read(), filename)
            file_phones = {(p.get("phone") or "").replace(" ", "").replace("-", "") for p in parsed if p.get("phone")}
            file_names = {(p.get("name") or "").strip().lower() for p in parsed if p.get("name")}
        except Exception:
            pass

    deleted_count = 0
    for c in contacts:
        cv = c.custom_variables or {}
        sf = cv.get("source_file") or cv.get("_source_file")
        c_phone = (c.phone or "").replace(" ", "").replace("-", "")
        c_name = (c.name or "").strip().lower()

        # Strict matching: if source_file tag exists, must match filename exactly
        if sf:
            is_from_this_file = (sf == filename)
        else:
            is_from_this_file = (c_phone and c_phone in file_phones) or (c_name and c_name in file_names and len(file_names) > 0)

        if is_from_this_file:
            try:
                contact_repo.delete(db, c.id)
                deleted_count += 1
            except Exception:
                continue

    return {
        "success": True,
        "removed_count": deleted_count,
        "filename": filename,
        "message": f"Successfully removed {deleted_count} contact(s) of '{filename}' from Directory. The file remains saved in uploads/contacts/.",
    }


@router.get("", response_model=PaginatedResponse)
def list_contacts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skip = (page - 1) * page_size
    filters = {}
    if current_user.organization_id:
        filters["organization_id"] = current_user.organization_id

    items = contact_repo.get_multi(
        db,
        skip=skip,
        limit=page_size,
        filters=filters,
        search_query=search,
        search_fields=["name", "phone", "email"],
    )
    total = contact_repo.count(
        db,
        filters=filters,
        search_query=search,
        search_fields=["name", "phone", "email"],
    )

    pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": [ContactOut.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(
    contact_in: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = contact_in.model_dump()
    data["organization_id"] = current_user.organization_id
    created_contact = contact_repo.create(db, data)

    try:
        emit_domain_event(
            event_type="contact.created",
            data={
                "contact_id": created_contact.id,
                "name": created_contact.name,
                "phone": created_contact.phone,
                "email": created_contact.email,
                "status": created_contact.status,
                "tags": created_contact.tags,
            },
            organization_id=str(current_user.organization_id) if current_user.organization_id is not None else None,
        )
    except Exception:
        pass

    return created_contact


@router.get("/uploaded-files")
def list_uploaded_contact_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """List all CSV lead files stored in uploads/contacts/ with live Directory sync status."""
    files = UploadStorageService.list_files(category="contacts")
    filters = {}
    if current_user.organization_id:
        filters["organization_id"] = current_user.organization_id

    contacts = contact_repo.get_multi(db, limit=10000, filters=filters)

    # Pre-calculate counts per source_file
    file_contact_count: Dict[str, int] = {}
    for c in contacts:
        cv = c.custom_variables or {}
        sf = cv.get("source_file") or cv.get("_source_file")
        if sf:
            file_contact_count[sf] = file_contact_count.get(sf, 0) + 1

    for f in files:
        fname = f["filename"]
        imported_cnt = file_contact_count.get(fname, 0)

        # Fallback phone check for legacy imports without source_file tag
        if imported_cnt == 0:
            file_path = UploadStorageService.get_file_path(category="contacts", filename=fname)
            if file_path and os.path.exists(file_path):
                try:
                    with open(file_path, "rb") as fp:
                        parsed = DocumentLeadParser.parse_document_bytes(fp.read(), fname)
                    file_phones = {(p.get("phone") or "").replace(" ", "").replace("-", "") for p in parsed if p.get("phone")}
                    if file_phones:
                        matched = 0
                        for c in contacts:
                            cv = dict(c.custom_variables or {})
                            if not cv.get("source_file") and not cv.get("_source_file"):
                                c_phone = (c.phone or "").replace(" ", "").replace("-", "")
                                if c_phone and c_phone in file_phones:
                                    matched += 1
                                    cv["source_file"] = fname
                                    cv["_source_file"] = fname
                                    contact_repo.update(db, c, {"custom_variables": cv})
                        if matched > 0:
                            imported_cnt = matched
                            file_contact_count[fname] = matched
                except Exception:
                    pass

        f["imported_count"] = imported_cnt
        f["is_imported"] = imported_cnt > 0

    return files


@router.get("/{contact_id}", response_model=ContactOut)
def get_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = contact_repo.get_by_id(db, contact_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found"
        )
    return contact


@router.patch("/{contact_id}", response_model=ContactOut)
@router.put("/{contact_id}", response_model=ContactOut)
def update_contact(
    contact_id: str,
    contact_in: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = contact_repo.get_by_id(db, contact_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found"
        )
    update_data = contact_in.model_dump(exclude_unset=True)
    if "first_name" in update_data or "last_name" in update_data:
        fn = update_data.pop("first_name", "") or ""
        ln = update_data.pop("last_name", "") or ""
        if fn or ln:
            update_data["name"] = f"{fn} {ln}".strip()
    if "phone_number" in update_data and "phone" not in update_data:
        update_data["phone"] = update_data.pop("phone_number")
    if "custom_fields" in update_data and "custom_variables" not in update_data:
        update_data["custom_variables"] = update_data.pop("custom_fields")
    if "tags_json" in update_data and "tags" not in update_data:
        update_data["tags"] = update_data.pop("tags_json")

    # Sync company or lead_score into custom_variables only if custom_variables was not explicitly passed
    if "company" in update_data:
        comp = update_data.pop("company")
        if comp is not None:
            if "custom_variables" not in update_data:
                existing_cv = dict(contact.custom_variables or {})
                existing_cv["company"] = comp
                update_data["custom_variables"] = existing_cv
            elif isinstance(update_data["custom_variables"], dict):
                update_data["custom_variables"]["company"] = comp

    if "lead_score" in update_data or "leadScore" in update_data:
        score_val = update_data.pop("lead_score", None) or update_data.pop("leadScore", None)
        if score_val is not None:
            if "custom_variables" not in update_data:
                existing_cv = dict(contact.custom_variables or {})
                existing_cv["lead_score"] = score_val
                update_data["custom_variables"] = existing_cv
            elif isinstance(update_data["custom_variables"], dict):
                update_data["custom_variables"]["lead_score"] = score_val

    updated_contact = contact_repo.update(db, contact, update_data)
    
    try:
        emit_domain_event(
            event_type="contact.updated",
            data={
                "contact_id": updated_contact.id,
                "name": updated_contact.name,
                "phone": updated_contact.phone,
                "email": updated_contact.email,
                "status": updated_contact.status,
                "tags": updated_contact.tags,
            },
            organization_id=str(current_user.organization_id) if current_user.organization_id is not None else None,
        )
    except Exception:
        pass

    return updated_contact


@router.delete("/bulk/delete")
@router.post("/bulk/delete")
def bulk_delete_contacts(
    payload: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete multiple contacts by their IDs."""
    deleted_count = 0
    for cid in payload.ids:
        try:
            contact = contact_repo.get_by_id(db, cid)
            if contact:
                contact_repo.delete(db, cid)
                deleted_count += 1
        except Exception:
            continue
    return {
        "success": True,
        "deleted_count": deleted_count,
        "message": f"Successfully deleted {deleted_count} contacts.",
    }


@router.delete("/clear-all/all")
@router.post("/clear-all/all")
def clear_all_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clear all contacts from the database for the active workspace."""
    filters = {}
    if current_user.organization_id:
        filters["organization_id"] = current_user.organization_id

    all_contacts = contact_repo.get_multi(db, limit=10000, filters=filters)
    count = len(all_contacts)
    for c in all_contacts:
        contact_repo.delete(db, c.id)

    return {
        "success": True,
        "deleted_count": count,
        "message": f"Cleared all {count} contacts from database.",
    }




@router.delete("/{contact_id}")
def delete_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = contact_repo.get_by_id(db, contact_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found"
        )
    contact_repo.delete(db, contact_id)
    return {"message": "Contact deleted successfully", "id": contact_id}
