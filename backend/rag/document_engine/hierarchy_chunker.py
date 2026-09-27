"""
Hierarchy Chunker, OCR Sanitization & 20w Evidence Snippet Formatter.
Implements DeepDoc section boundary preservation, markdown table cohesion, and ChatGPT-grade formatting.
"""

import re
from typing import Any
from backend.rag.types import DocumentPattern
from backend.rag.nlp_engine.multilingual_tokenizer import MultilingualTokenizer


def convert_markdown_tables_to_structured_text(text: str) -> str:
    """Converts multi-column markdown tables into rich, structured, entity-centric representations."""
    if not text or "|" not in text:
        return text

    lines = text.split("\n")
    out_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Check if line is a table header row followed by delimiter row
        if "|" in line and i + 1 < len(lines) and re.match(r"^\s*\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)+\|?\s*$", lines[i+1]):
            headers = [c.strip() for c in line.split("|") if c.strip()]
            i += 2  # Skip header and delimiter
            rows = []
            while i < len(lines) and "|" in lines[i] and lines[i].strip():
                row_cells = [c.strip() for c in lines[i].split("|") if c.strip()]
                rows.append(row_cells)
                i += 1

            num_cols = len(headers)
            if num_cols >= 2 and rows:
                col_entities = []
                for col_idx in range(num_cols):
                    col_header = headers[col_idx]
                    col_items = []
                    for r in rows:
                        if col_idx < len(r) and r[col_idx]:
                            cell_val = r[col_idx]
                            cell_val = re.sub(r"<br\s*/?>", " — ", cell_val, flags=re.IGNORECASE)
                            cell_val = re.sub(r"(?:[•\-\*]\s*){2,}", "• ", cell_val)
                            cell_val = re.sub(r"\s+", " ", cell_val).strip()
                            if cell_val:
                                col_items.append(cell_val)

                    entity_str = f"• **{col_header}:** " + " — ".join(col_items)
                    col_entities.append(entity_str)

                out_lines.append("\n".join(col_entities))
                continue
        else:
            out_lines.append(line)
            i += 1

    return "\n".join(out_lines)


def sanitize_text(text: str) -> str:
    """Cleans OCR artifacts, pipe separators, icon tags, and layout markers from document text."""
    if not text:
        return ""
    # 0. Structure markdown tables into coherent entity cards
    t = convert_markdown_tables_to_structured_text(text)
    # 1. Remove markdown images ![alt](url)
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", t)
    # 2. Convert markdown links [text](url) -> text
    t = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t)
    # 3. Remove OCR / visual icon markers & logo tags
    t = re.sub(r"\([^)]*(?:logo|icon|Octocat|Leaf icon)[^)]*\)", "", t, flags=re.IGNORECASE)
    t = re.sub(r"\[\s*(?:Logo|Icon|Image|Button|QR CODE IMAGE|Get Started|x|X|\s*)\s*\]", "", t, flags=re.IGNORECASE)
    # 4. Replace <br> tags with newline
    t = re.sub(r"<br\s*/?>", "\n", t, flags=re.IGNORECASE)
    # 5. Convert multiple consecutive pipes / separators (||||, |||, ||) into clean newlines
    t = re.sub(r"\|{2,}", "\n", t)
    # 6. Clean remaining table formatting artifacts
    t = re.sub(r"\|\s*:?-+:?\s*\|?", "", t)
    t = re.sub(r":?-{3,}:?", "", t)
    t = re.sub(r"^\s*\|\s*", "", t, flags=re.MULTILINE)
    t = re.sub(r"\s*\|\s*$", "", t, flags=re.MULTILINE)
    t = re.sub(r"\s*\|\s*", " — ", t)
    # 7. Split horizontal dividers and inline markdown headings into separate paragraphs (\n\n)
    t = re.sub(r"\s*(?:---|===|___)\s*", "\n\n", t)
    t = re.sub(r"(?<!\n)\n(?=#{1,4}\s+)", "\n\n", t)
    t = re.sub(r"(?<=\S)\s+(?=#{1,4}\s+)", "\n\n", t)
    # 8. Split inline bullet points into separate lines
    t = re.sub(r"\s+•\s+", "\n• ", t)
    # 9. Clean multiple bullet repetitions (e.g. • • •)
    t = re.sub(r"(?:[•\-\*]\s*){2,}", "• ", t)
    # 10. Clean dangling repeated asterisks or layout markers (preserve valid markdown bold **bold**)
    t = re.sub(r"\*{3,}", "", t)
    t = re.sub(r"(?<=\s)\*(?=\s)", "", t)
    return t.strip()


def format_evidence_snippet(raw_text: str, query: str = "", max_words: int = 20) -> str:
    """Converts raw chunk markdown into clean, polished evidence excerpts with bold key terms and bullet points matching target word depth."""
    if not raw_text or not raw_text.strip():
        return ""

    t_sanitized = sanitize_text(raw_text.strip())
    target_words = max(10, min(1000, max_words if max_words else 20))

    # Remove decorative separators, page indicators, and image tags
    t_clean = re.sub(r"^\s*[-=_~*]{3,}\s*$", "", t_sanitized, flags=re.MULTILINE)
    t_clean = re.sub(r"^#+\s*Page\s*\d+.*$", "", t_clean, flags=re.MULTILINE | re.IGNORECASE)
    t_clean = re.sub(r"\[\s*(?:Icon|Logo|Image|Button|Get Started|QR CODE IMAGE|x|X)\s*\]", "", t_clean, flags=re.IGNORECASE)

    raw_lines = [l.strip() for l in t_clean.split("\n") if l.strip()]
    if not raw_lines:
        return ""

    extracted_items: list[str] = []
    seen: set[str] = set()

    for l in raw_lines:
        if re.match(r"^\s*[-=_~*]{3,}\s*$", l) or l.lower().startswith("page "):
            continue

        # Headings
        if l.startswith("#"):
            h_text = re.sub(r"^#+\s*", "", l).strip()
            h_text = re.sub(r"[\*\_]", "", h_text).strip()
            if h_text and len(h_text) > 2 and h_text.lower() not in seen:
                seen.add(h_text.lower())
                extracted_items.append(f"### {h_text}")
                continue

        # Clean line of leading bullet symbols and numbering
        clean_l = re.sub(r"^[•\-\*\+\d\.\)\s]+", "", l).strip()
        clean_l = re.sub(r"[\#\`]", "", clean_l).strip()
        clean_l = re.sub(r"\s*•\s*", " — ", clean_l).strip()
        clean_l = re.sub(r"•\s*:", ":", clean_l)
        clean_l = re.sub(r":\s*•", ":", clean_l)
        clean_l = re.sub(r"\s*—\s*:\s*", ": ", clean_l)
        clean_l = re.sub(r"\s*:\s*—\s*", ": ", clean_l)

        if len(clean_l) < 2 or clean_l.lower() in seen:
            continue
        seen.add(clean_l.lower())

        # Key-Value colon pattern (e.g. "Price: ₹9,999")
        colon_idx = clean_l.find(":")
        if 2 < colon_idx < 40 and not clean_l.startswith("http"):
            k = clean_l[:colon_idx].strip().replace("*", "").replace("—", "").strip()
            v = clean_l[colon_idx + 1:].strip()
            extracted_items.append(f"• **{k}:** {v}")
            continue

        # General clean bullet point
        extracted_items.append(f"• {clean_l}")

    if not extracted_items:
        words = t_sanitized.split()[:target_words]
        return "• " + " ".join(words)

    # Intelligent Query Alignment: Identify best entry point for relevant content
    q_terms = [t.lower() for t in MultilingualTokenizer.extract_important_terms(query)] if query else []
    q_subwords = MultilingualTokenizer.extract_subword_ngrams(query) if query else []

    best_idx = 0
    best_score = -1

    if q_terms or q_subwords:
        line_scores = []
        for item in extracted_items:
            item_lower = item.lower()
            s = 0
            for qt in q_terms:
                if qt in item_lower:
                    s += 10
            for sw in q_subwords:
                if sw in item_lower:
                    s += 2
            line_scores.append(s)

        for i in range(len(extracted_items)):
            window_density = sum(line_scores[i:min(len(extracted_items), i + 4)])
            if window_density > best_score and window_density > 0:
                best_score = window_density
                start_candidate = i
                # Only backtrack 1 item if the immediately preceding line is a heading for this section
                if i > 0 and extracted_items[i - 1].startswith("###"):
                    start_candidate = i - 1
                best_idx = start_candidate

    # Accumulate items up to target_words starting from best_idx
    selected_items: list[str] = []
    accumulated_words = 0

    for i in range(best_idx, len(extracted_items)):
        item = extracted_items[i]
        item_words = len(item.split())
        if not selected_items or (accumulated_words + item_words <= target_words + 8):
            selected_items.append(item)
            accumulated_words += item_words
            if accumulated_words >= target_words:
                break
        else:
            remaining = target_words - accumulated_words
            if remaining >= 4:
                words = item.split()[:remaining]
                selected_items.append(" ".join(words) + "...")
            break

    # If forward collection was shorter than target_words, backfill preceding items
    if accumulated_words < target_words and best_idx > 0:
        for i in range(best_idx - 1, -1, -1):
            item = extracted_items[i]
            item_words = len(item.split())
            if accumulated_words + item_words <= target_words + 8:
                selected_items.insert(0, item)
                accumulated_words += item_words
            else:
                break

    return "\n".join(selected_items)


class HierarchyChunker:
    """Structure-aware semantic chunker with page and section cohesion."""

    _CURRENCY_PATTERN = re.compile(
        r"[\$\u00A2-\u00A5\u058F\u060B\u09F2\u09F3\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20CF\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]"
        r"|\b\d+(?:[\.,]\d+)?\s*/\s*\w+\b"
    )

    @classmethod
    def classify_pattern(cls, text: str) -> str:
        t_strip = text.strip()
        has_currency = bool(cls._CURRENCY_PATTERN.search(text))
        if t_strip.startswith("#") or (len(t_strip.split("\n")[0]) < 60 and t_strip.split("\n")[0].isupper() and not has_currency):
            return DocumentPattern.HEADING.value
        if "|" in text and ("---" in text or len(text.split("|")) > 3):
            return DocumentPattern.PRICING_TABLE.value if has_currency else DocumentPattern.MARKDOWN_TABLE.value
        if has_currency and ("\n•" in text or "\n-" in text or "\n*" in text or ":" in text):
            return DocumentPattern.PRICING_TABLE.value
        if "\n•" in text or "\n-" in text or "\n*" in text:
            return DocumentPattern.BULLET_LIST.value
        if ":" in text and len(text.split("\n")) <= 5:
            return DocumentPattern.KEY_VALUE.value
        return DocumentPattern.PARAGRAPH.value

    @classmethod
    def create_chunks(
        cls,
        text: str,
        max_chunk_words: int = 160,
        overlap_words: int = 40
    ) -> list[dict[str, Any]]:
        if not text or not text.strip():
            return []

        clean_text = sanitize_text(text)
        page_pattern = r"(?:##\s*Page\s*(\d+)|---+\s*Page\s*(\d+)\s*---+)"
        page_splits = re.split(page_pattern, clean_text, flags=re.IGNORECASE)

        chunks: list[dict[str, Any]] = []
        chunk_idx = 0

        if len(page_splits) > 1:
            current_page_num = 1
            i = 0
            while i < len(page_splits):
                segment = page_splits[i]
                if segment is None:
                    i += 1
                    continue
                if segment.isdigit():
                    current_page_num = int(segment)
                    i += 1
                    continue

                seg_text = segment.strip()
                if seg_text:
                    sub_chunks = cls._chunk_single_section(seg_text, current_page_num, chunk_idx, max_chunk_words, overlap_words)
                    for sc in sub_chunks:
                        chunks.append(sc)
                        chunk_idx += 1
                i += 1
        else:
            sub_chunks = cls._chunk_single_section(clean_text, 1, 0, max_chunk_words, overlap_words)
            chunks.extend(sub_chunks)

        if not chunks:
            raw_w = clean_text.split()
            chunks.append({
                "chunk_index": 0,
                "title": "Document Overview",
                "page_number": 1,
                "text": clean_text,
                "word_count": len(raw_w),
                "pattern_type": DocumentPattern.PARAGRAPH.value,
                "snippet": format_evidence_snippet(clean_text, max_words=20)
            })

        return chunks

    @classmethod
    def _chunk_single_section(
        cls,
        text: str,
        page_num: int,
        start_idx: int,
        max_words: int,
        overlap_words: int
    ) -> list[dict[str, Any]]:
        chunks = []
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        if not paragraphs:
            paragraphs = [text.strip()]

        current_paras: list[str] = []
        current_word_count = 0
        current_title = f"Page {page_num} Section"

        def flush_chunk(paras_to_flush: list[str]):
            if not paras_to_flush:
                return
            c_text = "\n\n".join(paras_to_flush).strip()
            if not c_text:
                return
            c_pattern = cls.classify_pattern(c_text)
            c_words = len(c_text.split())
            chunks.append({
                "chunk_index": start_idx + len(chunks),
                "title": f"Section #{start_idx + len(chunks) + 1} • {current_title[:35]}",
                "page_number": page_num,
                "text": c_text,
                "word_count": c_words,
                "pattern_type": c_pattern,
                "snippet": format_evidence_snippet(c_text, max_words=20)
            })

        for p in paragraphs:
            is_major_heading = bool(re.match(r"^#{1,2}\s+\S+", p))
            if is_major_heading and current_paras and current_word_count >= 20:
                flush_chunk(current_paras)
                current_paras = []
                current_word_count = 0

            if p.startswith("#"):
                h_match = re.match(r"^#+\s*(.+)", p)
                if h_match:
                    current_title = h_match.group(1).split("\n")[0].strip()

            p_words = p.split()
            # If paragraph itself exceeds max_words, chunk its words directly
            if len(p_words) > max_words:
                if current_paras:
                    flush_chunk(current_paras)
                    current_paras = []
                    current_word_count = 0

                w_idx = 0
                step = max(1, max_words - (overlap_words if 0 < overlap_words < max_words else 0))
                while w_idx < len(p_words):
                    take = p_words[w_idx:w_idx + max_words]
                    flush_chunk([" ".join(take)])
                    w_idx += step
                    if w_idx >= len(p_words) or len(take) < max_words:
                        break
                continue

            if current_word_count + len(p_words) > max_words and current_paras:
                flush_chunk(current_paras)
                if overlap_words > 0 and len(current_paras[-1].split()) <= overlap_words:
                    current_paras = [current_paras[-1], p]
                    current_word_count = len(current_paras[0].split()) + len(p_words)
                else:
                    current_paras = [p]
                    current_word_count = len(p_words)
            else:
                current_paras.append(p)
                current_word_count += len(p_words)

        if current_paras:
            flush_chunk(current_paras)

        return chunks

    @classmethod
    def create_overlapping_chunks(
        cls,
        text: str,
        max_chunk_words: int = 160,
        overlap_words: int = 40
    ) -> list[dict[str, Any]]:
        return cls.create_chunks(text, max_chunk_words=max_chunk_words, overlap_words=overlap_words)
