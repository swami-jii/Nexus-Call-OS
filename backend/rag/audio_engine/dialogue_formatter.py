"""
Audio Dialogue Formatter.
Converts raw transcription segments into structured conversational markdown with timestamps and speaker turns.
"""

from typing import Any
from backend.rag.types import ModalityType, ParsedDocument, ParsedPage


class DialogueFormatter:
    """Formats timestamped audio transcripts into clean, indexed conversational knowledge blocks."""

    @classmethod
    def format_segments_to_document(
        cls,
        filename: str,
        segments: list[dict[str, Any]],
        metadata: dict[str, Any]
    ) -> ParsedDocument:
        formatted_lines = []
        pages = []
        full_text_parts = []

        chunk_size = 5
        for i in range(0, max(1, len(segments)), chunk_size):
            group = segments[i:i + chunk_size]
            page_lines = []
            for seg in group:
                s_time = cls._format_time(seg.get("start", 0.0))
                e_time = cls._format_time(seg.get("end", 0.0))
                speaker = seg.get("speaker", "Speaker")
                text = seg.get("text", "").strip()
                if text:
                    line = f"[{s_time} - {e_time}] **{speaker}:** {text}"
                    page_lines.append(line)

            page_content = "\n".join(page_lines)
            full_text_parts.append(page_content)
            pages.append(
                ParsedPage(
                    page_number=len(pages) + 1,
                    text=page_content,
                    metadata={"segment_count": len(group)}
                )
            )

        full_text = "\n\n".join(full_text_parts)

        return ParsedDocument(
            filename=filename,
            modality=ModalityType.AUDIO,
            full_text=full_text,
            pages=pages,
            metadata=metadata
        )

    @classmethod
    def _format_time(cls, seconds: float) -> str:
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins:02d}:{secs:02d}"
