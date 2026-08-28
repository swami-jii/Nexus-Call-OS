"""
Knowledge Selector Module
Nexus Call OS v2.4 Enterprise

Selects relevant knowledge chunks from the RAG knowledge base for the current caller query.
Returns grounded, authoritative knowledge only — no hallucinations.
"""

from typing import Dict, Any, List, Optional


class KnowledgeChunk:
    def __init__(self, topic: str, content: str, relevance_score: float = 0.9):
        self.topic = topic
        self.content = content
        self.relevance_score = relevance_score


class KnowledgeSelector:
    """Retrieves grounded knowledge chunks from the Knowledge Base store."""

    def __init__(self, knowledge_store: Optional[List[KnowledgeChunk]] = None):
        self.knowledge_store: List[KnowledgeChunk] = knowledge_store or []

    def select_relevant_chunks(self, user_query: str, top_k: int = 3) -> Dict[str, Any]:
        query_lower = user_query.lower()
        scored: List[KnowledgeChunk] = []

        for chunk in self.knowledge_store:
            if any(word in chunk.content.lower() for word in query_lower.split()):
                scored.append(chunk)

        scored = sorted(scored, key=lambda c: c.relevance_score, reverse=True)[:top_k]

        return {
            "query": user_query,
            "retrieved_chunks": [{"topic": c.topic, "content": c.content, "score": c.relevance_score} for c in scored],
            "grounded": len(scored) > 0,
        }
