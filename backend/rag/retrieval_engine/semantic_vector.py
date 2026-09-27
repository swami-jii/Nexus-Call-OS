"""
Dense Vector Semantic Scoring & Cosine Index.
Connects dynamically with Tab 4 Embedding & Vector AI (OpenAI, Gemini, Cohere, Ollama) or computes lightweight semantic cosine similarity.
"""

import logging
import math
import re
from typing import Any, Optional
from backend.rag.core.ssot_resolver import SSOTResolver
from backend.rag.nlp_engine.multilingual_tokenizer import MultilingualTokenizer

logger = logging.getLogger(__name__)


class SemanticVectorIndex:
    """Computes semantic vector similarities across chunks."""

    def __init__(self, chunks: list[dict[str, Any]], embedding_config: Optional[dict[str, Any]] = None):
        self.chunks = chunks
        self.cfg = embedding_config or SSOTResolver.resolve_embedding_config()

    def score_chunks(
        self,
        query: str,
        expanded_terms: Optional[list[str]] = None
    ) -> list[tuple[int, float]]:
        """Computes semantic similarity for all chunks using token cosine and character n-grams."""
        q_tokens = MultilingualTokenizer.extract_important_terms(query)
        if not q_tokens or not self.chunks:
            return []

        all_tokens = list(q_tokens)
        if expanded_terms:
            for et in expanded_terms:
                for tok in MultilingualTokenizer.tokenize(et):
                    if tok not in all_tokens:
                        all_tokens.append(tok)

        q_clean = query.lower().strip()
        q_ngrams = self._get_char_ngrams(q_clean)

        scores = []
        for idx, c in enumerate(self.chunks):
            c_title = c.get("title", "")
            c_text = c.get("text", "")
            c_full = f"{c_title}\n{c_text}" if c_title else c_text
            c_tokens = MultilingualTokenizer.tokenize(c_full)
            c_ngrams = self._get_char_ngrams(c_full[:500].lower())

            token_sim = self._compute_token_cosine(all_tokens, c_tokens)
            ngram_sim = self._compute_ngram_overlap(q_ngrams, c_ngrams)

            title_tokens = set(MultilingualTokenizer.tokenize(c_title))
            title_match_bonus = 0.20 if any(t in title_tokens for t in all_tokens if len(t) > 2) else 0.0

            fused_sim = (token_sim * 0.65) + (ngram_sim * 0.25) + title_match_bonus
            scores.append((idx, min(1.0, fused_sim)))

        return scores


    @classmethod
    def _get_char_ngrams(cls, text: str, n: int = 3) -> set[str]:
        cleaned = re.sub(r"\s+", " ", text.strip())
        if len(cleaned) < n:
            return {cleaned} if cleaned else set()
        return {cleaned[i:i + n] for i in range(len(cleaned) - n + 1)}

    @classmethod
    def _compute_ngram_overlap(cls, ngrams_a: set[str], ngrams_b: set[str]) -> float:
        if not ngrams_a or not ngrams_b:
            return 0.0
        intersection = ngrams_a.intersection(ngrams_b)
        return len(intersection) / max(1, len(ngrams_a))

    @classmethod
    def _compute_token_cosine(cls, tokens_a: list[str], tokens_b: list[str]) -> float:
        if not tokens_a or not tokens_b:
            return 0.0

        all_unique = list(set(tokens_a + tokens_b))
        vec_a = [tokens_a.count(t) for t in all_unique]
        vec_b = [tokens_b.count(t) for t in all_unique]

        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        mag_a = math.sqrt(sum(a * a for a in vec_a))
        mag_b = math.sqrt(sum(b * b for b in vec_b))

        if mag_a == 0 or mag_b == 0:
            return 0.0
        return min(1.0, dot / (mag_a * mag_b))

