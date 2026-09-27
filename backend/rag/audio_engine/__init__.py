"""
Audio Modality Sub-Engine.
Speech-to-Text, speaker diarization, and timestamped conversational dialogue processing.
"""

from typing import Any, Optional
from backend.rag.types import ParsedDocument
from backend.rag.audio_engine.transcriber import AudioTranscriber
from backend.rag.audio_engine.dialogue_formatter import DialogueFormatter


class AudioEngine:
    """Master Parser for Audio modality (MP3, WAV, M4A, FLAC, OGG, AAC)."""

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
        segments = AudioTranscriber.transcribe(
            audio_bytes=file_bytes,
            filename=filename,
            ext=ext,
            stt_config=llm_config
        )
        return DialogueFormatter.format_segments_to_document(
            filename=filename,
            segments=segments,
            metadata=meta
        )


__all__ = ["AudioEngine", "AudioTranscriber", "DialogueFormatter"]
