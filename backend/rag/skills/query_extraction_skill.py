"""
Create Call OS — Universal Dynamic Query & Topic Card Intelligence Skill.
Extracts realistic caller inquiry cards, topics, and category cards from any source asset
(PDF, DOCX, CSV, Image OCR, Video/Audio transcription, Web scrape, etc.) across all industries.
"""

import json
import logging
import re
from typing import Any, List, Optional

logger = logging.getLogger(__name__)


class QueryExtractionSkill:
    """Universal Dynamic Query & Grounding Card Extraction Skill."""

    @staticmethod
    def build_extraction_system_prompt() -> str:
        """Constructs an industry-agnostic system prompt for dynamic inquiry card generation."""
        return (
            "You are the Create Call OS Universal Grounding & Inquiry Extraction Intelligence Engine.\n"
            "Analyze the provided asset text excerpt and extract exactly 6 realistic, high-value caller or user inquiry cards "
            "that represent what real customers, clients, or operators would ask regarding this specific asset.\n\n"
            "CORE REQUIREMENTS:\n"
            "1. Output strictly a valid JSON array containing exactly 6 objects without markdown code blocks, backticks, or preamble.\n"
            "2. Ground every card directly in the actual topics, specifications, steps, offerings, policies, or facts present in the text.\n"
            "3. Strip all OCR artifacts, bullet symbols, and layout markers. Keep labels clean, elegant, and concise.\n"
            "4. Each JSON object MUST have the following schema:\n"
            "   - 'label': Concise title of the topic, section, or subject (max 22 characters)\n"
            "   - 'query': Natural conversational question asking for details about this topic in the language of the source text\n"
            "   - 'icon': Semantic UI icon identifier (one of 'service', 'app', 'api', 'pricing', 'contact', 'policy', 'help', 'sparkles', 'calendar', 'document')\n"
            "   - 'category': High-level category directly derived from the document content (max 20 characters)\n"
            "   - 'badge': Brief contextual badge from the text (e.g. key figure, status, duration, or tier, max 12 characters)\n\n"
            "Return ONLY the raw JSON array."
        )

    @classmethod
    def extract_queries_with_llm(
        cls,
        doc_text: str,
        filename: str,
        llm_invoker_fn: Any,
        llm_config: dict[str, Any]
    ) -> List[dict[str, Any]]:
        """Invokes the configured LLM to extract 6 dynamic inquiry cards."""
        if not doc_text or not llm_config:
            return []

        clean_text = re.sub(r"\[\s*(?:Icon|Logo|Image|Button|Get Started|QR CODE IMAGE|x|X|\s*)\s*\]", "", doc_text, flags=re.IGNORECASE)
        clean_text = re.sub(r"\*{2,}", "", clean_text).strip()

        sys_prompt = cls.build_extraction_system_prompt()
        usr_prompt = f"Source Asset: {filename}\n\nAsset Content Excerpt:\n{clean_text[:4500]}"

        try:
            resp = llm_invoker_fn(sys_prompt, usr_prompt, llm_config)
            if isinstance(resp, str):
                cleaned = re.sub(r"^```(?:json)?", "", resp.strip(), flags=re.IGNORECASE)
                cleaned = re.sub(r"```$", "", cleaned.strip()).strip()
                parsed = json.loads(cleaned)
                if isinstance(parsed, list) and len(parsed) >= 4:
                    valid_cards: List[dict[str, Any]] = []
                    for item in parsed:
                        if isinstance(item, dict) and item.get("label") and item.get("query"):
                            lbl = str(item.get("label", "")).replace("*", "").strip()
                            lbl = re.sub(r"\[\s*[^\]]*\s*\]", "", lbl).strip()
                            item["label"] = lbl[:22]
                            item["query"] = str(item.get("query", "")).replace("*", "").strip()
                            item["badge"] = re.sub(r"\[\s*[^\]]*\s*\]", "", str(item.get("badge", ""))).replace("*", "").strip()[:12]
                            item["category"] = str(item.get("category", "General")).strip()
                            item["icon"] = str(item.get("icon", "sparkles")).strip()
                            valid_cards.append(item)
                    if len(valid_cards) >= 4:
                        return valid_cards[:6]
        except Exception as e:
            logger.warning(f"LLM query extraction notice: {e}")

        return []

    @classmethod
    def extract_queries_structural_fallback(cls, doc_text: str, filename: str) -> List[dict[str, Any]]:
        """Algorithmic, zero-hardcode structural analysis of document headings, tables, and bullet lists."""
        if not doc_text:
            return cls.generate_generic_cards(filename)

        lines = [l.strip() for l in doc_text.split("\n") if l.strip()]
        results: List[dict[str, Any]] = []
        seen: set[str] = set()

        def add_card(lbl: str, q: str, cat: str, icn: str, bdg: str):
            clean = re.sub(r"^[\d\.\-\*#:\s]+", "", lbl).strip()
            clean = re.sub(r"\[\s*[^\]]*\s*\]", "", clean).strip().replace("*", "")
            norm = re.sub(r"[^a-zA-Z0-9\u0900-\u097F]", "", clean.lower())
            if len(clean) < 3 or norm in seen:
                return
            seen.add(norm)
            results.append({
                "label": clean[:22],
                "query": q.replace("*", "").strip(),
                "category": cat,
                "icon": icn,
                "badge": bdg.replace("*", "").strip()[:12]
            })

        # 1. Scan markdown tables
        for line in lines:
            m = re.match(r"^\|\s*\*\*?([^*|]{3,35})\*\*?\s*\|\s*\*\*?([^|]+)\*\*?\s*\|", line)
            if m:
                h1, h2 = m.group(1).strip(), m.group(2).strip()
                if "---" not in h1 and len(h1) > 2:
                    add_card(h1, f"What are the details and specifications for {h1} ({h2}) in {filename}?", "Specifications", "service", h2[:10])

        # 2. Scan markdown headings
        for line in lines:
            if line.startswith("#"):
                heading = re.sub(r"^#+\s*(?:\d+[\.\)]\s*)?", "", line).strip()
                if 3 < len(heading) < 65 and not heading.lower().startswith("page"):
                    add_card(heading, f"What are the key details and information outlined under {heading}?", "Section", "document", "Topic")

        # 3. Scan bullet items
        for line in lines:
            bm = re.match(r"^[-*•+]\s*\*\*([^*:]{3,40}):?\*\*\s*(.*)", line)
            if bm:
                item_title = bm.group(1).strip()
                if 3 < len(item_title) < 40 and not item_title.lower().startswith("page"):
                    add_card(item_title, f"What are the details, features, and points regarding {item_title}?", "Details", "sparkles", "Item")


        # 4. Fill remaining slots with generic dynamic cards
        generic = cls.generate_generic_cards(filename)
        for g in generic:
            if len(results) >= 6:
                break
            add_card(g["label"], g["query"], g["category"], g["icon"], g["badge"])

        return results[:6]

    @staticmethod
    def generate_generic_cards(filename: str) -> List[dict[str, Any]]:
        """Generates dynamic generic fallback cards using the filename."""
        clean_name = filename.rsplit(".", 1)[0] if "." in filename else filename
        return [
            {"label": f"{clean_name[:16]} Summary", "query": f"What are the main topics and key points covered in {filename}?", "category": "Overview", "icon": "sparkles", "badge": "Summary"},
            {"label": "Key Specifications", "query": f"What specifications, requirements, or core details are outlined in {filename}?", "category": "Specifications", "icon": "service", "badge": "Core"},
            {"label": "Procedures & Steps", "query": f"What procedures, workflows, or operational steps are described in {filename}?", "category": "Operations", "icon": "app", "badge": "Steps"},
            {"label": "Guidelines & Terms", "query": f"What rules, policies, terms, or conditions are specified in {filename}?", "category": "Policies", "icon": "policy", "badge": "Rules"},
            {"label": "Contact & Support", "query": f"What contact information, references, or help channels are listed in {filename}?", "category": "Contact", "icon": "contact", "badge": "Support"},
            {"label": "Common Inquiries", "query": f"What common questions or FAQs can be answered using {filename}?", "category": "FAQ", "icon": "help", "badge": "FAQ"},
        ]
