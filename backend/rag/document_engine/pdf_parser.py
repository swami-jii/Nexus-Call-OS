"""
PDF Document Parser.
Structure-aware, multi-column PDF extraction preserving page numbers, section headers, and table structures.
Inspired by RAGFlow DeepDoc & Docling PDF parser.
"""

import io
import logging
import re
from typing import Any
from backend.rag.types import ModalityType, ParsedDocument, ParsedPage

logger = logging.getLogger(__name__)


class PDFParser:
    """Extracts structured text, headings, and tables from PDF files with page-level boundaries."""

    @classmethod
    def parse_pdf(cls, file_bytes: bytes, filename: str, metadata: dict[str, Any]) -> ParsedDocument:
        pages = []
        full_text_parts = []
        structured_tables = []

        try:
            try:
                import pymupdf as fitz  # PyMuPDF
            except ImportError:
                import fitz  # PyMuPDF
            doc = fitz.open(stream=file_bytes, filetype="pdf")

            for page_idx in range(len(doc)):
                page = doc[page_idx]
                page_text = page.get_text("text") or ""
                clean_p_text = page_text.strip()

                # Extract headings
                headings = []
                for line in clean_p_text.split("\n"):
                    l_s = line.strip()
                    if 3 < len(l_s) < 60 and (l_s.isupper() or l_s.endswith(":") or re.match(r"^\d+[\.\)]\s+", l_s)):
                        headings.append(l_s)

                # Try PyMuPDF tabulate if available
                tables = []
                try:
                    tabs = page.find_tables()
                    for t in tabs:
                        df = t.extract()
                        if df and len(df) > 1:
                            md_table = cls._matrix_to_markdown(df)
                            tables.append(md_table)
                            structured_tables.append({"page": page_idx + 1, "table": md_table})
                except Exception:
                    pass

                page_obj = ParsedPage(
                    page_number=page_idx + 1,
                    text=clean_p_text,
                    headings=headings[:5],
                    tables=tables,
                    metadata={"page_width": page.rect.width, "page_height": page.rect.height}
                )
                pages.append(page_obj)
                full_text_parts.append(f"## Page {page_idx + 1}\n{clean_p_text}")

            doc.close()

        except Exception as e:
            logger.warning(f"PyMuPDF PDF parsing fallback: {e}")
            # Text fallback
            raw_text = file_bytes.decode("utf-8", errors="ignore")
            pages.append(ParsedPage(page_number=1, text=raw_text))
            full_text_parts.append(raw_text)

        full_text = "\n\n".join(full_text_parts)

        return ParsedDocument(
            filename=filename,
            modality=ModalityType.DOCUMENT,
            full_text=full_text,
            pages=pages,
            metadata=metadata,
            structured_tables=structured_tables
        )

    @classmethod
    def _matrix_to_markdown(cls, matrix: list[list[Any]]) -> str:
        if not matrix:
            return ""
        headers = [str(c or "").strip() for c in matrix[0]]
        header_row = "| " + " | ".join(headers) + " |"
        sep_row = "| " + " | ".join(["---"] * len(headers)) + " |"
        rows = [header_row, sep_row]
        for r in matrix[1:]:
            cells = [str(c or "").strip() for c in r]
            if any(cells):
                rows.append("| " + " | ".join(cells) + " |")
        return "\n".join(rows)
