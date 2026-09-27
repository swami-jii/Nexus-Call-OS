import json
import logging
import os
import shutil
import time
import uuid
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

SUPER_ADMIN_ORG_ID = "75f9e082-62d6-4382-b04f-3127917c1dfe"

# Base Uploads directory located at project root / uploads
ROOT_UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
)

UPLOAD_CATEGORIES: Dict[str, Dict[str, str]] = {
    "agent_memory_brain": {
        "name": "Agent Memory Brain",
        "description": "Multi-device session context graphs, dialogue memory, and cognitive facts",
        "icon": "Brain",
    },
    "ai_voice_agents": {
        "name": "AI Voice Agents",
        "description": "Voice clone training samples, IVR speech prompts, and audio assets",
        "icon": "Headphones",
    },
    "call_history": {
        "name": "Call History",
        "description": "Live studio demo recordings, AI campaign dials, and customer call audio",
        "icon": "PhoneCall",
    },
    "contacts": {
        "name": "Contacts",
        "description": "Imported CSV and spreadsheet lead lists",
        "icon": "Users",
    },
    "knowledge_base": {
        "name": "Knowledge Base (RAG)",
        "description": "PDF manuals, documents, text files, and training materials",
        "icon": "BookOpen",
    },
    "user_profile": {
        "name": "User Profile",
        "description": "User avatar pictures and banner covers",
        "icon": "User",
    },
    "invoice_assets": {
        "name": "Invoice Master Assets",
        "description": "Uploaded logos, digital mohar stamps, corporate seals, and signatory graphics for invoices",
        "icon": "FileText",
    },
    "voice_workflows": {
        "name": "Voice Workflows",
        "description": "Imported workflow JSON templates and graph definitions",
        "icon": "GitFork",
    },
}

CATEGORY_ALIASES: Dict[str, str] = {
    "memory": "agent_memory_brain",
    "agent_memory": "agent_memory_brain",
    "audio": "ai_voice_agents",
    "voice_agents": "ai_voice_agents",
    "recordings": "call_history",
    "calls": "call_history",
    "call_recordings": "call_history",
    "profiles": "user_profile",
    "profile": "user_profile",
    "workflows": "voice_workflows",
    "workflow": "voice_workflows",
    "invoice": "invoice_assets",
    "invoices": "invoice_assets",
    "invoice_logos": "invoice_assets",
    "invoice_seals": "invoice_assets",
}


class UploadStorageService:
    @classmethod
    def _resolve_org_id(cls, organization_id: Optional[str] = None) -> str:
        """Resolve valid tenant organization ID. Falls back to Super Admin for system operations."""
        if organization_id and str(organization_id).strip():
            return str(organization_id).strip()
        return SUPER_ADMIN_ORG_ID

    @classmethod
    def get_base_dir(cls, organization_id: Optional[str] = None) -> str:
        org_id = cls._resolve_org_id(organization_id)
        org_dir = os.path.join(ROOT_UPLOAD_DIR, org_id)
        os.makedirs(org_dir, exist_ok=True)
        return org_dir

    @classmethod
    def get_recycle_bin_dir(cls, organization_id: Optional[str] = None) -> str:
        recycle_dir = os.path.join(cls.get_base_dir(organization_id), ".recycle_bin")
        os.makedirs(recycle_dir, exist_ok=True)
        return recycle_dir

    @classmethod
    def get_trash_registry_path(cls, organization_id: Optional[str] = None) -> str:
        return os.path.join(cls.get_recycle_bin_dir(organization_id), "trash_registry.json")

    @classmethod
    def get_category_dir(cls, category: str, organization_id: Optional[str] = None) -> str:
        safe_cat = category.strip().lower() if category else "knowledge_base"
        safe_cat = CATEGORY_ALIASES.get(safe_cat, safe_cat)
        if safe_cat not in UPLOAD_CATEGORIES:
            safe_cat = "knowledge_base"
        cat_dir = os.path.join(cls.get_base_dir(organization_id), safe_cat)
        os.makedirs(cat_dir, exist_ok=True)
        return cat_dir

    @classmethod
    def initialize_storage(cls) -> None:
        """Ensure storage exists on disk and perform migration of legacy flat directories and tenant synchronization."""
        os.makedirs(ROOT_UPLOAD_DIR, exist_ok=True)

        # 1. Migrate legacy un-scoped files from root uploads/ into Super Admin org directory
        cls._migrate_legacy_flat_storage()

        # 2. Ensure Super Admin categories and cache exist
        admin_base = cls.get_base_dir(SUPER_ADMIN_ORG_ID)
        for cat_key in UPLOAD_CATEGORIES.keys():
            os.makedirs(os.path.join(admin_base, cat_key), exist_ok=True)
        os.makedirs(os.path.join(admin_base, "knowledge_base", "cache"), exist_ok=True)
        os.makedirs(cls.get_recycle_bin_dir(SUPER_ADMIN_ORG_ID), exist_ok=True)

        # 3. Synchronize all registered tenant files from database to disk
        cls.sync_tenant_storage(None)

    @classmethod
    def sync_tenant_storage(cls, organization_id: Optional[str] = None) -> None:
        """
        Synchronize registered database documents and media with physical tenant directories.
        Guarantees that files uploaded or registered for this tenant are present in uploads/{org_id}/{category}/.
        """
        try:
            from backend.database.session import SessionLocal
            from backend.models.models import KnowledgeDocument, Contact, CallLog, AgentSessionMemory, Organization
        except ImportError:
            return

        target_org_ids: List[str] = []
        if organization_id and str(organization_id).strip():
            target_org_ids = [str(organization_id).strip()]
        else:
            try:
                with SessionLocal() as db:
                    orgs = db.query(Organization).all()
                    target_org_ids = [str(o.id) for o in orgs if o.id]
                    if SUPER_ADMIN_ORG_ID not in target_org_ids:
                        target_org_ids.append(SUPER_ADMIN_ORG_ID)
            except Exception as e:
                logger.debug(f"Could not load organizations from DB for storage sync: {e}")
                target_org_ids = [SUPER_ADMIN_ORG_ID]

        try:
            with SessionLocal() as db:
                for org_id in target_org_ids:
                    # Ensure all 7 base folders exist for tenant
                    tenant_base = cls.get_base_dir(org_id)
                    for cat_key in UPLOAD_CATEGORIES.keys():
                        os.makedirs(os.path.join(tenant_base, cat_key), exist_ok=True)
                    os.makedirs(os.path.join(tenant_base, "knowledge_base", "cache"), exist_ok=True)
                    os.makedirs(cls.get_recycle_bin_dir(org_id), exist_ok=True)

                    # 1. Sync Knowledge Documents for this tenant
                    kb_dir = cls.get_category_dir("knowledge_base", organization_id=org_id)
                    kb_docs = db.query(KnowledgeDocument).filter(
                        KnowledgeDocument.organization_id == org_id
                    ).all()

                    for doc in kb_docs:
                        if not doc.title:
                            continue
                        dest_file = os.path.join(kb_dir, doc.title)
                        if not os.path.exists(dest_file):
                            candidate_sources = []
                            if doc.file_path and os.path.exists(doc.file_path) and os.path.isfile(doc.file_path):
                                candidate_sources.append(doc.file_path)
                            # Super admin folder
                            admin_kb = os.path.join(ROOT_UPLOAD_DIR, SUPER_ADMIN_ORG_ID, "knowledge_base", doc.title)
                            if os.path.exists(admin_kb):
                                candidate_sources.append(admin_kb)
                            # Root uploads knowledge_base folder
                            root_kb = os.path.join(ROOT_UPLOAD_DIR, "knowledge_base", doc.title)
                            if os.path.exists(root_kb):
                                candidate_sources.append(root_kb)
                            # Root uploads loose file
                            root_loose = os.path.join(ROOT_UPLOAD_DIR, doc.title)
                            if os.path.exists(root_loose):
                                candidate_sources.append(root_loose)

                            for src in candidate_sources:
                                if os.path.isfile(src) and src != dest_file:
                                    try:
                                        if org_id == SUPER_ADMIN_ORG_ID or not src.startswith(os.path.join(ROOT_UPLOAD_DIR, SUPER_ADMIN_ORG_ID)):
                                            shutil.copy2(src, dest_file)
                                        else:
                                            # If currently in super admin folder but belongs to this tenant, move it
                                            shutil.move(src, dest_file)
                                        # Also sync companion extracted json
                                        ext_src = f"{src}.extracted.json"
                                        ext_dst = f"{dest_file}.extracted.json"
                                        if os.path.exists(ext_src) and not os.path.exists(ext_dst):
                                            try:
                                                if org_id == SUPER_ADMIN_ORG_ID or not ext_src.startswith(os.path.join(ROOT_UPLOAD_DIR, SUPER_ADMIN_ORG_ID)):
                                                    shutil.copy2(ext_src, ext_dst)
                                                else:
                                                    shutil.move(ext_src, ext_dst)
                                            except Exception:
                                                pass
                                        doc.file_path = dest_file
                                        break
                                    except Exception as err:
                                        logger.warning(f"Error syncing KB doc {doc.title} to {dest_file}: {err}")

                    # 2. Sync Call History recordings for this tenant
                    call_dir = cls.get_category_dir("call_history", organization_id=org_id)
                    sessions = db.query(AgentSessionMemory).filter(
                        AgentSessionMemory.organization_id == org_id,
                        AgentSessionMemory.recording_url != None,
                    ).all()
                    for s in sessions:
                        if not s.recording_url:
                            continue
                        rec_filename = os.path.basename(s.recording_url.split("?")[0])
                        if not rec_filename or not rec_filename.endswith((".mp3", ".wav", ".webm", ".m4a", ".ogg")):
                            continue
                        dest_file = os.path.join(call_dir, rec_filename)
                        if not os.path.exists(dest_file):
                            candidate_sources = [
                                os.path.join(ROOT_UPLOAD_DIR, SUPER_ADMIN_ORG_ID, "call_history", rec_filename),
                                os.path.join(ROOT_UPLOAD_DIR, "call_history", rec_filename),
                                os.path.join(ROOT_UPLOAD_DIR, "recordings", rec_filename),
                            ]
                            for src in candidate_sources:
                                if os.path.exists(src) and os.path.isfile(src) and src != dest_file:
                                    try:
                                        if org_id == SUPER_ADMIN_ORG_ID or not src.startswith(os.path.join(ROOT_UPLOAD_DIR, SUPER_ADMIN_ORG_ID)):
                                            shutil.copy2(src, dest_file)
                                        else:
                                            shutil.move(src, dest_file)
                                        break
                                    except Exception:
                                        pass

                    # 3. Sync Contacts lead sheets for this tenant
                    contacts_dir = cls.get_category_dir("contacts", organization_id=org_id)
                    contacts_with_files = db.query(Contact).filter(
                        Contact.organization_id == org_id
                    ).all()
                    seen_sources = set()
                    for c in contacts_with_files:
                        if c.custom_variables and isinstance(c.custom_variables, dict):
                            src_file = c.custom_variables.get("source_file") or c.custom_variables.get("_source_file")
                            if src_file and src_file not in seen_sources:
                                seen_sources.add(src_file)
                                dest_file = os.path.join(contacts_dir, src_file)
                                if not os.path.exists(dest_file):
                                    candidate_sources = [
                                        os.path.join(ROOT_UPLOAD_DIR, SUPER_ADMIN_ORG_ID, "contacts", src_file),
                                        os.path.join(ROOT_UPLOAD_DIR, "contacts", src_file),
                                    ]
                                    for src in candidate_sources:
                                        if os.path.exists(src) and os.path.isfile(src) and src != dest_file:
                                            try:
                                                if org_id == SUPER_ADMIN_ORG_ID or not src.startswith(os.path.join(ROOT_UPLOAD_DIR, SUPER_ADMIN_ORG_ID)):
                                                    shutil.copy2(src, dest_file)
                                                else:
                                                    shutil.move(src, dest_file)
                                                break
                                            except Exception:
                                                pass

                db.commit()
        except Exception as e:
            logger.error(f"Error during sync_tenant_storage for org '{organization_id}': {e}")

    @classmethod
    def _migrate_legacy_flat_storage(cls) -> None:
        """Move legacy un-scoped folders/files at uploads/<category> into uploads/<SUPER_ADMIN_ORG_ID>/<category>/."""
        admin_base = os.path.join(ROOT_UPLOAD_DIR, SUPER_ADMIN_ORG_ID)
        os.makedirs(admin_base, exist_ok=True)

        # 1. Move flat category folders
        for cat in list(UPLOAD_CATEGORIES.keys()) + ["recordings", "audio", "workflows", "profiles", "memory", "cache"]:
            old_path = os.path.join(ROOT_UPLOAD_DIR, cat)
            if os.path.exists(old_path) and os.path.isdir(old_path):
                # Target category name
                target_cat = CATEGORY_ALIASES.get(cat, cat)
                target_dir = os.path.join(admin_base, target_cat)
                os.makedirs(target_dir, exist_ok=True)

                try:
                    for item in os.listdir(old_path):
                        if item == ".gitkeep":
                            continue
                        src = os.path.join(old_path, item)
                        dst = os.path.join(target_dir, item)
                        if not os.path.exists(dst):
                            shutil.move(src, dst)
                            logger.info(f"MIGRATED_TENANT_FILE: uploads/{cat}/{item} -> uploads/{SUPER_ADMIN_ORG_ID}/{target_cat}/{item}")
                        elif os.path.isfile(src):
                            try:
                                os.remove(src)
                            except OSError:
                                pass
                    # If empty now, remove old flat dir
                    remaining = [f for f in os.listdir(old_path) if f != ".gitkeep"]
                    if not remaining:
                        shutil.rmtree(old_path, ignore_errors=True)
                except Exception as e:
                    logger.warning(f"Error migrating flat category folder {old_path}: {e}")

        # 2. Move root .recycle_bin
        old_trash = os.path.join(ROOT_UPLOAD_DIR, ".recycle_bin")
        if os.path.exists(old_trash) and os.path.isdir(old_trash):
            target_trash = os.path.join(admin_base, ".recycle_bin")
            os.makedirs(target_trash, exist_ok=True)
            try:
                for item in os.listdir(old_trash):
                    src = os.path.join(old_trash, item)
                    dst = os.path.join(target_trash, item)
                    if not os.path.exists(dst):
                        shutil.move(src, dst)
                shutil.rmtree(old_trash, ignore_errors=True)
            except Exception as e:
                logger.warning(f"Error migrating root recycle bin: {e}")

        # 3. Move loose root files to knowledge_base
        try:
            for item in os.listdir(ROOT_UPLOAD_DIR):
                if item.startswith(".") or item == SUPER_ADMIN_ORG_ID:
                    continue
                item_path = os.path.join(ROOT_UPLOAD_DIR, item)
                if os.path.isfile(item_path):
                    target_dir = os.path.join(admin_base, "knowledge_base")
                    os.makedirs(target_dir, exist_ok=True)
                    target_path = os.path.join(target_dir, item)
                    if not os.path.exists(target_path):
                        shutil.move(item_path, target_path)
        except Exception as e:
            logger.warning(f"Error migrating loose root files: {e}")

    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        cleaned = os.path.basename(filename)
        cleaned = "".join(c for c in cleaned if c.isalnum() or c in (".", "_", "-", " ", "(", ")"))
        return cleaned.strip() or "unnamed_file"

    @classmethod
    def save_file(
        cls,
        category: str,
        filename: str,
        content_bytes: bytes,
        overwrite: bool = False,
        organization_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        cat_dir = cls.get_category_dir(category, organization_id=organization_id)
        safe_name = cls.sanitize_filename(filename)

        file_path = os.path.join(cat_dir, safe_name)

        if not overwrite and os.path.exists(file_path):
            base_name, ext = os.path.splitext(safe_name)
            timestamp = int(time.time())
            safe_name = f"{base_name}_{timestamp}{ext}"
            file_path = os.path.join(cat_dir, safe_name)

        with open(file_path, "wb") as f:
            f.write(content_bytes)

        file_size = len(content_bytes)
        return {
            "category": category,
            "filename": safe_name,
            "original_name": filename,
            "file_path": file_path,
            "file_size_bytes": file_size,
            "file_size_formatted": cls.format_size(file_size),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "download_url": f"/api/uploads/{category}/{safe_name}",
        }

    @classmethod
    def get_file_path(
        cls, category: str, filename: str, organization_id: Optional[str] = None
    ) -> Optional[str]:
        org_id = cls._resolve_org_id(organization_id)
        cat_dir = cls.get_category_dir(category, organization_id=org_id)
        safe_name = cls.sanitize_filename(filename)
        file_path = os.path.join(cat_dir, safe_name)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return file_path

        # Try sync and check again
        cls.sync_tenant_storage(org_id)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return file_path

        # Fallback to Super Admin or root if system asset
        admin_cat_dir = cls.get_category_dir(category, organization_id=SUPER_ADMIN_ORG_ID)
        admin_path = os.path.join(admin_cat_dir, safe_name)
        if os.path.exists(admin_path) and os.path.isfile(admin_path):
            return admin_path

        # Fallback search across all tenant directories in uploads
        if os.path.exists(ROOT_UPLOAD_DIR):
            for t_item in os.listdir(ROOT_UPLOAD_DIR):
                if t_item.startswith("."):
                    continue
                cand_cat_dir = cls.get_category_dir(category, organization_id=t_item)
                cand_path = os.path.join(cand_cat_dir, safe_name)
                if os.path.exists(cand_path) and os.path.isfile(cand_path):
                    return cand_path

        return None

    @classmethod
    def delete_file(
        cls, category: str, filename: str, organization_id: Optional[str] = None
    ) -> bool:
        """Immediate physical deletion without recycle bin."""
        cat_dir = cls.get_category_dir(category, organization_id=organization_id)
        safe_name = cls.sanitize_filename(filename)
        file_path = os.path.join(cat_dir, safe_name)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            try:
                os.remove(file_path)
                extracted_path = f"{file_path}.extracted.json"
                if os.path.exists(extracted_path):
                    try:
                        os.remove(extracted_path)
                    except OSError:
                        pass
                return True
            except OSError as e:
                logger.error(f"Failed to delete file {file_path}: {e}")
                return False
        return False

    # -------------------------------------------------------------
    # Recycle Bin (Trash, Restore & Purge System) - Scoped per Org
    # -------------------------------------------------------------

    @classmethod
    def _read_trash_registry(cls, organization_id: Optional[str] = None) -> List[Dict[str, Any]]:
        reg_path = cls.get_trash_registry_path(organization_id)
        if not os.path.exists(reg_path):
            return []
        try:
            with open(reg_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to read trash registry for org '{organization_id}': {e}")
            return []

    @classmethod
    def _write_trash_registry(
        cls, items: List[Dict[str, Any]], organization_id: Optional[str] = None
    ) -> None:
        reg_path = cls.get_trash_registry_path(organization_id)
        try:
            with open(reg_path, "w", encoding="utf-8") as f:
                json.dump(items, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to write trash registry for org '{organization_id}': {e}")

    @classmethod
    def move_to_trash(
        cls,
        category: str,
        filename: str,
        deleted_by: Optional[str] = None,
        organization_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Soft delete: moves file to tenant's .recycle_bin with full metadata."""
        src_path = cls.get_file_path(category, filename, organization_id=organization_id)
        if not src_path or not os.path.exists(src_path):
            raise FileNotFoundError(f"File '{filename}' not found in category '{category}'")

        trash_dir = cls.get_recycle_bin_dir(organization_id)
        trash_id = str(uuid.uuid4())
        ext = os.path.splitext(filename)[1]
        stored_name = f"{trash_id}_{cls.sanitize_filename(filename)}"
        dst_path = os.path.join(trash_dir, stored_name)

        stat = os.stat(src_path)
        file_size = stat.st_size

        # Move physical file to .recycle_bin/
        shutil.move(src_path, dst_path)

        # Move any extracted companion files if present
        extracted_src = f"{src_path}.extracted.json"
        extracted_dst = f"{dst_path}.extracted.json"
        if os.path.exists(extracted_src):
            try:
                shutil.move(extracted_src, extracted_dst)
            except OSError:
                pass

        trash_record = {
            "trash_id": trash_id,
            "filename": filename,
            "stored_filename": stored_name,
            "category": category,
            "category_name": UPLOAD_CATEGORIES.get(category, {}).get("name", category),
            "file_type": ext.upper().replace(".", "") or "FILE",
            "size_bytes": file_size,
            "size_formatted": cls.format_size(file_size),
            "deleted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "deleted_by": deleted_by or "Operator",
            "original_path": src_path,
            "trash_path": dst_path,
            "organization_id": cls._resolve_org_id(organization_id),
        }

        registry = cls._read_trash_registry(organization_id)
        registry.insert(0, trash_record)
        cls._write_trash_registry(registry, organization_id)

        logger.info(f"MOVED_TO_RECYCLE_BIN trash_id='{trash_id}' file='{filename}' org='{organization_id}'")
        return trash_record

    @classmethod
    def list_trash(cls, organization_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return all items currently held in the tenant's Recycle Bin."""
        registry = cls._read_trash_registry(organization_id)
        trash_dir = cls.get_recycle_bin_dir(organization_id)

        valid_items: List[Dict[str, Any]] = []
        for item in registry:
            p = os.path.join(trash_dir, item["stored_filename"])
            if os.path.exists(p):
                valid_items.append(item)

        if len(valid_items) != len(registry):
            cls._write_trash_registry(valid_items, organization_id)

        return valid_items

    @classmethod
    def get_trash_file_path(
        cls, trash_id: str, organization_id: Optional[str] = None
    ) -> Optional[str]:
        registry = cls._read_trash_registry(organization_id)
        item = next((r for r in registry if r["trash_id"] == trash_id), None)
        if not item:
            return None
        trash_dir = cls.get_recycle_bin_dir(organization_id)
        p = os.path.join(trash_dir, item["stored_filename"])
        if os.path.exists(p):
            return p
        return None

    @classmethod
    def restore_from_trash(
        cls, trash_id: str, organization_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Restore a trashed item back to its original category subfolder."""
        registry = cls._read_trash_registry(organization_id)
        item = next((r for r in registry if r["trash_id"] == trash_id), None)
        if not item:
            raise FileNotFoundError(f"Trash record with id '{trash_id}' not found")

        trash_dir = cls.get_recycle_bin_dir(organization_id)
        trash_file = os.path.join(trash_dir, item["stored_filename"])
        if not os.path.exists(trash_file):
            raise FileNotFoundError(f"Physical file '{item['stored_filename']}' missing in recycle bin")

        dest_dir = cls.get_category_dir(item["category"], organization_id=organization_id)
        dest_file = os.path.join(dest_dir, item["filename"])

        if os.path.exists(dest_file):
            base, ext = os.path.splitext(item["filename"])
            dest_file = os.path.join(dest_dir, f"{base}_restored_{int(time.time())}{ext}")

        shutil.move(trash_file, dest_file)

        ext_src = f"{trash_file}.extracted.json"
        ext_dst = f"{dest_file}.extracted.json"
        if os.path.exists(ext_src):
            try:
                shutil.move(ext_src, ext_dst)
            except OSError:
                pass

        new_registry = [r for r in registry if r["trash_id"] != trash_id]
        cls._write_trash_registry(new_registry, organization_id)

        logger.info(f"RESTORED_FROM_RECYCLE_BIN trash_id='{trash_id}' file='{item['filename']}' org='{organization_id}'")
        return {
            "success": True,
            "trash_id": trash_id,
            "filename": os.path.basename(dest_file),
            "category": item["category"],
            "restored_path": dest_file,
            "message": f"File '{item['filename']}' restored successfully to uploads/{item['category']}/",
        }

    @classmethod
    def permanently_delete_from_trash(
        cls, trash_id: str, organization_id: Optional[str] = None
    ) -> bool:
        """Permanent purge: wipes physical file and registry entry completely."""
        registry = cls._read_trash_registry(organization_id)
        item = next((r for r in registry if r["trash_id"] == trash_id), None)
        if not item:
            return False

        trash_dir = cls.get_recycle_bin_dir(organization_id)
        trash_file = os.path.join(trash_dir, item["stored_filename"])
        if os.path.exists(trash_file):
            try:
                os.remove(trash_file)
            except OSError as e:
                logger.error(f"Failed to remove trash file {trash_file}: {e}")

        ext_file = f"{trash_file}.extracted.json"
        if os.path.exists(ext_file):
            try:
                os.remove(ext_file)
            except OSError:
                pass

        new_registry = [r for r in registry if r["trash_id"] != trash_id]
        cls._write_trash_registry(new_registry, organization_id)

        logger.info(f"PERMANENTLY_PURGED_FROM_TRASH trash_id='{trash_id}' org='{organization_id}'")
        return True

    @classmethod
    def empty_trash(cls, organization_id: Optional[str] = None) -> int:
        """Purge all files in the tenant's Recycle Bin."""
        registry = cls._read_trash_registry(organization_id)
        purged_count = 0
        trash_dir = cls.get_recycle_bin_dir(organization_id)

        for item in registry:
            trash_file = os.path.join(trash_dir, item["stored_filename"])
            if os.path.exists(trash_file):
                try:
                    os.remove(trash_file)
                    purged_count += 1
                except OSError:
                    pass
            ext_file = f"{trash_file}.extracted.json"
            if os.path.exists(ext_file):
                try:
                    os.remove(ext_file)
                except OSError:
                    pass

        cls._write_trash_registry([], organization_id)
        logger.info(f"RECYCLE_BIN_EMPTIED purged_count={purged_count} org='{organization_id}'")
        return purged_count

    @classmethod
    def get_trash_stats(cls, organization_id: Optional[str] = None) -> Dict[str, Any]:
        """Get summary statistics of items held in the tenant's Recycle Bin."""
        trash_items = cls.list_trash(organization_id)
        total_bytes = sum(item.get("size_bytes", 0) for item in trash_items)
        return {
            "total_items": len(trash_items),
            "total_bytes": total_bytes,
            "total_formatted": cls.format_size(total_bytes),
            "oldest_item": trash_items[-1]["deleted_at"] if trash_items else None,
            "newest_item": trash_items[0]["deleted_at"] if trash_items else None,
        }

    # -------------------------------------------------------------
    # Active Files & Category Stats (Tenant Isolated)
    # -------------------------------------------------------------

    @classmethod
    def list_files(
        cls, category: Optional[str] = None, organization_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        org_id = cls._resolve_org_id(organization_id)
        cls.sync_tenant_storage(org_id)

        results: List[Dict[str, Any]] = []
        if category and category.strip().upper() != "ALL":
            norm_cat = CATEGORY_ALIASES.get(category.strip().lower(), category.strip().lower())
            categories_to_scan = [norm_cat] if norm_cat in UPLOAD_CATEGORIES else list(UPLOAD_CATEGORIES.keys())
        else:
            categories_to_scan = list(UPLOAD_CATEGORIES.keys())

        for cat in categories_to_scan:
            cat_dir = cls.get_category_dir(cat, organization_id=org_id)
            if not os.path.exists(cat_dir):
                continue
            for item in os.listdir(cat_dir):
                if item == "cache" or item.startswith(".") or item.endswith(".extracted.json"):
                    continue
                item_path = os.path.join(cat_dir, item)
                if os.path.isfile(item_path):
                    stat = os.stat(item_path)
                    size_bytes = stat.st_size
                    ext = os.path.splitext(item)[1].lower().replace(".", "")
                    results.append({
                        "id": f"{cat}_{item}",
                        "filename": item,
                        "category": cat,
                        "category_name": UPLOAD_CATEGORIES.get(cat, {}).get("name", cat),
                        "file_type": ext.upper() or "FILE",
                        "size_bytes": size_bytes,
                        "size_formatted": cls.format_size(size_bytes),
                        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(stat.st_mtime)),
                        "download_url": f"/api/uploads/{cat}/{item}",
                    })

        results.sort(key=lambda x: x["created_at"], reverse=True)
        return results

    @classmethod
    def get_category_stats(cls, organization_id: Optional[str] = None) -> Dict[str, Any]:
        org_id = cls._resolve_org_id(organization_id)
        cls.sync_tenant_storage(org_id)

        stats: Dict[str, Any] = {}
        total_all_bytes = 0
        total_all_files = 0

        for cat, meta in UPLOAD_CATEGORIES.items():
            cat_dir = cls.get_category_dir(cat, organization_id=org_id)
            file_count = 0
            cat_bytes = 0
            if os.path.exists(cat_dir):
                for item in os.listdir(cat_dir):
                    if item == "cache" or item.startswith(".") or item.endswith(".extracted.json"):
                        continue
                    p = os.path.join(cat_dir, item)
                    if os.path.isfile(p):
                        file_count += 1
                        cat_bytes += os.path.getsize(p)

            total_all_bytes += cat_bytes
            total_all_files += file_count

            stats[cat] = {
                "key": cat,
                "name": meta["name"],
                "description": meta["description"],
                "icon": meta["icon"],
                "file_count": file_count,
                "total_bytes": cat_bytes,
                "total_formatted": cls.format_size(cat_bytes),
            }

        return {
            "categories": stats,
            "total_files": total_all_files,
            "total_bytes": total_all_bytes,
            "total_formatted": cls.format_size(total_all_bytes),
        }

    @staticmethod
    def format_size(size_bytes: int) -> str:
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{round(size_bytes / 1024, 1)} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            return f"{round(size_bytes / (1024 * 1024), 2)} MB"
        else:
            return f"{round(size_bytes / (1024 * 1024 * 1024), 2)} GB"
