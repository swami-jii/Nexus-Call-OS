"""
OCR Fallback Extractor for Images when VLM is offline or unavailable.
"""

import io
import logging
from typing import Optional
from PIL import Image

logger = logging.getLogger(__name__)


class OCRFallbackExtractor:
    """Fallback OCR extractor using pytesseract or basic layout rules."""

    @classmethod
    def extract_text(cls, image_bytes: bytes) -> str:
        try:
            import pytesseract
            img = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(img)
            return text.strip() if text else ""
        except Exception as e:
            logger.info(f"PyTesseract not available or failed: {e}")
            return ""
