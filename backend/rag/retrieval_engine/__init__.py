"""
Retrieval Modality Sub-Engine.
Dual-level BM25 Lexical + Dense Semantic Vector retrieval with RRF rank fusion.
"""

from typing import Any, Optional
from backend.rag.retrieval_engine.bm25_lexical import BM25LexicalRetriever
from backend.rag.retrieval_engine.semantic_vector import SemanticVectorIndex
from backend.rag.retrieval_engine.rank_fusion import RankFusionEngine


class HybridRetriever:
    """Master Hybrid Retriever combining lexical keyword matching and semantic vector scoring."""

    def __init__(self, chunks: list[dict[str, Any]], embedding_config: Optional[dict[str, Any]] = None):
        self.chunks = chunks
        self.bm25 = BM25LexicalRetriever(chunks)
        self.vector_index = SemanticVectorIndex(chunks, embedding_config=embedding_config)

    def search(
        self,
        query: str,
        expanded_terms: Optional[list[str]] = None,
        top_k: int = 3,
        max_words: int = 20
    ) -> list[dict[str, Any]]:
        bm25_scores = self.bm25.score_chunks(query, expanded_terms=expanded_terms)
        vector_scores = self.vector_index.score_chunks(query, expanded_terms=expanded_terms)

        return RankFusionEngine.fuse_scores(
            chunks=self.chunks,
            bm25_scores=bm25_scores,
            vector_scores=vector_scores,
            top_k=top_k,
            max_words=max_words,
            query=query
        )



ScoreFilter = RankFusionEngine
VectorEmbeddingIndex = HybridRetriever

__all__ = [
    "HybridRetriever",
    "BM25LexicalRetriever",
    "SemanticVectorIndex",
    "RankFusionEngine",
    "ScoreFilter",
    "VectorEmbeddingIndex"
]
