"""
Background Knowledge Pipeline Service (Nexus Call OS)
Implements:
1. Fast Asynchronous Upload Processing
2. Real-Time Document Job Tracking
3. Deterministic Page-Level Caching (doc_hash, page_number, provider, model)
4. SHA-256 Content Deduplication
5. Native-Text Fast Path & Bounded Vision Concurrency
6. Performance Metrics Measurement & Logging
"""

import hashlib
import io
import json
import logging
import os
import threading
import time
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image

try:
    import pymupdf as fitz  # type: ignore[import]
except ImportError:
    try:
        import fitz  # type: ignore[import]
    except ImportError:
        fitz = None

from backend.database.session import SessionLocal
from backend.models.models import KnowledgeDocument
from backend.services.vision_pdf_parser import (
    VisionPDFParser,
    clean_raw_pdf_binary_streams,
    is_known_non_vision_model,
    is_valid_human_readable_text,
)

logger = logging.getLogger(__name__)

UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "knowledge_base")
)
CACHE_DIR = os.path.join(UPLOAD_DIR, "cache")
PAGE_CACHE_DIR = os.path.join(CACHE_DIR, "pages")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(PAGE_CACHE_DIR, exist_ok=True)


class ContentDeduplicationEngine:
    """Computes deterministic SHA-256 hashes and manages file deduplication."""

    @staticmethod
    def compute_sha256(content_bytes: bytes) -> str:
        return hashlib.sha256(content_bytes).hexdigest()

    @classmethod
    def get_existing_processed_cache(cls, file_hash: str) -> Optional[Dict[str, Any]]:
        cache_path = os.path.join(CACHE_DIR, f"{file_hash}.extracted.json")
        if os.path.isfile(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data.get("text") and data.get("status") == "ready":
                        return data
            except Exception as e:
                logger.warning(f"Error reading deduplicated cache {cache_path}: {e}")
        return None

    @classmethod
    def save_processed_cache(cls, file_hash: str, cache_data: Dict[str, Any]) -> None:
        cache_path = os.path.join(CACHE_DIR, f"{file_hash}.extracted.json")
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(cache_data, f, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"Error writing deduplicated cache {cache_path}: {e}")


class PageLevelCacheManager:
    """
    Deterministic page-level cache keyed by:
    SHA-256(document_hash + "_" + str(page_number) + "_" + selected_provider + "_" + selected_model)
    Guarantees processed pages are NEVER re-sent to Vision AI.
    """

    @staticmethod
    def _make_key(doc_hash: str, page_num: int, provider: str, model: str) -> str:
        raw_key = f"{doc_hash}_{page_num}_{provider.lower().strip()}_{model.strip()}"
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    @classmethod
    def get_page_cache(
        cls, doc_hash: str, page_num: int, provider: str, model: str
    ) -> Optional[Dict[str, Any]]:
        key = cls._make_key(doc_hash, page_num, provider, model)
        page_file = os.path.join(PAGE_CACHE_DIR, f"{key}.json")
        if os.path.isfile(page_file):
            try:
                with open(page_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data.get("text") and data.get("status") == "success":
                        logger.info(
                            f"PAGE_CACHE_HIT doc_hash='{doc_hash[:8]}' page={page_num} provider='{provider}' model='{model}'"
                        )
                        return data
            except Exception as e:
                logger.warning(f"Error reading page cache {page_file}: {e}")
        return None

    @classmethod
    def save_page_cache(
        cls,
        doc_hash: str,
        page_num: int,
        provider: str,
        model: str,
        text: str,
        status: str = "success",
        error: Optional[str] = None,
    ) -> None:
        key = cls._make_key(doc_hash, page_num, provider, model)
        page_file = os.path.join(PAGE_CACHE_DIR, f"{key}.json")
        cache_data = {
            "key": key,
            "doc_hash": doc_hash,
            "page_number": page_num,
            "provider": provider,
            "model": model,
            "text": text,
            "status": status,
            "error": error,
            "timestamp": time.time(),
        }
        try:
            with open(page_file, "w", encoding="utf-8") as f:
                json.dump(cache_data, f, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"Error writing page cache {page_file}: {e}")


class DocumentJobTracker:
    """Thread-safe in-memory and persistent document background processing state tracker."""

    _lock = threading.Lock()
    _jobs: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def create_job(
        cls,
        document_id: str,
        filename: str,
        file_hash: str,
        file_path: str,
        file_format: str,
        upload_receive_time_ms: float = 0.0,
        upload_response_time_ms: float = 0.0,
    ) -> Dict[str, Any]:
        with cls._lock:
            job_data = {
                "document_id": document_id,
                "filename": filename,
                "file_hash": file_hash,
                "file_path": file_path,
                "file_format": file_format.upper(),
                "status": "processing",
                "stage": "upload_saved",
                "total_pages": 1,
                "processed_pages": 0,
                "extracted_pages": 0,
                "vision_pages": 0,
                "indexed_chunks": 0,
                "progress_percent": 5,
                "error": None,
                "metrics": {
                    "upload_receive_time_ms": round(upload_receive_time_ms, 2),
                    "upload_response_time_ms": round(upload_response_time_ms, 2),
                    "background_parse_time_ms": 0.0,
                    "vision_time_ms": 0.0,
                    "embedding_time_ms": 0.0,
                    "indexing_time_ms": 0.0,
                    "total_processing_time_ms": 0.0,
                },
                "extracted_text": "",
                "created_at": time.time(),
                "updated_at": time.time(),
            }
            cls._jobs[document_id] = job_data
            return dict(job_data)

    @classmethod
    def update_job(cls, document_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with cls._lock:
            if document_id in cls._jobs:
                cls._jobs[document_id].update(updates)
                cls._jobs[document_id]["updated_at"] = time.time()
                return dict(cls._jobs[document_id])
            else:
                cls._jobs[document_id] = {
                    "document_id": document_id,
                    "status": updates.get("status", "processing"),
                    "updated_at": time.time(),
                    **updates,
                }
                return dict(cls._jobs[document_id])

    @classmethod
    def get_job(cls, document_id: str) -> Optional[Dict[str, Any]]:
        with cls._lock:
            if document_id in cls._jobs:
                return dict(cls._jobs[document_id])

        # If not in memory, try loading from disk cache
        cache_pattern = os.path.join(UPLOAD_DIR, f"{document_id}.extracted.json")
        if os.path.isfile(cache_pattern):
            try:
                with open(cache_pattern, "r", encoding="utf-8") as f:
                    cdata = json.load(f)
                    return {
                        "document_id": document_id,
                        "filename": cdata.get("filename", "document"),
                        "status": "ready",
                        "stage": "ready",
                        "total_pages": cdata.get("page_count", 1),
                        "processed_pages": cdata.get("page_count", 1),
                        "extracted_pages": cdata.get("page_count", 1),
                        "vision_pages": 1 if cdata.get("ocr_used") else 0,
                        "indexed_chunks": cdata.get("chunk_count", 1),
                        "progress_percent": 100,
                        "error": None,
                        "metrics": cdata.get("metrics", {}),
                    }
            except Exception:
                pass
        return None


class BackgroundKnowledgeWorker:
    """
    Executes the multi-stage asynchronous document extraction & vector indexing pipeline in the background.
    """

    @classmethod
    def process_document_async(
        cls,
        document_id: str,
        filename: str,
        file_bytes: bytes,
        file_path: str,
        ext: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        org_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> None:
        """Entry point executed in background task."""
        worker_start_t = time.time()
        file_hash = ContentDeduplicationEngine.compute_sha256(file_bytes)
        ext_lower = (ext or "").lower().replace(".", "")

        logger.info(
            f"BACKGROUND_WORKER_START document_id='{document_id}' filename='{filename}' hash='{file_hash[:8]}' ext='{ext_lower}'"
        )

        DocumentJobTracker.update_job(
            document_id,
            {"stage": "extracting", "progress_percent": 15},
        )

        # 1. Check deduplicated processed cache
        existing_cache = ContentDeduplicationEngine.get_existing_processed_cache(file_hash)
        if existing_cache:
            logger.info(
                f"DEDUPLICATION_HIT document_id='{document_id}' filename='{filename}' hash='{file_hash[:8]}'"
            )
            extracted_text = existing_cache.get("text", "")
            chunks = existing_cache.get("chunks", [])
            page_count = existing_cache.get("page_count", 1)
            ocr_used = existing_cache.get("ocr_used", False)

            DocumentJobTracker.update_job(
                document_id,
                {
                    "status": "ready",
                    "stage": "ready",
                    "total_pages": page_count,
                    "processed_pages": page_count,
                    "extracted_pages": page_count,
                    "vision_pages": 1 if ocr_used else 0,
                    "indexed_chunks": len(chunks),
                    "progress_percent": 100,
                    "extracted_text": extracted_text,
                    "metrics": {
                        "total_processing_time_ms": round((time.time() - worker_start_t) * 1000, 2)
                    },
                },
            )
            cls._sync_db_status(document_id, "Indexed", len(chunks), page_count)
            return

        # 2. Resolve Canonical Tab 1 LLM Configuration
        from backend.routers.knowledge_base import DynamicLLMInvoker, SemanticTextChunker

        db = SessionLocal()
        llm_config = None
        try:
            llm_config = DynamicLLMInvoker.resolve_selected_llm_config(
                selected_provider=provider,
                selected_model=model,
                db=db,
                org_id=org_id,
                user_id=user_id,
            )
        finally:
            db.close()

        resolved_prov = str(llm_config.get("provider") or "").lower().strip() if llm_config else "none"
        resolved_mod = str(llm_config.get("model") or "").strip() if llm_config else "none"

        # 3. Document Extraction Stage
        parse_start_t = time.time()
        vision_time_ms = 0.0

        if ext_lower == "pdf":
            # PDF Multi-Page Parsing with Native-Text Fast Path & Page-Level Caching
            doc_fitz: Any = None
            page_count = 1
            if fitz:
                try:
                    doc_fitz = fitz.open(stream=file_bytes, filetype="pdf")
                    page_count = len(doc_fitz)
                except Exception as ex:
                    logger.warning(f"PyMuPDF open error for {filename}: {ex}")

            DocumentJobTracker.update_job(
                document_id,
                {"total_pages": page_count, "stage": "extracting", "progress_percent": 25},
            )

            pages_plan: List[Dict[str, Any]] = []
            extracted_pages_count = 0
            vision_pages_count = 0

            for i in range(page_count):
                page_num = i + 1
                native_text = ""

                if doc_fitz and i < len(doc_fitz):
                    try:
                        raw_txt = doc_fitz[i].get_text("text") or ""
                        if is_valid_human_readable_text(raw_txt):
                            native_text = clean_raw_pdf_binary_streams(raw_txt)
                    except Exception as p_err:
                        logger.warning(f"Native extraction error page {page_num}: {p_err}")

                if native_text:
                    logger.info(f"page={page_num} extraction=native_text")
                    extracted_pages_count += 1
                    pages_plan.append({
                        "page_number": page_num,
                        "text": native_text,
                        "method": "native_text",
                        "status": "success",
                        "error": None,
                        "page_idx": i,
                    })
                else:
                    # Check page-level cache before scheduling Vision AI
                    cached_page = PageLevelCacheManager.get_page_cache(
                        file_hash, page_num, resolved_prov, resolved_mod
                    )
                    if cached_page and cached_page.get("text"):
                        extracted_pages_count += 1
                        pages_plan.append({
                            "page_number": page_num,
                            "text": cached_page["text"],
                            "method": "page_cache_hit",
                            "status": "success",
                            "error": None,
                            "page_idx": i,
                        })
                    else:
                        pages_plan.append({
                            "page_number": page_num,
                            "text": "",
                            "method": f"vision provider={resolved_prov} model={resolved_mod}",
                            "status": "pending_vision",
                            "error": None,
                            "page_idx": i,
                        })

                # Update progress
                DocumentJobTracker.update_job(
                    document_id,
                    {
                        "processed_pages": page_num,
                        "extracted_pages": extracted_pages_count,
                        "progress_percent": min(70, int(25 + (page_num / page_count) * 35)),
                    },
                )

            # Vision Execution for pending scanned pages
            vision_needed = [p for p in pages_plan if p["status"] == "pending_vision"]

            if vision_needed:
                DocumentJobTracker.update_job(
                    document_id,
                    {"stage": "vision", "progress_percent": 60},
                )

                # Check model capability upfront
                if is_known_non_vision_model(resolved_prov, resolved_mod):
                    err_msg = "Selected model does not support image/document vision input. Please select a multimodal model."
                    logger.error(f"CAPABILITY_ERROR {err_msg} (provider='{resolved_prov}', model='{resolved_mod}')")
                    if doc_fitz:
                        try:
                            doc_fitz.close()
                        except Exception:
                            pass
                    DocumentJobTracker.update_job(
                        document_id,
                        {
                            "status": "failed",
                            "stage": "failed",
                            "error": err_msg,
                        },
                    )
                    cls._sync_db_status(document_id, "Failed", 0, page_count)
                    return

                vision_start_t = time.time()
                # Render images for vision-needed pages
                rendered_images: Dict[int, Image.Image] = {}
                if doc_fitz and fitz is not None:
                    for p_info in vision_needed:
                        p_idx = p_info["page_idx"]
                        try:
                            zoom = 300.0 / 72.0
                            matrix = fitz.Matrix(zoom, zoom)
                            pix = doc_fitz[p_idx].get_pixmap(matrix=matrix, alpha=False)
                            rendered_images[p_info["page_number"]] = Image.frombytes(
                                "RGB", (pix.width, pix.height), pix.samples
                            )
                        except Exception as r_err:
                            logger.warning(f"Render error page {p_info['page_number']}: {r_err}")

                # Process vision pages with bounded concurrency
                from concurrent.futures import ThreadPoolExecutor, as_completed

                def process_single_vision(p_info: Dict[str, Any]) -> Dict[str, Any]:
                    p_num = p_info["page_number"]
                    logger.info(f"page={p_num} extraction=vision provider={resolved_prov} model={resolved_mod}")
                    p_img = rendered_images.get(p_num)
                    if not p_img or not llm_config:
                        return {"page_number": p_num, "text": "", "status": "failed", "error": "Image render error"}

                    v_text, v_err = VisionPDFParser._extract_page_with_provider_vision(
                        img=p_img,
                        llm_config=llm_config,
                        document_id=filename,
                        page_number=p_num,
                    )
                    if v_text:
                        # Save to page cache
                        PageLevelCacheManager.save_page_cache(
                            file_hash, p_num, resolved_prov, resolved_mod, v_text, status="success"
                        )
                        return {"page_number": p_num, "text": v_text, "status": "success", "error": None}
                    else:
                        return {"page_number": p_num, "text": "", "status": "failed", "error": v_err or "Empty"}

                max_workers = min(3, max(1, len(vision_needed)))
                with ThreadPoolExecutor(max_workers=max_workers) as executor:
                    fut_map = {executor.submit(process_single_vision, p_item): p_item["page_number"] for p_item in vision_needed}
                    for fut in as_completed(fut_map):
                        p_num = fut_map[fut]
                        try:
                            res = fut.result()
                            for p_plan in pages_plan:
                                if p_plan["page_number"] == p_num:
                                    p_plan["text"] = res["text"]
                                    p_plan["status"] = res["status"]
                                    p_plan["error"] = res["error"]
                                    if res["status"] == "success":
                                        vision_pages_count += 1
                        except Exception as f_ex:
                            logger.error(f"Vision error on page {p_num}: {f_ex}")

                vision_time_ms = (time.time() - vision_start_t) * 1000

            if doc_fitz:
                try:
                    doc_fitz.close()
                except Exception:
                    pass

            # Assemble full document text
            full_blocks = []
            for p in pages_plan:
                if p["text"].strip():
                    full_blocks.append(f"## Page {p['page_number']}\n{p['text'].strip()}")

            extracted_text = clean_raw_pdf_binary_streams("\n\n".join(full_blocks))
            ocr_used = vision_pages_count > 0

        else:
            # Non-PDF formats (DOCX, CSV, TXT, MD)
            from backend.routers.knowledge_base import DocumentTextExtractor

            extraction = DocumentTextExtractor.extract_from_bytes(file_bytes, filename, ext_lower, llm_config=llm_config)
            extracted_text = extraction.get("text", "")
            page_count = extraction.get("page_count", 1)
            ocr_used = False

        bg_parse_time_ms = (time.time() - parse_start_t) * 1000

        if not extracted_text.strip():
            logger.error(f"EXTRACTION_FAILED document_id='{document_id}' filename='{filename}' detail='No content extracted'")
            DocumentJobTracker.update_job(
                document_id,
                {
                    "status": "failed",
                    "stage": "failed",
                    "error": f"No readable content extracted from '{filename}'.",
                },
            )
            cls._sync_db_status(document_id, "Failed", 0, page_count)
            return

        # 4. Chunking Stage
        chunk_start_t = time.time()
        DocumentJobTracker.update_job(
            document_id,
            {"stage": "chunking", "progress_percent": 75},
        )
        chunks = SemanticTextChunker.create_overlapping_chunks(extracted_text)
        chunk_time_ms = (time.time() - chunk_start_t) * 1000

        # 5. Embedding & Vector Indexing Stage
        embed_start_t = time.time()
        DocumentJobTracker.update_job(
            document_id,
            {"stage": "indexing", "progress_percent": 90, "indexed_chunks": len(chunks)},
        )

        from backend.routers.knowledge_base import VectorEmbeddingIndex
        _ = VectorEmbeddingIndex(chunks)
        embed_time_ms = (time.time() - embed_start_t) * 1000

        total_time_ms = (time.time() - worker_start_t) * 1000

        # 6. Save extracted & indexed document cache to disk for instant query retrieval
        cache_data = {
            "document_id": document_id,
            "filename": filename,
            "file_hash": file_hash,
            "format": ext_lower.upper(),
            "status": "ready",
            "ocr_used": ocr_used,
            "char_count": len(extracted_text),
            "chunk_count": len(chunks),
            "page_count": page_count,
            "text": extracted_text,
            "chunks": chunks,
            "metrics": {
                "background_parse_time_ms": round(bg_parse_time_ms, 2),
                "vision_time_ms": round(vision_time_ms, 2),
                "chunk_time_ms": round(chunk_time_ms, 2),
                "embedding_time_ms": round(embed_time_ms, 2),
                "indexing_time_ms": round(embed_time_ms, 2),
                "total_processing_time_ms": round(total_time_ms, 2),
            },
            "updated_at": time.time(),
        }

        try:
            doc_cache_path = os.path.join(UPLOAD_DIR, f"{filename}.extracted.json")
            with open(doc_cache_path, "w", encoding="utf-8") as f:
                json.dump(cache_data, f, ensure_ascii=False)
            ContentDeduplicationEngine.save_processed_cache(file_hash, cache_data)
        except Exception as c_err:
            logger.warning(f"Failed to persist document cache: {c_err}")

        # 7. Update Job Tracker to READY
        DocumentJobTracker.update_job(
            document_id,
            {
                "status": "ready",
                "stage": "ready",
                "total_pages": page_count,
                "processed_pages": page_count,
                "extracted_pages": page_count,
                "vision_pages": 1 if ocr_used else 0,
                "indexed_chunks": len(chunks),
                "progress_percent": 100,
                "extracted_text": extracted_text,
                "error": None,
                "metrics": {
                    "background_parse_time_ms": round(bg_parse_time_ms, 2),
                    "vision_time_ms": round(vision_time_ms, 2),
                    "embedding_time_ms": round(embed_time_ms, 2),
                    "indexing_time_ms": round(embed_time_ms, 2),
                    "total_processing_time_ms": round(total_time_ms, 2),
                },
            },
        )

        cls._sync_db_status(document_id, "Indexed", len(chunks), page_count)

        logger.info(
            f"BACKGROUND_WORKER_COMPLETE document_id='{document_id}' filename='{filename}' "
            f"pages={page_count} chunks={len(chunks)} parse_ms={bg_parse_time_ms:.1f} "
            f"vision_ms={vision_time_ms:.1f} index_ms={embed_time_ms:.1f} total_ms={total_time_ms:.1f}"
        )

    @classmethod
    def _sync_db_status(cls, document_id: str, status_str: str, chunk_count: int, page_count: int) -> None:
        """Syncs the final status back to the SQL database."""
        try:
            db = SessionLocal()
            try:
                doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
                if doc:
                    doc.status = status_str
                    doc.vector_status = "Ready" if status_str == "Indexed" else "Failed"
                    doc.chunk_count = chunk_count
                    db.commit()
            finally:
                db.close()
        except Exception as db_err:
            logger.warning(f"Error syncing DB status for {document_id}: {db_err}")
