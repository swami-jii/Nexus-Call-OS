"""
Vision Language Model (VLM) Deep Visual Document Extractor.
Extracts structured layout, markdown tables, data matrices, and text using Tab 1 Vision Model (Gemini/OpenAI/Claude).
Inspired by MinerU & Docling multimodal parsing architectures.
"""

import base64
import logging
from typing import Any, Optional
from backend.rag.core.ssot_resolver import SSOTResolver

logger = logging.getLogger(__name__)

DOCLING_VLM_PROMPT = """You are a high-precision Multimodal Document & Visual Layout Intelligence Engine.
Extract ALL visible text, tables, data matrices, headers, labels, numbers, and structural content from this image.

RULES:
1. Layout Hierarchy: Use `#` for document titles, `##` for major sections, and `###` for sub-sections.
2. Tables & Grid Data: Convert all row-column structures, key-value grids, and comparisons into clean GitHub-flavored Markdown tables with appropriate headers.
3. Strict Exact Values: Never alter digits, codes, dates, monetary amounts, currencies, contact details, or technical specifications.
4. Clean Output: Do not include OCR noise, markdown image tags (`![image](...)`), or placeholder tokens.
5. Return clean, structured Markdown content directly."""


class VLMExtractor:
    """Extracts structured text and layout from images using active Tab 1 Vision models."""

    @classmethod
    def extract_from_image_bytes(
        cls,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        llm_config: Optional[dict[str, Any]] = None
    ) -> Optional[str]:
        """Sends image to active Tab 1 Vision model for structured extraction."""
        cfg = llm_config or SSOTResolver.resolve_llm_or_vision_config()
        if not cfg or not cfg.get("api_key"):
            return None

        prov = cfg.get("provider", "gemini").lower()
        api_key = cfg["api_key"]
        model = cfg.get("model", "gemini-2.5-flash")

        try:
            if "gemini" in prov or "google" in prov:
                from google import genai
                from google.genai import types
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model=model,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        DOCLING_VLM_PROMPT
                    ]
                )
                return response.text if response and response.text else None

            elif "openai" in prov:
                import openai
                client = openai.OpenAI(api_key=api_key)
                b64_img = base64.b64encode(image_bytes).decode("utf-8")
                response = client.chat.completions.create(
                    model=model or "gpt-4o-mini",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": DOCLING_VLM_PROMPT},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:{mime_type};base64,{b64_img}"}
                                }
                            ]
                        }
                    ],
                    max_tokens=4000
                )
                return response.choices[0].message.content if response.choices else None

        except Exception as e:
            logger.warning(f"VLM visual extraction failed with {prov}: {e}")
            return None

        return None
