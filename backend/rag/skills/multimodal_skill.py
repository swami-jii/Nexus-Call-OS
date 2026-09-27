"""
Create Call OS — Universal Multimodal Intelligence Skill.
Coordinates modality-specific reasoning instructions across Audio, Video, Image, Tabular, Web, and Documents.
"""

from typing import Any, Dict


class MultimodalSkill:
    """Modality-specific reasoning and context conditioning skill."""

    @staticmethod
    def get_modality_guidance(modality: str) -> Dict[str, str]:
        """Returns cognitive guidance instructions tailored to the source modality."""
        mod = (modality or "document").lower().strip()

        if mod in ["audio", "mp3", "wav", "m4a", "stt", "speech"]:
            return {
                "modality_type": "AUDIO / SPEECH",
                "focus": "Transcribed telephone dialogue, caller verbal statements, speech sentiment, and audio recordings.",
                "guidance": "Anchor response to spoken statements in the transcript, noting caller intent, agent replies, and agreed action items."
            }
        elif mod in ["video", "mp4", "webm", "mov", "screen"]:
            return {
                "modality_type": "VIDEO / MULTIMODAL",
                "focus": "Visual frame analysis, on-screen demonstrations, slide captures, and video audio tracks.",
                "guidance": "Synthesize both visual on-screen actions and spoken narration from the video frames."
            }
        elif mod in ["image", "png", "jpg", "jpeg", "webp", "graphic"]:
            return {
                "modality_type": "IMAGE / GRAPHIC OCR",
                "focus": "Visual infographics, diagram workflows, scanned forms, charts, and OCR extracted text blocks.",
                "guidance": "Interpret visual hierarchies, labels, diagram connections, and tabular data extracted from images."
            }
        elif mod in ["tabular", "csv", "xlsx", "xls", "json", "tsv"]:
            return {
                "modality_type": "TABULAR DATA",
                "focus": "Structured row-column records, numerical metrics, entity matrices, and inventory datasets.",
                "guidance": "Extract exact row-level attribute matches, numerical figures, and column headers with high precision."
            }
        elif mod in ["web", "html", "url", "sitemap"]:
            return {
                "modality_type": "WEB SCRAPE / DOM",
                "focus": "Online documentation, web pages, help articles, sitemaps, and live web feeds.",
                "guidance": "Extract page sections, navigation menus, product descriptions, and footer policies."
            }
        else:
            return {
                "modality_type": "DOCUMENT / PDF",
                "focus": "Multi-page structured documents, manuals, whitepapers, contracts, and business procedures.",
                "guidance": "Extract multi-page hierarchical sections, headings, bullet lists, and tables with full context."
            }
