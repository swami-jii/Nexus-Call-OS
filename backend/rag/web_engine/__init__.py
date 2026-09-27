"""
Web Modality Sub-Engine.
Clean DOM scraping and URL documentation extraction.
"""

from typing import Any, Optional
from backend.rag.types import ParsedDocument
from backend.rag.web_engine.scraper import WebScraper


class WebEngine:
    """Master Parser for Web URLs and HTML files."""

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
        html_str = file_bytes.decode("utf-8", errors="ignore")
        return WebScraper.parse_html(html_str, filename, meta)


__all__ = ["WebEngine", "WebScraper"]
