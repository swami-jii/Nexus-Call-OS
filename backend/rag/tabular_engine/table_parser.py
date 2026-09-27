"""
Tabular Dataset Parser for CSV, XLSX, and JSON files.
Converts relational datasets into clean Markdown tables with header schemas.
"""

import csv
import io
import json
import logging
from typing import Any
from backend.rag.types import ModalityType, ParsedDocument, ParsedPage

logger = logging.getLogger(__name__)


class TabularParser:
    """Parses CSV, XLSX, and JSON spreadsheets into queryable Markdown representations."""

    @classmethod
    def parse_csv(cls, file_bytes: bytes, filename: str, metadata: dict[str, Any]) -> ParsedDocument:
        try:
            text_content = file_bytes.decode("utf-8-sig", errors="ignore")
            reader = csv.reader(io.StringIO(text_content))
            rows = list(reader)
            if not rows:
                return cls._empty_doc(filename, metadata)

            headers = rows[0]
            header_line = "| " + " | ".join(headers) + " |"
            sep_line = "| " + " | ".join(["---"] * len(headers)) + " |"
            data_lines = [header_line, sep_line]

            for r in rows[1:]:
                if any(r):
                    data_lines.append("| " + " | ".join(r) + " |")

            full_table = "\n".join(data_lines)
            page = ParsedPage(page_number=1, text=full_table, tables=[full_table])
            return ParsedDocument(
                filename=filename,
                modality=ModalityType.TABULAR,
                full_text=full_table,
                pages=[page],
                metadata=metadata
            )
        except Exception as e:
            logger.warning(f"Error parsing CSV: {e}")
            return cls._empty_doc(filename, metadata)

    @classmethod
    def parse_json(cls, file_bytes: bytes, filename: str, metadata: dict[str, Any]) -> ParsedDocument:
        try:
            raw_text = file_bytes.decode("utf-8", errors="ignore")
            data = json.loads(raw_text)
            formatted = json.dumps(data, indent=2, ensure_ascii=False)
            page = ParsedPage(page_number=1, text=formatted)
            return ParsedDocument(
                filename=filename,
                modality=ModalityType.TABULAR,
                full_text=formatted,
                pages=[page],
                metadata=metadata
            )
        except Exception as e:
            logger.warning(f"Error parsing JSON table: {e}")
            return cls._empty_doc(filename, metadata)

    @classmethod
    def _empty_doc(cls, filename: str, metadata: dict[str, Any]) -> ParsedDocument:
        text = f"Empty tabular dataset: {filename}"
        return ParsedDocument(
            filename=filename,
            modality=ModalityType.TABULAR,
            full_text=text,
            pages=[ParsedPage(page_number=1, text=text)],
            metadata=metadata
        )
