"""
Document Modality Sub-Engine.
PDF, DOCX, TXT, MD, RTF multi-column parsing, hierarchy extraction, and DeepDoc table preservation.
"""

from typing import Any, Optional
from backend.rag.types import ParsedDocument
from backend.rag.document_engine.pdf_parser import PDFParser
from backend.rag.document_engine.docx_parser import DocxParser
from backend.rag.document_engine.hierarchy_chunker import (
    HierarchyChunker,
    format_evidence_snippet,
    sanitize_text,
)


class DocumentEngine:
    """Master Parser for Document modality (PDF, DOCX, DOC, TXT, MD, RTF)."""

    @classmethod
    def parse(
        cls,
        file_bytes: bytes,
        filename: str,
        ext: str,
        llm_config: Optional[dict[str, Any]] = None,
        metadata: Optional[dict[str, Any]] = None
    ) -> ParsedDocument:
        meta = metadata or {}
        meta["format"] = ext
        ext_low = ext.lower().replace(".", "")

        if ext_low == "pdf":
            return PDFParser.parse_pdf(file_bytes, filename, meta)
        elif ext_low in ["docx", "doc"]:
            return DocxParser.parse_docx(file_bytes, filename, meta)
        else:
            return DocxParser.parse_text(file_bytes, filename, meta)

    @classmethod
    def extract_from_bytes(
        cls,
        file_bytes: bytes,
        filename: str,
        ext: str,
        llm_config: Optional[dict[str, Any]] = None,
        metadata: Optional[dict[str, Any]] = None
    ) -> dict[str, Any]:
        parsed = cls.parse(file_bytes, filename, ext, llm_config, metadata)
        return {
            "text": parsed.full_text,
            "filename": filename,
            "format": ext,
            "pages": len(parsed.pages)
        }


__all__ = [
    "DocumentEngine",
    "PDFParser",
    "DocxParser",
    "HierarchyChunker",
    "sanitize_text",
    "format_evidence_snippet"
]
