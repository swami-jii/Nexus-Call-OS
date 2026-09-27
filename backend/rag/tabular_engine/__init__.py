"""
Tabular Modality Sub-Engine.
Relational spreadsheet parsing (CSV, XLSX, JSON) with header-preserving table chunking.
"""

from typing import Any, Optional
from backend.rag.types import ParsedDocument
from backend.rag.tabular_engine.table_parser import TabularParser
from backend.rag.tabular_engine.row_chunker import TabularRowChunker


class TabularEngine:
    """Master Parser for Tabular datasets (CSV, XLSX, XLS, JSON, TSV)."""

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

        if ext_low == "json":
            return TabularParser.parse_json(file_bytes, filename, meta)
        else:
            return TabularParser.parse_csv(file_bytes, filename, meta)


__all__ = ["TabularEngine", "TabularParser", "TabularRowChunker"]
