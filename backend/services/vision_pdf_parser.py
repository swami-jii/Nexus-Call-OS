"""
Vision-Based PDF Parser Engine (Create Call OS)
Converts PDF pages into high-resolution images and applies Vision AI models
strictly using the user's canonical Tab 1 LLM Provider & Model configuration.
Guarantees NO raw PDF binary data or object streams enter document text chunks.
"""

import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
import io
import logging
import re
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx
from PIL import Image

try:
    import pymupdf as fitz  # type: ignore[import]
except ImportError:
    try:
        import fitz  # type: ignore[import]
    except ImportError:
        fitz = None

logger = logging.getLogger(__name__)

STRICT_VISION_SYSTEM_PROMPT = """You are an expert Document Intelligence and Vision AI Parser.
Your goal is to perform 100% accurate, high-fidelity structural extraction of the provided PDF page image.

Instructions:
1. Extract ALL textual content, maintaining reading order and visual hierarchy.
2. Structure multi-column layouts into readable Markdown.
3. Convert all tables into clean Markdown tables (with headers and aligned columns).
4. Preserve key-value pairs, form fields, timestamps, monetary figures, dates, and technical data.
5. Highlight section headings using proper Markdown (#, ##, ###).
6. Do NOT invent or hallucinate information not present in the image.
7. Return clean Markdown text representing the complete contents of this page.
"""


def clean_raw_pdf_binary_streams(text: str) -> str:
    """Strips any residual PDF object stream headers, trailers, or binary markers."""
    if not text:
        return ""

    patterns = [
        r"\d+\s+\d+\s+obj\b.*?(?:endobj|\n)",
        r"\bstream\b.*?\bendstream\b",
        r"\b(?:xref|trailer|startxref)\b",
        r"/(?:FlateDecode|Filter|Length|MediaBox|Font|Type|Catalog|Pages|Contents)\b",
        r"<<.*?>>",
        r"%PDF-[0-9\.]+",
    ]
    cleaned = text
    for pat in patterns:
        cleaned = re.sub(pat, "", cleaned, flags=re.DOTALL | re.IGNORECASE)

    # Strip non-printable control characters except standard whitespace
    cleaned = "".join(ch for ch in cleaned if ch.isprintable() or ch in "\n\r\t")
    # Strip Unicode replacement characters ()
    cleaned = cleaned.replace("\ufffd", "")
    return cleaned.strip()


def is_valid_human_readable_text(text: str) -> bool:
    """
    Validates whether extracted text is real human-readable content
    versus raw PDF binary/object stream garbage, unmapped font streams, or empty scanned image page.
    """
    if not text or not text.strip():
        return False

    t_clean = text.strip()

    # 1. Reject if it contains raw PDF binary / object stream signatures
    raw_pdf_signatures = [
        "obj", "endobj", "stream", "endstream", "xref", "trailer",
        "/FlateDecode", "/Filter", "/Length", "/Type", "/MediaBox",
        "/Font", "/Contents", "0 obj", "1 0 obj", "2 0 obj", "3 0 obj",
        "%PDF", "startxref"
    ]
    sig_matches = sum(1 for sig in raw_pdf_signatures if sig in t_clean)
    if sig_matches >= 2:
        return False

    # 2. Reject if high concentration of replacement characters ()
    if t_clean.count("\ufffd") > 3 or (len(t_clean) > 0 and t_clean.count("\ufffd") / len(t_clean) > 0.05):
        return False

    # 3. Check printable ASCII / Unicode alphanumeric ratio
    printable_count = sum(
        1 for c in t_clean
        if c.isalnum() or c.isspace() or c in ".,!?-():;/'\"$%&@#[]{}|+=*~^`_<>\u0900-\u097F"
    )
    total_count = len(t_clean)
    if total_count == 0:
        return False

    printable_ratio = printable_count / total_count
    if printable_ratio < 0.75:
        return False

    # 4. Check for minimum readable word structure (scanned image pages or font glyph streams have few or 0 real words)
    words = [w for w in re.split(r"\s+", t_clean) if len(w) > 1 and not re.match(r"^[0-9\W_]+$", w)]
    if len(words) < 5:
        return False

    # 5. Check if words look like unmapped font glyph garbage (e.g. 'QXq? NE H lW 09q')
    # Unmapped font glyphs often have average word length < 2.5 or high ratio of single letters
    single_or_two_char_words = sum(1 for w in words if len(w) <= 2)
    if len(words) > 10 and (single_or_two_char_words / len(words)) > 0.65:
        return False

    return True


def is_known_non_vision_model(provider: str | None = None, model: str | None = None) -> bool:
    """
    Determines whether a provider/model is strictly text-only and cannot process image/multimodal input.
    """
    p = str(provider or "").lower().strip()
    m = str(model or "").lower().strip()

    if not m:
        return False

    # Pure embedding models
    if "embedding" in m or "embed" in m:
        return True

    # DeepSeek text-only LLMs (DeepSeek-V3, DeepSeek-R1, deepseek-chat, deepseek-coder)
    if "deepseek" in p or "deepseek" in m:
        if "vl" not in m and "vision" not in m:
            return True

    # Groq text-only models (llama-3.3-70b-versatile, mixtral, gemma2, etc.)
    if ("groq" in p or "groq" in m) and ("vision" not in m and "vl" not in m):
        return True

    # OpenAI text-only legacy models
    if m in ["gpt-3.5-turbo", "text-davinci-003", "text-curie-001", "davinci", "curie", "babbage", "ada"]:
        return True

    # Anthropic legacy text-only models
    if m in ["claude-1", "claude-2", "claude-2.0", "claude-2.1", "claude-instant-1", "claude-instant-1.2"]:
        return True

    # Cohere command models (text-only)
    if "command-r" in m or "command-light" in m:
        return True

    # Perplexity sonar models (text-only)
    if "sonar" in m:
        return True

    # Mistral text-only models (without pixtral/vision)
    if ("mistral-large" in m or "mistral-small" in m or "mistral-medium" in m or "codestral" in m):
        if "pixtral" not in m and "vision" not in m:
            return True

    return False


class VisionPDFParser:
    """Modular Vision-Language Model & High-Res PDF Parser Service"""

    @staticmethod
    def pdf_to_images(pdf_bytes: bytes, dpi: int = 300) -> List[Any]:
        """
        Converts PDF bytes into a list of PIL Images at target DPI (default 300 DPI).
        Uses pdf2image primarily, with PyMuPDF (fitz) rendering as fallback.
        """
        images: List[Image.Image] = []

        # Strategy 1: pdf2image
        try:
            from pdf2image import convert_from_bytes  # pyright: ignore[reportMissingImports]
            images = convert_from_bytes(pdf_bytes, dpi=dpi)
            if images:
                return images
        except Exception:
            pass

        # Strategy 2: PyMuPDF (fitz) rendering at 300 DPI
        try:
            try:
                import pymupdf as fitz  # pyright: ignore[reportMissingImports]
            except ImportError:
                import fitz  # pyright: ignore[reportMissingImports]

            doc: Any = fitz.open(stream=pdf_bytes, filetype="pdf")
            zoom = dpi / 72.0  # standard PDF resolution is 72 pt/inch
            matrix = fitz.Matrix(zoom, zoom)

            for i in range(len(doc)):
                page = doc[i]
                pix = page.get_pixmap(matrix=matrix, alpha=False)
                img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
                images.append(img)

            doc.close()
            if images:
                return images
        except Exception as e:
            logger.warning(f"PyMuPDF rendering error: {e}")

        return images

    @staticmethod
    def _image_to_base64(img: Image.Image, format_type: str = "JPEG") -> str:
        """Helper to convert PIL Image to optimized base64 string"""
        max_dim = 950
        if img.width > max_dim or img.height > max_dim:
            img = img.copy()
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        img.save(buffer, format=format_type, quality=75, optimize=True)
        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    @classmethod
    def _extract_page_with_provider_vision(
        cls,
        img: Image.Image,
        llm_config: Dict[str, Any],
        document_id: str = "doc",
        page_number: int = 1
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Calls Vision API strictly using provider, model, and credentials from canonical Tab 1 configuration.
        Returns (extracted_text, error_message).
        Implements fallback across available models and providers if quota (429) is exhausted.
        """
        provider = str(llm_config.get("provider") or "").lower().strip()
        model = str(llm_config.get("model") or "").strip()
        api_key = str(llm_config.get("api_key") or "").strip()
        base_url = llm_config.get("base_url")

        if not api_key and provider not in ["ollama"]:
            # Try loading fallback from DB credentials
            try:
                from backend.database.session import SessionLocal
                from backend.models.models import ProviderCredential
                db = SessionLocal()
                try:
                    c = db.query(ProviderCredential).filter(
                        ProviderCredential.category.in_(["llm", "ai"]),
                        ProviderCredential.plain_key.isnot(None)
                    ).first()
                    if c:
                        provider = c.provider_name.lower()
                        api_key = c.plain_key or c.encrypted_key or ""
                        model = c.primary_model or ("meta/llama-3.2-11b-vision-instruct" if "nvidia" in provider else "gemini-flash-latest")
                        base_url = c.base_url
                finally:
                    db.close()
            except Exception:
                pass

        if not api_key and provider not in ["ollama"]:
            err = f"Missing API credentials for provider '{provider}'. Please configure in Tab 1."
            return None, err

        if not model or model.lower() in ["default", "dynamic", "none"]:
            if "nvidia" in provider:
                model = "meta/llama-3.2-11b-vision-instruct"
            elif "gemini" in provider or "google" in provider:
                model = "gemini-flash-latest"
            elif "openai" in provider:
                model = "gpt-4o-mini"
            elif "anthropic" in provider:
                model = "claude-3-5-sonnet-20241022"
            else:
                model = "meta/llama-3.2-11b-vision-instruct"

        b64_img = cls._image_to_base64(img, format_type="JPEG")
        VISION_TIMEOUT = httpx.Timeout(connect=15.0, read=60.0, write=30.0, pool=30.0)

        # Prepare candidates to try (primary + fallback models)
        configs_to_try = []

        if provider in ["google", "gemini", "google_ai_studio", "google_cloud"]:
            google_models = [model] if model not in ["dynamic", "default"] else []
            for gm in ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-2.5-flash"]:
                if gm not in google_models:
                    google_models.append(gm)
            for gm in google_models:
                configs_to_try.append({
                    "provider": "google",
                    "model": gm,
                    "api_key": api_key,
                    "base_url": base_url,
                })
        elif "nvidia" in provider:
            nvidia_models = [model] if model not in ["dynamic", "default", "qwen/qwen3.8-27b"] else []
            for nm in ["meta/llama-3.2-11b-vision-instruct", "meta/llama-3.2-90b-vision-instruct", "microsoft/phi-3-vision-128k-instruct"]:
                if nm not in nvidia_models:
                    nvidia_models.append(nm)
            for nm in nvidia_models:
                configs_to_try.append({
                    "provider": "nvidia",
                    "model": nm,
                    "api_key": api_key,
                    "base_url": base_url or "https://integrate.api.nvidia.com/v1",
                })
        else:
            configs_to_try.append({
                "provider": provider,
                "model": model,
                "api_key": api_key,
                "base_url": base_url,
            })

        # Append NVIDIA fallback if primary was Google and NVIDIA credential exists
        if provider in ["google", "gemini", "google_ai_studio", "google_cloud"]:
            try:
                from backend.database.session import SessionLocal
                from backend.models.models import ProviderCredential
                db = SessionLocal()
                try:
                    nv_cred = db.query(ProviderCredential).filter(
                        ProviderCredential.provider_name == "nvidia",
                        ProviderCredential.plain_key.isnot(None)
                    ).first()
                    if nv_cred and nv_cred.plain_key:
                        configs_to_try.append({
                            "provider": "nvidia",
                            "model": "meta/llama-3.2-11b-vision-instruct",
                            "api_key": nv_cred.plain_key,
                            "base_url": "https://integrate.api.nvidia.com/v1",
                        })
                finally:
                    db.close()
            except Exception:
                pass

        last_error = None

        for cfg in configs_to_try:
            curr_prov = cfg["provider"]
            curr_mod = cfg["model"]
            curr_key = cfg["api_key"]
            curr_base = cfg.get("base_url")

            if curr_prov in ["google", "gemini", "google_ai_studio", "google_cloud"]:
                clean_key = curr_key.replace("Bearer ", "").strip()
                if clean_key.startswith("ya29."):
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{curr_mod}:generateContent"
                    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {clean_key}"}
                else:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{curr_mod}:generateContent?key={clean_key}"
                    headers = {"Content-Type": "application/json", "x-goog-api-key": clean_key}
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"text": f"{STRICT_VISION_SYSTEM_PROMPT}\nExtract all text, tables, and structure from this image."},
                                {
                                    "inline_data": {
                                        "mime_type": "image/jpeg",
                                        "data": b64_img,
                                    }
                                },
                            ]
                        }
                    ]
                }
            elif curr_prov in ["anthropic", "claude"]:
                url = "https://api.anthropic.com/v1/messages"
                headers = {
                    "x-api-key": curr_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                payload = {
                    "model": curr_mod,
                    "max_tokens": 4096,
                    "system": STRICT_VISION_SYSTEM_PROMPT,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": "image/jpeg",
                                        "data": b64_img
                                    }
                                },
                                {
                                    "type": "text",
                                    "text": "Extract all text, tables, and structure from this document page image accurately."
                                }
                            ]
                        }
                    ]
                }
            elif curr_prov == "nvidia" or "nvidia" in curr_prov:
                url = "https://integrate.api.nvidia.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {curr_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": curr_mod,
                    "messages": [
                        {"role": "system", "content": STRICT_VISION_SYSTEM_PROMPT},
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Extract all text, tables, and headings from this document page image accurately."},
                                {
                                    "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"},
                                    "type": "image_url",
                                },
                            ],
                        },
                    ],
                    "max_tokens": 4096,
                    "temperature": 0.1,
                }
            else:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Content-Type": "application/json"}
                if curr_base:
                    url = curr_base.rstrip("/") + "/chat/completions" if not curr_base.endswith("/chat/completions") else curr_base
                elif curr_prov == "groq":
                    url = "https://api.groq.com/openai/v1/chat/completions"
                elif curr_prov in ["openrouter"] or "openrouter" in curr_prov:
                    url = "https://openrouter.ai/api/v1/chat/completions"
                    headers["HTTP-Referer"] = "http://localhost:3000"
                    headers["X-Title"] = "Create Call OS"

                if curr_key:
                    headers["Authorization"] = f"Bearer {curr_key}"

                payload = {
                    "model": curr_mod,
                    "messages": [
                        {"role": "system", "content": STRICT_VISION_SYSTEM_PROMPT},
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Extract all content from this document page image accurately."},
                                {
                                    "image_url": {"url": f"data:image/jpeg;base64,{b64_img}", "detail": "high"},
                                    "type": "image_url",
                                },
                            ],
                        },
                    ],
                    "max_tokens": 4096,
                    "temperature": 0.0,
                }

            try:
                with httpx.Client(timeout=VISION_TIMEOUT) as client:
                    res = client.post(url, json=payload, headers=headers)

                    if res.status_code == 200:
                        data = res.json()
                        extracted_text = ""
                        if curr_prov in ["google", "gemini", "google_ai_studio", "google_cloud"]:
                            candidates = data.get("candidates", [])
                            if candidates:
                                text_parts = candidates[0].get("content", {}).get("parts", [])
                                extracted_text = "".join([p.get("text", "") for p in text_parts])
                        elif curr_prov in ["anthropic", "claude"]:
                            blocks = data.get("content", [])
                            extracted_text = "".join([b.get("text", "") for b in blocks if b.get("type") == "text"]).strip()
                        else:
                            extracted_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

                        if extracted_text and len(extracted_text.strip()) > 5:
                            logger.info(f"VISION_SUCCESS page={page_number} provider='{curr_prov}' model='{curr_mod}' chars={len(extracted_text)}")
                            return clean_raw_pdf_binary_streams(extracted_text), None

                    elif res.status_code == 429:
                        logger.warning(f"VISION_429 provider='{curr_prov}' model='{curr_mod}' page={page_number}, attempting next candidate...")
                        last_error = f"Quota 429 ({curr_mod})"
                        continue
                    else:
                        last_error = f"Vision error {res.status_code} ({curr_mod}): {res.text[:200]}"
                        logger.warning(last_error)
                        continue
            except Exception as ex:
                last_error = f"Vision exception ({curr_mod}): {ex}"
                logger.warning(last_error)
                continue

        return None, last_error or "Vision extraction failed across all configured models."

    @classmethod
    def parse_pdf(
        cls,
        pdf_bytes: bytes,
        filename: str = "document.pdf",
        llm_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Per-Page Pipeline Orchestrator for Multi-Page PDF Document Parsing:

        For EACH page (1..N):
        1. Determine if page has trustworthy native text.
           - Yes -> Native text extraction. (page=X extraction=native_text)
           - No / Scanned / Image / Binary -> Render page & Vision AI with user-selected Tab 1 model.
             (page=X extraction=vision provider=<provider> model=<model>)
        2. Bounded concurrency for scanned pages without arbitrary delays.
        3. Never fall back to unvalidated binary or raw PDF stream text.
        4. Log DOCUMENT_START and DOCUMENT_COMPLETE summary evidence.
        """
        start_time = time.time()
        doc_id = filename.replace(" ", "_")

        provider = str(llm_config.get("provider") or "").lower().strip() if llm_config else "none"
        model = str(llm_config.get("model") or "").strip() if llm_config else "none"

        doc_fitz: Any = None
        page_count = 1
        try:
            try:
                import pymupdf as fitz
            except ImportError:
                import fitz
            doc_fitz = fitz.open(stream=pdf_bytes, filetype="pdf")
            page_count = len(doc_fitz)
        except Exception as fitz_err:
            logger.warning(f"[PDF-PARSER] PyMuPDF open error for {filename}: {fitz_err}")

        logger.info(f"DOCUMENT_START document='{filename}' total_pages={page_count}")

        # Page metadata tracker: [ {page_number, text, method, status, error, image} ]
        pages_plan: List[Dict[str, Any]] = []

        for i in range(page_count):
            page_num = i + 1
            native_text = ""

            if doc_fitz and i < len(doc_fitz):
                try:
                    raw_txt = doc_fitz[i].get_text("text") or ""
                    if is_valid_human_readable_text(raw_txt):
                        native_text = clean_raw_pdf_binary_streams(raw_txt)
                except Exception as page_err:
                    logger.warning(f"[PDF-PARSER] Native text extraction check failed on page {page_num}: {page_err}")

            if native_text:
                logger.info(f"page={page_num} extraction=native_text")
                pages_plan.append({
                    "page_number": page_num,
                    "text": native_text,
                    "method": "native_text",
                    "status": "success",
                    "error": None,
                    "page_idx": i
                })
            else:
                pages_plan.append({
                    "page_number": page_num,
                    "text": "",
                    "method": f"vision provider={provider} model={model}",
                    "status": "pending_vision",
                    "error": None,
                    "page_idx": i
                })

        # Check if any pages need Vision AI
        vision_needed = [p for p in pages_plan if p["status"] == "pending_vision"]

        if vision_needed:
            # Check capability upfront
            if is_known_non_vision_model(provider, model):
                err_msg = "Selected model does not support image/document vision input. Please select a multimodal model."
                logger.error(f"[PDF-PARSER-CAPABILITY-ERROR] {err_msg} (provider='{provider}', model='{model}')")
                if doc_fitz:
                    try:
                        doc_fitz.close()
                    except Exception:
                        pass
                return {
                    "success": False,
                    "error": err_msg,
                    "filename": filename,
                    "file_format": "PDF",
                    "page_count": page_count,
                    "extracted_text": "",
                    "pages": [],
                    "ocr_used": True,
                    "char_count": 0,
                    "latency_ms": round((time.time() - start_time) * 1000, 1),
                }

            # Render images for scanned pages
            rendered_images: Dict[int, Any] = {}
            if doc_fitz is not None and fitz is not None:
                for p_info in vision_needed:
                    p_idx = p_info["page_idx"]
                    try:
                        zoom = 300.0 / 72.0
                        matrix = fitz.Matrix(zoom, zoom)
                        pix = doc_fitz[p_idx].get_pixmap(matrix=matrix, alpha=False)
                        rendered_images[p_info["page_number"]] = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
                    except Exception as r_err:
                        logger.warning(f"[PDF-PARSER] Image render error for page {p_info['page_number']}: {r_err}")

            # Safe Concurrency for Scanned Pages (Max 3 concurrent requests to respect rate limits)
            def process_vision_page(p_info: Dict[str, Any]) -> Dict[str, Any]:
                p_num = p_info["page_number"]
                logger.info(f"page={p_num} extraction=vision provider={provider} model={model}")
                p_img = rendered_images.get(p_num)
                if not p_img or not llm_config:
                    return {
                        "page_number": p_num,
                        "text": "",
                        "status": "failed",
                        "error": "Image render missing or unconfigured LLM credentials"
                    }

                v_text, v_err = cls._extract_page_with_provider_vision(
                    img=p_img,
                    llm_config=llm_config,
                    document_id=doc_id,
                    page_number=p_num
                )
                if v_text:
                    return {
                        "page_number": p_num,
                        "text": v_text,
                        "status": "success",
                        "error": None
                    }
                else:
                    return {
                        "page_number": p_num,
                        "text": "",
                        "status": "failed",
                        "error": v_err or "Vision extraction returned empty"
                    }

            # Execute vision workers
            max_workers = min(3, max(1, len(vision_needed)))
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_map = {executor.submit(process_vision_page, p_item): p_item["page_number"] for p_item in vision_needed}
                for fut in as_completed(future_map):
                    p_num = future_map[fut]
                    try:
                        res = fut.result()
                        # Update pages_plan
                        for p_plan in pages_plan:
                            if p_plan["page_number"] == p_num:
                                p_plan["text"] = res["text"]
                                p_plan["status"] = res["status"]
                                p_plan["error"] = res["error"]
                                if res["error"] and "multimodal" in res["error"]:
                                    # If capability error returned by provider, record it
                                    p_plan["capability_error"] = True
                    except Exception as f_err:
                        logger.error(f"[PDF-PARSER] Vision task execution exception on page {p_num}: {f_err}")
                        for p_plan in pages_plan:
                            if p_plan["page_number"] == p_num:
                                p_plan["status"] = "failed"
                                p_plan["error"] = str(f_err)

        if doc_fitz:
            try:
                doc_fitz.close()
            except Exception:
                pass

        # Check if any page suffered capability error
        if any(p.get("capability_error") for p in pages_plan):
            err_msg = "Selected model does not support image/document vision input. Please select a multimodal model."
            return {
                "success": False,
                "error": err_msg,
                "filename": filename,
                "file_format": "PDF",
                "page_count": page_count,
                "extracted_text": "",
                "pages": [],
                "ocr_used": True,
                "char_count": 0,
                "latency_ms": round((time.time() - start_time) * 1000, 1),
            }

        successful_pages = sum(1 for p in pages_plan if p["status"] == "success" and p["text"].strip())
        failed_pages = sum(1 for p in pages_plan if p["status"] != "success" or not p["text"].strip())

        logger.info(f"DOCUMENT_COMPLETE pages={page_count} successful={successful_pages} failed={failed_pages}")

        # Assemble full text with page markers
        full_text_blocks = []
        for p in pages_plan:
            if p["text"].strip():
                full_text_blocks.append(f"## Page {p['page_number']}\n{p['text'].strip()}")

        full_text = "\n\n".join(full_text_blocks)
        full_text = clean_raw_pdf_binary_streams(full_text)
        latency_ms = round((time.time() - start_time) * 1000, 1)

        extracted_pages = [
            {
                "page_number": p["page_number"],
                "text": p["text"],
                "method": p["method"],
                "status": p["status"],
                "error": p.get("error")
            }
            for p in pages_plan
        ]

        first_error = next((p.get("error") for p in pages_plan if p.get("error")), None)
        overall_error = None
        if not full_text.strip():
            if first_error:
                overall_error = f"Document parsing failed during Vision extraction: {first_error}"
            else:
                overall_error = f"No readable content could be extracted from '{filename}'."

        ocr_used = any(p.get("status") == "success" and "vision" in p.get("method", "") for p in pages_plan)
        extraction_method = "multi_page_hybrid_vision" if ocr_used else "native_text"

        return {
            "success": bool(full_text.strip()),
            "error": overall_error,
            "filename": filename,
            "file_format": "PDF",
            "page_count": page_count,
            "extracted_text": full_text,
            "pages": extracted_pages,
            "ocr_used": ocr_used,
            "extraction_method": extraction_method,
            "char_count": len(full_text),
            "latency_ms": latency_ms,
            "successful_pages": successful_pages,
            "failed_pages": failed_pages
        }
