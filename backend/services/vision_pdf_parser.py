"""
Vision-Based PDF Parser Engine (Nexus Call OS)
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
        max_dim = 1200
        if img.width > max_dim or img.height > max_dim:
            img = img.copy()
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        img.save(buffer, format=format_type, quality=80, optimize=True)
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
        Implements explicit httpx timeout (read=45s), bounded exponential backoff retries (max_retries=3),
        and respects 429 rate limit Retry-After headers without model fallbacks or key logging.
        """
        provider = str(llm_config.get("provider") or "").lower().strip()
        model = str(llm_config.get("model") or "").strip()
        api_key = str(llm_config.get("api_key") or "").strip()
        base_url = llm_config.get("base_url")

        if not model or model == "default":
            err = f"No active model configured for provider '{provider}'. Please configure in Tab 1."
            return None, err

        if not api_key and provider not in ["ollama"]:
            err = f"Missing API credentials for provider '{provider}'. Please configure in Tab 1."
            return None, err

        # Check known text-only capability
        if is_known_non_vision_model(provider, model):
            err = "Selected model does not support image/document vision input. Please select a multimodal model."
            return None, err

        b64_img = cls._image_to_base64(img, format_type="JPEG")

        # Explicit Granular Timeout: 45s Read Timeout for Fast Vision Extraction
        VISION_TIMEOUT = httpx.Timeout(connect=10.0, read=45.0, write=20.0, pool=20.0)
        max_retries = 3

        # Build Provider Request Endpoint & Payload
        if provider in ["google", "gemini", "google_ai_studio", "google_cloud"]:
            clean_key = api_key.replace("Bearer ", "").strip()
            if clean_key.startswith("ya29."):
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                headers = {"Content-Type": "application/json", "Authorization": f"Bearer {clean_key}"}
            else:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={clean_key}"
                headers = {"Content-Type": "application/json", "x-goog-api-key": clean_key}
            payload: dict[str, Any] = {
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
        elif provider in ["anthropic", "claude"]:
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": model,
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
        else:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Content-Type": "application/json"}
            if base_url:
                url = base_url.rstrip("/") + "/chat/completions" if not base_url.endswith("/chat/completions") else base_url
            elif provider == "groq":
                url = "https://api.groq.com/openai/v1/chat/completions"
            elif provider in ["openrouter"] or "openrouter" in provider:
                url = "https://openrouter.ai/api/v1/chat/completions"
                headers["HTTP-Referer"] = "http://localhost:3000"
                headers["X-Title"] = "Nexus Call OS"

            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"

            payload = {
                "model": model,
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

        last_error: Optional[str] = None

        # Bounded Exponential Backoff Retry Loop (Max 3 Retries)
        for attempt in range(1, max_retries + 1):
            try:
                with httpx.Client(timeout=VISION_TIMEOUT) as client:
                    res = client.post(url, json=payload, headers=headers)

                    if res.status_code == 200:
                        data = res.json()
                        extracted_text = ""
                        if provider in ["google", "gemini", "google_ai_studio", "google_cloud"]:
                            candidates = data.get("candidates", [])
                            if candidates:
                                text_parts = candidates[0].get("content", {}).get("parts", [])
                                extracted_text = "".join([p.get("text", "") for p in text_parts])
                        elif provider in ["anthropic", "claude"]:
                            blocks = data.get("content", [])
                            extracted_text = "".join([b.get("text", "") for b in blocks if b.get("type") == "text"]).strip()
                        else:
                            extracted_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

                        if extracted_text:
                            return clean_raw_pdf_binary_streams(extracted_text), None

                    elif res.status_code == 400:
                        err_body = res.text.lower()
                        if any(phrase in err_body for phrase in [
                            "not support image", "image_url is not supported", "not a multimodal model",
                            "multimodal", "unsupported model", "invalid content type", "invalid value for 'image'"
                        ]):
                            return None, "Selected model does not support image/document vision input. Please select a multimodal model."
                        last_error = f"Vision API error 400: {res.text}"
                        return None, last_error

                    elif res.status_code == 429:
                        retry_after_sec = 5.0
                        try:
                            hdr = res.headers.get("retry-after")
                            if hdr:
                                retry_after_sec = float(hdr)
                            else:
                                err_txt = res.text
                                match = re.search(r"retry in (\d+(?:\.\d+)?)s", err_txt, re.IGNORECASE)
                                if match:
                                    retry_after_sec = float(match.group(1))
                        except Exception:
                            pass

                        sleep_sec = min(max(retry_after_sec, 2.0), 10.0)
                        logger.warning(
                            f"[VISION-AI-RATELIMIT] provider='{provider}' model='{model}' page_number={page_number} "
                            f"attempt={attempt}/{max_retries}. 429 Quota Limit. Sleeping {sleep_sec:.1f}s..."
                        )
                        last_error = f"Rate limit 429: {res.text}"
                        if attempt < max_retries:
                            time.sleep(sleep_sec)
                            continue
                        return None, last_error
                    else:
                        last_error = f"Vision API error {res.status_code}: {res.text}"
                        if attempt < max_retries:
                            time.sleep(1.5 * attempt)
                            continue
                        return None, last_error

            except (httpx.ReadTimeout, httpx.ConnectTimeout, httpx.TimeoutException) as tex:
                last_error = f"Network timeout: {tex}"
                logger.warning(
                    f"[VISION-AI-TIMEOUT] provider='{provider}' model='{model}' page_number={page_number} attempt={attempt}/{max_retries}: {tex}"
                )
                if attempt < max_retries:
                    time.sleep(1.5 * attempt)
                    continue
                return None, last_error
            except Exception as ex:
                last_error = f"Vision exception: {ex}"
                logger.warning(
                    f"[VISION-AI-EXCEPTION] provider='{provider}' model='{model}' page_number={page_number} attempt={attempt}/{max_retries}: {ex}"
                )
                if attempt < max_retries:
                    time.sleep(1.5 * attempt)
                    continue
                return None, last_error

        return None, last_error

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
