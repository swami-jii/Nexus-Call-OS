"""
Image Modality Sub-Engine.
Provides end-to-end multimodal image understanding, contrast enhancement, VLM extraction, and OCR fallback.
"""

from typing import Any, Optional
from backend.rag.types import ModalityType, ParsedDocument, ParsedPage
from backend.rag.image_engine.preprocessor import ImagePreprocessor
from backend.rag.image_engine.vlm_extractor import VLMExtractor
from backend.rag.image_engine.ocr_fallback import OCRFallbackExtractor


class ImageEngine:
    """Master Parser for Image modality (PNG, JPG, JPEG, WEBP, BMP, TIFF)."""

    @classmethod
    def parse(
        cls,
        file_bytes: bytes,
        filename: str,
        ext: str,
        llm_config: Optional[dict[str, Any]] = None,
        metadata: Optional[dict[str, Any]] = None
    ) -> ParsedDocument:
        enhanced_bytes = ImagePreprocessor.enhance_image(file_bytes)
        mime = f"image/{ext.lower().replace('.', '')}"
        if mime == "image/jpg":
            mime = "image/jpeg"

        # 1. Primary: High-fidelity VLM extraction
        extracted_text = VLMExtractor.extract_from_image_bytes(
            image_bytes=enhanced_bytes,
            mime_type=mime,
            llm_config=llm_config
        )

        # 2. Fallback: Local OCR
        if not extracted_text:
            extracted_text = OCRFallbackExtractor.extract_text(enhanced_bytes)

        if not extracted_text:
            extracted_text = f"Image document: {filename} (Visual content indexed)."

        page = ParsedPage(
            page_number=1,
            text=extracted_text,
            metadata={"filename": filename, "format": ext, "enhanced": True}
        )

        return ParsedDocument(
            filename=filename,
            modality=ModalityType.IMAGE,
            full_text=extracted_text,
            pages=[page],
            metadata=metadata or {}
        )


__all__ = ["ImageEngine", "ImagePreprocessor", "VLMExtractor", "OCRFallbackExtractor"]
