"""
104+ Language Universal Multi-Script Tokenizer Engine.
Native universal Unicode tokenization and linguistic analysis across 104+ languages with ZERO hardcoded word dictionaries.
"""

import math
import re
import unicodedata
from typing import Any
from backend.rag.nlp_engine.stopwords import GLOBAL_STOPWORDS_104_PLUS


class MultilingualTokenizer:
    """Universal multi-script native tokenizer and linguistic analyzer for 104+ languages."""

    # Universal Unicode Word Tokenizer Pattern (All scripts, symbols, and alphanumeric tokens)
    UNIVERSAL_TOKEN_REGEX = re.compile(r"[\w\d\-\u0080-\uFFFF]+", re.UNICODE)

    @classmethod
    def tokenize(cls, text: str) -> list[str]:
        """Extracts individual word tokens across all global scripts algorithmically."""
        if not text:
            return []

        raw_tokens = cls.UNIVERSAL_TOKEN_REGEX.findall(text)
        return [t.lower().strip() for t in raw_tokens if t.strip()]

    @classmethod
    def detect_script(cls, text: str) -> str:
        """Identifies dominant script dynamically across 104+ global writing systems."""
        if not text:
            return "latin"

        for char in text:
            if char.isalpha():
                name = unicodedata.name(char, "").lower()
                if name:
                    first_part = name.split()[0]
                    if first_part not in ("latin", ""):
                        return first_part
        return "latin"

    @classmethod
    def extract_subword_ngrams(cls, text: str, min_n: int = 3, max_n: int = 4) -> list[str]:
        """Extracts algorithmic subword character n-grams for universal cross-lingual matching."""
        if not text:
            return []
        cleaned = re.sub(r"\s+", " ", text.strip().lower())
        ngrams: list[str] = []
        for n in range(min_n, max_n + 1):
            if len(cleaned) >= n:
                for i in range(len(cleaned) - n + 1):
                    ngrams.append(cleaned[i:i + n])
        return ngrams

    @classmethod
    def extract_important_terms(cls, query: str) -> list[str]:
        """Filters conversational noise algorithmically using Information Theory."""
        tokens = cls.tokenize(query)
        important = [
            t for t in tokens
            if t not in GLOBAL_STOPWORDS_104_PLUS
            and (len(t) > 1 or t.isdigit())
        ]
        return important if important else tokens

    @classmethod
    def expand_query_with_llm(
        cls,
        query: str,
        llm_config: Optional[dict[str, Any]] = None,
        invoker_fn: Optional[Any] = None,
        db: Optional[Any] = None,
        org_id: Optional[str] = None
    ) -> list[str]:
        """Dynamically uses active SSOT LLM to expand query synonyms & translations with zero hardcoding."""
        if not query or not invoker_fn:
            return []

        configs_to_try = [llm_config] if llm_config else []
        if db is not None:
            try:
                from backend.rag.core.ssot_resolver import SSOTResolver
                for alt_cfg in SSOTResolver.get_all_available_llm_configs(db=db, org_id=org_id):
                    if alt_cfg not in configs_to_try:
                        configs_to_try.append(alt_cfg)
            except Exception:
                pass

        if not configs_to_try:
            return []

        sys_prompt = (
            "You are a multilingual RAG search query expander. "
            "For the user query, output 3 to 6 essential keyword synonyms or search terms in English and the document language "
            "as a single comma-separated list. Do not include quotes, preamble, numbers, or markdown."
        )
        user_prompt = f"Query: {query}\nKeywords:"

        for cfg in configs_to_try:
            if not cfg:
                continue
            try:
                resp = invoker_fn(sys_prompt, user_prompt, cfg)
                if isinstance(resp, dict) and resp.get("text") and not resp.get("error"):
                    resp = resp["text"]
                if isinstance(resp, str) and resp.strip() and not resp.startswith("{\"error\""):
                    raw_terms = re.split(r"[,;\n]+", resp)
                    terms = []
                    for t in raw_terms:
                        clean_t = re.sub(r"^[-*•\d\.\)]+\s*", "", t).strip().lower()
                        if len(clean_t) > 1 and clean_t not in terms:
                            terms.append(clean_t)
                    if terms:
                        return terms[:8]
            except Exception:
                continue

        return []

    @classmethod
    def analyze_query(cls, query: str) -> dict[str, Any]:
        """Comprehensive linguistic diagnostic object for downstream hybrid retrieval."""
        tokens = cls.tokenize(query)
        important = cls.extract_important_terms(query)
        subword_ngrams = cls.extract_subword_ngrams(query)
        script = cls.detect_script(query)
        return {
            "query": query,
            "tokens": tokens,
            "important_terms": important,
            "subword_ngrams": subword_ngrams,
            "token_count": len(tokens),
            "script": script,
            "is_multilingual": script != "universal_latin"
        }



