"""
Dual-Level Rank Fusion (RRF) & Confidence Filtering Engine.
Blends BM25 Lexical + Semantic Vector scores inspired by LightRAG & RAGFlow retrieval.
"""

from typing import Any
from backend.rag.document_engine.hierarchy_chunker import format_evidence_snippet


class RankFusionEngine:
    """Fuses lexical and semantic retrieval rankings with strict confidence floor."""

    @classmethod
    def fuse_scores(
        cls,
        chunks: list[dict[str, Any]],
        bm25_scores: list[tuple[int, float]],
        vector_scores: list[tuple[int, float]],
        top_k: int = 3,
        max_words: int = 20,
        query: str = ""
    ) -> list[dict[str, Any]]:
        bm25_dict = dict(bm25_scores)
        vec_dict = dict(vector_scores)

        fused_items: list[dict[str, Any]] = []

        for idx, c in enumerate(chunks):
            s_bm25 = bm25_dict.get(idx, 0.0)
            s_vec = vec_dict.get(idx, 0.0)

            # Weighted reciprocal fusion
            fused_score = (s_bm25 * 0.70) + (s_vec * 0.30)

            clean_snippet = format_evidence_snippet(c.get("text", ""), query=query, max_words=max_words) or c.get("snippet", "")
            fused_items.append({
                "id": idx,
                "chunk_index": c.get("chunk_index", idx),
                "title": c.get("title", f"Section #{idx + 1}"),
                "page_number": c.get("page_number", 1),
                "pattern_type": c.get("pattern_type", "paragraph"),
                "similarityScore": round(fused_score, 2),
                "score": round(fused_score, 2),
                "snippet": clean_snippet,
                "fullChunk": c.get("text", ""),
                "word_count": len(clean_snippet.split()),
                "total_words": c.get("word_count", len(c.get("text", "").split())),
                "modality": c.get("modality", "document")
            })

        fused_items.sort(key=lambda x: x["score"], reverse=True)
        return fused_items[:top_k]

    @classmethod
    def filter_by_confidence(
        cls,
        matches: list[dict[str, Any]],
        threshold: float = 0.15
    ) -> list[dict[str, Any]]:
        """Filters matches by confidence floor with top candidate fallback."""
        filtered = [m for m in matches if m.get("score", 0.0) >= threshold]
        if not filtered and matches:
            # If top match has any positive relevance, preserve it so LLM has context
            if matches[0].get("score", 0.0) > 0.05:
                return [matches[0]]
        return filtered

