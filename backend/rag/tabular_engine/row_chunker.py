"""
Tabular Row Chunker.
Splits tabular rows into chunks while preserving table headers and schema on every single chunk.
"""

from typing import Any
from backend.rag.types import DocumentPattern
from backend.rag.document_engine.hierarchy_chunker import format_evidence_snippet


class TabularRowChunker:
    """Chunks large markdown tables preserving header row on every chunk."""

    @classmethod
    def chunk_table(
        cls,
        table_markdown: str,
        rows_per_chunk: int = 10
    ) -> list[dict[str, Any]]:
        lines = [l.strip() for l in table_markdown.split("\n") if l.strip()]
        if len(lines) < 3:
            return [{
                "chunk_index": 0,
                "title": "Dataset Records",
                "page_number": 1,
                "text": table_markdown,
                "word_count": len(table_markdown.split()),
                "pattern_type": DocumentPattern.MARKDOWN_TABLE.value,
                "snippet": format_evidence_snippet(table_markdown, max_words=20)
            }]

        header_row = lines[0]
        separator_row = lines[1]
        data_rows = lines[2:]

        chunks = []
        for i in range(0, max(1, len(data_rows)), rows_per_chunk):
            group = data_rows[i:i + rows_per_chunk]
            c_text = "\n".join([header_row, separator_row] + group)
            chunks.append({
                "chunk_index": len(chunks),
                "title": f"Table Records {i + 1} to {i + len(group)}",
                "page_number": 1,
                "text": c_text,
                "word_count": len(c_text.split()),
                "pattern_type": DocumentPattern.MARKDOWN_TABLE.value,
                "snippet": format_evidence_snippet(c_text, max_words=20)
            })

        return chunks
