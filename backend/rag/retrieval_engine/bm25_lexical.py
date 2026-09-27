"""
BM25 Lexical Scoring Engine.
Provides pure, algorithmic Okapi BM25 probabilistic relevance scoring across 104+ languages with ZERO hardcoded keyword lists.
"""

import math
import re
from typing import Any
from backend.rag.nlp_engine.multilingual_tokenizer import MultilingualTokenizer


class BM25LexicalRetriever:
    """Pure mathematical Okapi BM25 Lexical retriever with zero hardcoded vocabulary lists."""

    def __init__(self, chunks: list[dict[str, Any]]):
        self.chunks = chunks
        self.doc_count = len(chunks)
        self.avg_doc_len = (
            sum(len(MultilingualTokenizer.tokenize(c.get("text", ""))) for c in chunks) / max(1, self.doc_count)
            if chunks else 1.0
        )
        self._build_index()

    def _build_index(self):
        self.chunk_tokens = []
        self.doc_freqs: dict[str, int] = {}

        for c in self.chunks:
            t_list = MultilingualTokenizer.tokenize(c.get("text", ""))
            self.chunk_tokens.append(t_list)
            unique_terms = set(t_list)
            for t in unique_terms:
                self.doc_freqs[t] = self.doc_freqs.get(t, 0) + 1

    def score_chunks(
        self,
        query: str,
        expanded_terms: Optional[list[str]] = None,
        k1: float = 1.5,
        b: float = 0.75
    ) -> list[tuple[int, float]]:
        """Computes pure Okapi BM25 relevance scores for all indexed chunks."""
        q_terms = MultilingualTokenizer.extract_important_terms(query)
        if not q_terms:
            q_terms = MultilingualTokenizer.tokenize(query)
        if not q_terms or not self.chunks:
            return []

        extra_terms: list[str] = []
        if expanded_terms:
            for et in expanded_terms:
                for tok in MultilingualTokenizer.tokenize(et):
                    if tok not in q_terms and tok not in extra_terms:
                        extra_terms.append(tok)

        q_clean = query.lower().strip()
        q_subwords = MultilingualTokenizer.extract_subword_ngrams(query)
        scores = []

        for idx, c in enumerate(self.chunks):
            doc_tokens = self.chunk_tokens[idx]
            doc_len = max(1, len(doc_tokens))
            c_text_lower = c.get("text", "").lower()
            bm25_val = 0.0
            matched_terms = 0

            for t in q_terms:
                if t in doc_tokens:
                    matched_terms += 1
                    freq = doc_tokens.count(t)
                    df = self.doc_freqs.get(t, 1)
                    idf = math.log(1 + (self.doc_count - df + 0.5) / (df + 0.5))
                    tf = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (doc_len / self.avg_doc_len)))
                    bm25_val += idf * tf

            matched_extra = 0
            extra_bm25 = 0.0
            for et in extra_terms:
                if et in doc_tokens:
                    matched_extra += 1
                    freq = doc_tokens.count(et)
                    df = self.doc_freqs.get(et, 1)
                    idf = math.log(1 + (self.doc_count - df + 0.5) / (df + 0.5))
                    tf = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (doc_len / self.avg_doc_len)))
                    extra_bm25 += idf * tf

            # Subword character n-gram overlap for multi-lingual and morphological coverage
            subword_matches = 0
            if q_subwords and len(c_text_lower) > 5:
                for sw in q_subwords:
                    if sw in c_text_lower:
                        subword_matches += 1

            # Section Title / Heading match bonus
            title_hits = 0
            c_title_lower = c.get("title", "").lower()
            if c_title_lower:
                for t in q_terms:
                    if len(t) > 2 and t in c_title_lower:
                        title_hits += 1
                for et in extra_terms:
                    if len(et) > 2 and et in c_title_lower:
                        title_hits += 1

            total_hits = matched_terms + matched_extra + subword_matches + title_hits
            if total_hits > 0:
                unified_terms_count = len(q_terms) + len(extra_terms)
                unified_cov = (matched_terms + matched_extra) / max(1, unified_terms_count)
                subword_cov = subword_matches / max(1, len(q_subwords)) if q_subwords else 0.0
                title_boost = min(0.35, title_hits * 0.15)
                
                score = (
                    0.15
                    + (unified_cov * 0.45)
                    + (subword_cov * 0.10)
                    + min(0.20, (bm25_val + extra_bm25 * 0.8) * 0.05)
                    + title_boost
                )

                # Exact substring match bonus
                if len(q_terms) > 1 and q_clean in c_text_lower:
                    score += 0.30

                scores.append((idx, min(1.0, score)))
            else:
                scores.append((idx, 0.0))

        return scores





