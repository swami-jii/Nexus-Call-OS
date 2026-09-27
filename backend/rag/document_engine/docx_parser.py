"""
DOCX, TXT, MD Document Parser.
Extracts structured sections and markdown from Word documents and raw text files.
"""

import io
import logging
from typing import Any
from backend.rag.types import ModalityType, ParsedDocument, ParsedPage

logger = logging.getLogger(__name__)


class DocxParser:
    """Parses DOCX, DOC, TXT, and Markdown files into structured document models."""

    @classmethod
    def parse_docx(cls, file_bytes: bytes, filename: str, metadata: dict[str, Any]) -> ParsedDocument:
        full_text = ""
        try:
            import docx2txt
            full_text = docx2txt.process(io.BytesIO(file_bytes))
        except Exception as e:
            logger.info(f"docx2txt extraction fallback: {e}")
            try:
                import docx
                doc = docx.Document(io.BytesIO(file_bytes))
                paras = [p.text for p in doc.paragraphs if p.text]
                full_text = "\n".join(paras)
            except Exception:
                full_text = file_bytes.decode("utf-8", errors="ignore")

        page = ParsedPage(page_number=1, text=full_text)
        return ParsedDocument(
            filename=filename,
            modality=ModalityType.DOCUMENT,
            full_text=full_text,
            pages=[page],
            metadata=metadata
        )

    @classmethod
    def parse_text(cls, file_bytes: bytes, filename: str, metadata: dict[str, Any]) -> ParsedDocument:
        full_text = file_bytes.decode("utf-8", errors="ignore")
        page = ParsedPage(page_number=1, text=full_text)
        return ParsedDocument(
            filename=filename,
            modality=ModalityType.DOCUMENT,
            full_text=full_text,
            pages=[page],
            metadata=metadata
        )
