import json
import logging
import os
import shutil
import time
import uuid
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Base Uploads directory located at project root / uploads
BASE_UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
)
RECYCLE_BIN_DIR = os.path.join(BASE_UPLOAD_DIR, ".recycle_bin")
TRASH_REGISTRY_PATH = os.path.join(RECYCLE_BIN_DIR, "trash_registry.json")

UPLOAD_CATEGORIES: Dict[str, Dict[str, str]] = {
    "knowledge_base": {
        "name": "Knowledge Base (RAG)",
        "description": "PDF manuals, documents, text files, and training materials",
        "icon": "BookOpen",
    },
    "contacts": {
        "name": "Contacts & Leads",
        "description": "Imported CSV and spreadsheet lead lists",
        "icon": "Users",
    },
    "audio": {
        "name": "Audio & Voice Prompts",
        "description": "Voice cloning audio samples, IVR audio prompts, and sound effects",
        "icon": "Mic",
    },
    "workflows": {
        "name": "Voice Workflows",
        "description": "Imported workflow JSON templates and graph definitions",
        "icon": "GitFork",
    },
    "profiles": {
        "name": "Profile Media",
        "description": "User avatar pictures and banner covers",
        "icon": "User",
    },
    "integrations": {
        "name": "API & Integrations",
        "description": "Integration configurations, schemas, and API docs",
        "icon": "Blocks",
    },
    "recordings": {
        "name": "Call Recordings",
        "description": "Call stream recordings and voice session media",
        "icon": "PlayCircle",
    },
}


class UploadStorageService:
    @classmethod
    def get_base_dir(cls) -> str:
        os.makedirs(BASE_UPLOAD_DIR, exist_ok=True)
        return BASE_UPLOAD_DIR

    @classmethod
    def get_recycle_bin_dir(cls) -> str:
        os.makedirs(RECYCLE_BIN_DIR, exist_ok=True)
        return RECYCLE_BIN_DIR

    @classmethod
    def get_category_dir(cls, category: str) -> str:
        safe_cat = category.strip().lower() if category else "knowledge_base"
        if safe_cat not in UPLOAD_CATEGORIES:
            safe_cat = "knowledge_base"
        cat_dir = os.path.join(cls.get_base_dir(), safe_cat)
        os.makedirs(cat_dir, exist_ok=True)
        return cat_dir

    @classmethod
    def initialize_storage(cls) -> None:
        """Ensure all category subfolders and recycle bin exist on disk."""
        base_dir = cls.get_base_dir()
        for cat_key in UPLOAD_CATEGORIES.keys():
            os.makedirs(os.path.join(base_dir, cat_key), exist_ok=True)
        # Also ensure knowledge_base/cache exists for vector deduplication
        os.makedirs(os.path.join(base_dir, "knowledge_base", "cache"), exist_ok=True)
        # Ensure recycle bin folder and registry exist
        os.makedirs(RECYCLE_BIN_DIR, exist_ok=True)
        if not os.path.exists(TRASH_REGISTRY_PATH):
            cls._write_trash_registry([])

        # Migrate any root uploads if present
        cls._migrate_root_files()

    @classmethod
    def _migrate_root_files(cls) -> None:
        """Migrate legacy files lying in root uploads folder to knowledge_base category."""
        base_dir = cls.get_base_dir()
        try:
            for item in os.listdir(base_dir):
                if item.startswith("."):
                    continue
                item_path = os.path.join(base_dir, item)
                if os.path.isfile(item_path):
                    target_dir = os.path.join(base_dir, "knowledge_base")
                    target_path = os.path.join(target_dir, item)
                    if not os.path.exists(target_path):
                        shutil.move(item_path, target_path)
                        logger.info(f"MIGRATED_LEGACY_UPLOAD: {item} -> uploads/knowledge_base/")
        except Exception as e:
            logger.warning(f"Error during legacy upload migration: {e}")

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
    ) -> Dict[str, Any]:
        cat_dir = cls.get_category_dir(category)
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
    def get_file_path(cls, category: str, filename: str) -> Optional[str]:
        cat_dir = cls.get_category_dir(category)
        safe_name = cls.sanitize_filename(filename)
        file_path = os.path.join(cat_dir, safe_name)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return file_path
        return None

    @classmethod
    def delete_file(cls, category: str, filename: str) -> bool:
        """Immediate physical deletion without recycle bin."""
        cat_dir = cls.get_category_dir(category)
        safe_name = cls.sanitize_filename(filename)
        file_path = os.path.join(cat_dir, safe_name)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            try:
                os.remove(file_path)
                # If there's an extracted json or cache for knowledge base, clean it too
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
    # Recycle Bin (Trash, Restore & Purge System)
    # -------------------------------------------------------------

    @classmethod
    def _read_trash_registry(cls) -> List[Dict[str, Any]]:
        cls.get_recycle_bin_dir()
        if not os.path.exists(TRASH_REGISTRY_PATH):
            return []
        try:
            with open(TRASH_REGISTRY_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to read trash registry: {e}")
            return []

    @classmethod
    def _write_trash_registry(cls, items: List[Dict[str, Any]]) -> None:
        cls.get_recycle_bin_dir()
        try:
            with open(TRASH_REGISTRY_PATH, "w", encoding="utf-8") as f:
                json.dump(items, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to write trash registry: {e}")

    @classmethod
    def move_to_trash(
        cls,
        category: str,
        filename: str,
        deleted_by: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Soft delete: moves file to .recycle_bin with full metadata."""
        src_path = cls.get_file_path(category, filename)
        if not src_path or not os.path.exists(src_path):
            raise FileNotFoundError(f"File '{filename}' not found in category '{category}'")

        trash_dir = cls.get_recycle_bin_dir()
        trash_id = str(uuid.uuid4())
        ext = os.path.splitext(filename)[1]
        stored_name = f"{trash_id}_{cls.sanitize_filename(filename)}"
        dst_path = os.path.join(trash_dir, stored_name)

        stat = os.stat(src_path)
        file_size = stat.st_size

        # Move the physical file to .recycle_bin/
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
        }

        registry = cls._read_trash_registry()
        registry.insert(0, trash_record)
        cls._write_trash_registry(registry)

        logger.info(f"MOVED_TO_RECYCLE_BIN trash_id='{trash_id}' file='{filename}' category='{category}'")
        return trash_record

    @classmethod
    def list_trash(cls) -> List[Dict[str, Any]]:
        """Return all items currently held in the Recycle Bin."""
        registry = cls._read_trash_registry()
        trash_dir = cls.get_recycle_bin_dir()

        # Validate that physical files still exist in trash_dir
        valid_items: List[Dict[str, Any]] = []
        for item in registry:
            p = os.path.join(trash_dir, item["stored_filename"])
            if os.path.exists(p):
                valid_items.append(item)

        if len(valid_items) != len(registry):
            cls._write_trash_registry(valid_items)

        return valid_items

    @classmethod
    def get_trash_file_path(cls, trash_id: str) -> Optional[str]:
        registry = cls._read_trash_registry()
        item = next((r for r in registry if r["trash_id"] == trash_id), None)
        if not item:
            return None
        trash_dir = cls.get_recycle_bin_dir()
        p = os.path.join(trash_dir, item["stored_filename"])
        if os.path.exists(p):
            return p
        return None

    @classmethod
    def restore_from_trash(cls, trash_id: str) -> Dict[str, Any]:
        """Restore a trashed item back to its original category subfolder."""
        registry = cls._read_trash_registry()
        item = next((r for r in registry if r["trash_id"] == trash_id), None)
        if not item:
            raise FileNotFoundError(f"Trash record with id '{trash_id}' not found")

        trash_dir = cls.get_recycle_bin_dir()
        trash_file = os.path.join(trash_dir, item["stored_filename"])
        if not os.path.exists(trash_file):
            raise FileNotFoundError(f"Physical file '{item['stored_filename']}' missing in recycle bin")

        dest_dir = cls.get_category_dir(item["category"])
        dest_file = os.path.join(dest_dir, item["filename"])

        # If a file with the same name already exists in target directory, rename safely
        if os.path.exists(dest_file):
            base, ext = os.path.splitext(item["filename"])
            dest_file = os.path.join(dest_dir, f"{base}_restored_{int(time.time())}{ext}")

        # Move file back
        shutil.move(trash_file, dest_file)

        # Restore extracted companion file if present
        ext_src = f"{trash_file}.extracted.json"
        ext_dst = f"{dest_file}.extracted.json"
        if os.path.exists(ext_src):
            try:
                shutil.move(ext_src, ext_dst)
            except OSError:
                pass

        # Remove from registry
        new_registry = [r for r in registry if r["trash_id"] != trash_id]
        cls._write_trash_registry(new_registry)

        logger.info(f"RESTORED_FROM_RECYCLE_BIN trash_id='{trash_id}' file='{item['filename']}' -> '{dest_file}'")
        return {
            "success": True,
            "trash_id": trash_id,
            "filename": os.path.basename(dest_file),
            "category": item["category"],
            "restored_path": dest_file,
            "message": f"File '{item['filename']}' restored successfully to uploads/{item['category']}/",
        }

    @classmethod
    def permanently_delete_from_trash(cls, trash_id: str) -> bool:
        """Permanent purge: wipes the physical file and registry entry completely."""
        registry = cls._read_trash_registry()
        item = next((r for r in registry if r["trash_id"] == trash_id), None)
        if not item:
            return False

        trash_dir = cls.get_recycle_bin_dir()
        trash_file = os.path.join(trash_dir, item["stored_filename"])
        if os.path.exists(trash_file):
            try:
                os.remove(trash_file)
            except OSError as e:
                logger.error(f"Failed to remove trash file {trash_file}: {e}")

        # Remove companion extracted json
        ext_file = f"{trash_file}.extracted.json"
        if os.path.exists(ext_file):
            try:
                os.remove(ext_file)
            except OSError:
                pass

        new_registry = [r for r in registry if r["trash_id"] != trash_id]
        cls._write_trash_registry(new_registry)

        logger.info(f"PERMANENTLY_PURGED_FROM_TRASH trash_id='{trash_id}' filename='{item['filename']}'")
        return True

    @classmethod
    def empty_trash(cls) -> int:
        """Purge all files in the Recycle Bin."""
        registry = cls._read_trash_registry()
        purged_count = 0
        trash_dir = cls.get_recycle_bin_dir()

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

        cls._write_trash_registry([])
        logger.info(f"RECYCLE_BIN_EMPTIED purged_count={purged_count}")
        return purged_count

    @classmethod
    def get_trash_stats(cls) -> Dict[str, Any]:
        """Get summary statistics of items held in the Recycle Bin."""
        trash_items = cls.list_trash()
        total_bytes = sum(item.get("size_bytes", 0) for item in trash_items)
        return {
            "total_items": len(trash_items),
            "total_bytes": total_bytes,
            "total_formatted": cls.format_size(total_bytes),
            "oldest_item": trash_items[-1]["deleted_at"] if trash_items else None,
            "newest_item": trash_items[0]["deleted_at"] if trash_items else None,
        }

    # -------------------------------------------------------------
    # Active Files & Category Stats
    # -------------------------------------------------------------

    @classmethod
    def list_files(cls, category: Optional[str] = None) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        categories_to_scan = [category] if category and category in UPLOAD_CATEGORIES else list(UPLOAD_CATEGORIES.keys())

        for cat in categories_to_scan:
            cat_dir = cls.get_category_dir(cat)
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
    def get_category_stats(cls) -> Dict[str, Any]:
        stats: Dict[str, Any] = {}
        total_all_bytes = 0
        total_all_files = 0

        for cat, meta in UPLOAD_CATEGORIES.items():
            cat_dir = cls.get_category_dir(cat)
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
