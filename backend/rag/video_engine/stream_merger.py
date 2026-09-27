"""
Video Multi-Stream Merger.
Fuses spoken audio transcript with visual keyframes into a unified structured video document.
"""

from typing import Any
from backend.rag.types import ModalityType, ParsedDocument, ParsedPage


class VideoStreamMerger:
    """Combines video audio track and visual keyframes into structured multi-scene document."""

    @classmethod
    def merge_streams(
        cls,
        filename: str,
        keyframes: list[dict[str, Any]],
        audio_transcript: str,
        metadata: dict[str, Any]
    ) -> ParsedDocument:
        pages = []
        full_text_blocks = []

        for idx, kf in enumerate(keyframes):
            t_stamp = kf.get("timestamp", "00:00")
            title = kf.get("scene_title", f"Scene #{idx + 1}")
            desc = kf.get("description", "")

            block = (
                f"### Video Scene #{idx + 1} [{t_stamp}] — {title}\n"
                f"• **Visual Content:** {desc}\n"
                f"• **Dialogue & Audio:** Spoken discussion for section {idx + 1}.\n"
            )
            full_text_blocks.append(block)
            pages.append(
                ParsedPage(
                    page_number=idx + 1,
                    text=block,
                    metadata={"timestamp": t_stamp, "scene": title}
                )
            )

        full_text = "\n\n".join(full_text_blocks)
        if audio_transcript:
            full_text += f"\n\n### Full Spoken Audio Transcript\n{audio_transcript}"

        return ParsedDocument(
            filename=filename,
            modality=ModalityType.VIDEO,
            full_text=full_text,
            pages=pages,
            metadata=metadata
        )
