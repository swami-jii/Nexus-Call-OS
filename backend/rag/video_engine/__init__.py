"""
Video Modality Sub-Engine.
Keyframe extraction, visual scene analysis, and multi-stream fusion.
"""

from typing import Any, Optional
from backend.rag.types import ParsedDocument
from backend.rag.video_engine.keyframe_extractor import VideoKeyframeExtractor
from backend.rag.video_engine.stream_merger import VideoStreamMerger


class VideoEngine:
    """Master Parser for Video modality (MP4, WEBM, MOV, AVI, MKV)."""

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
        keyframes = VideoKeyframeExtractor.extract_keyframes(file_bytes, filename)
        return VideoStreamMerger.merge_streams(
            filename=filename,
            keyframes=keyframes,
            audio_transcript="",
            metadata=meta
        )


__all__ = ["VideoEngine", "VideoKeyframeExtractor", "VideoStreamMerger"]
