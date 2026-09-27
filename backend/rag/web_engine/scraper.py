"""
Web & URL Clean DOM Scraper.
Extracts pure main body text and structured markdown while stripping boilerplate navbars, footers, and ads.
Inspired by Trafilatura & Crawl4AI.
"""

import logging
import re
from typing import Any
from backend.rag.types import ModalityType, ParsedDocument, ParsedPage

logger = logging.getLogger(__name__)


class WebScraper:
    """Extracts structured markdown content from web pages and HTML files."""

    @classmethod
    def parse_html(cls, html_content: str, url_or_filename: str, metadata: dict[str, Any]) -> ParsedDocument:
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, "html.parser")

            # Remove boilerplate elements
            for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "aside", "form", "svg"]):
                tag.decompose()

            # Extract title
            title = soup.title.string if soup.title and soup.title.string else url_or_filename

            # Extract headings and main paragraphs
            lines = []
            lines.append(f"# {title.strip()}\n")

            main_elem = soup.find("main") or soup.find("article") or soup.find("body") or soup

            for elem in main_elem.find_all(["h1", "h2", "h3", "h4", "p", "li", "table"]):
                if elem.name in ["h1", "h2", "h3", "h4"]:
                    lvl = elem.name[1]
                    h_txt = elem.get_text().strip()
                    if h_txt:
                        lines.append(f"\n{'#' * int(lvl)} {h_txt}")
                elif elem.name == "p":
                    p_txt = elem.get_text().strip()
                    if p_txt and len(p_txt) > 10:
                        lines.append(p_txt)
                elif elem.name == "li":
                    li_txt = elem.get_text().strip()
                    if li_txt:
                        lines.append(f"• {li_txt}")
                elif elem.name == "table":
                    md_table = cls._soup_table_to_markdown(elem)
                    if md_table:
                        lines.append(f"\n{md_table}\n")

            full_text = "\n\n".join(lines)
            page = ParsedPage(page_number=1, text=full_text, metadata={"title": title})

            return ParsedDocument(
                filename=url_or_filename,
                modality=ModalityType.WEB,
                full_text=full_text,
                pages=[page],
                metadata=metadata
            )
        except Exception as e:
            logger.warning(f"Error parsing HTML web content: {e}")
            clean_txt = re.sub(r"<[^>]+>", " ", html_content)
            page = ParsedPage(page_number=1, text=clean_txt)
            return ParsedDocument(
                filename=url_or_filename,
                modality=ModalityType.WEB,
                full_text=clean_txt,
                pages=[page],
                metadata=metadata
            )

    @classmethod
    def _soup_table_to_markdown(cls, table_elem: Any) -> str:
        rows = []
        for tr in table_elem.find_all("tr"):
            cells = [td.get_text().strip() for td in tr.find_all(["th", "td"])]
            if cells:
                rows.append(cells)
        if not rows:
            return ""

        headers = rows[0]
        header_line = "| " + " | ".join(headers) + " |"
        sep_line = "| " + " | ".join(["---"] * len(headers)) + " |"
        data_lines = [header_line, sep_line]
        for r in rows[1:]:
            data_lines.append("| " + " | ".join(r) + " |")
        return "\n".join(data_lines)
