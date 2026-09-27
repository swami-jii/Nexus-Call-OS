"""
Image Preprocessor for Low-Quality & Blurry Graphics.
Enhances contrast, normalizes resolution, and removes noise for high-precision VLM & OCR extraction.
"""

import io
import logging
from typing import Optional
from PIL import Image, ImageEnhance, ImageFilter

logger = logging.getLogger(__name__)


class ImagePreprocessor:
    """Preprocesses raw images to maximize visual reading accuracy on low quality images and screenshots."""

    @classmethod
    def enhance_image(cls, image_bytes: bytes, max_dimension: int = 2048) -> bytes:
        """Applies auto-contrast, sharpness tuning, and resolution scaling."""
        try:
            img = Image.open(io.BytesIO(image_bytes))

            # Convert RGBA or CMYK to RGB
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            elif img.mode == "CMYK":
                img = img.convert("RGB")

            # Scale if too large, or upscale if too small
            w, h = img.size
            if max(w, h) > max_dimension:
                scale = max_dimension / max(w, h)
                img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
            elif max(w, h) < 600:
                # Upscale tiny blurry images for better OCR / VLM legibility
                scale = 2.0
                img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.BICUBIC)

            # Auto-contrast & sharpness enhancement
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.2)

            sharpener = ImageEnhance.Sharpness(img)
            img = sharpener.enhance(1.3)

            out_buf = io.BytesIO()
            img.save(out_buf, format="JPEG", quality=92)
            return out_buf.getvalue()
        except Exception as e:
            logger.warning(f"Error enhancing image: {e}. Returning original bytes.")
            return image_bytes
