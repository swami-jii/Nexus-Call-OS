import pytest
from backend.routers.knowledge_base import (
    RAGPipelineEngine,
    NLPContextEngine,
    DocumentPatternAnalyzer,
    SemanticTextChunker,
    VectorEmbeddingIndex,
)

SAMPLE_DOC = """# Technical Support & Pricing Documentation

## Subscription Plans
Starter Tier : $19/mo - Basic access, standard speed.
Pro Tier : $49/mo - Priority queue, advanced AI models, API access.
Enterprise Tier : $199/mo - Dedicated server, custom integration, 24/7 phone support.

## Troubleshooting Guide
1. Restart the background agent service.
2. Verify network configuration settings in admin panel.
3. Refresh web application session tokens.
"""

def test_nlp_token_analysis():
    res = NLPContextEngine.analyze_query("How much does the Pro Tier cost?")
    assert "cost" in res["tokens"] or "tier" in res["tokens"]
    assert res["token_count"] > 0

def test_pattern_recognition():
    lines = [l.strip() for l in SAMPLE_DOC.split("\n\n") if l.strip()]
    assert DocumentPatternAnalyzer.classify_chunk_pattern(lines[0]) == "heading"

def test_semantic_overlapping_chunker():
    text = "Word " * 200
    chunks = SemanticTextChunker.create_overlapping_chunks(text, max_chunk_words=50, overlap_words=10)
    assert len(chunks) > 1
    assert chunks[0]["word_count"] == 50
    assert "chunk_index" in chunks[0]

def test_vector_embedding_cosine_search():
    chunks = SemanticTextChunker.create_overlapping_chunks(SAMPLE_DOC)
    vector_index = VectorEmbeddingIndex(chunks)
    results = vector_index.search("How much does Pro Tier cost?", top_k=2)
    assert len(results) > 0
    assert results[0]["score"] > 0.0
    assert "Pro Tier" in results[0]["fullChunk"] or "Pricing" in results[0]["fullChunk"]

def test_rag_pipeline_query(monkeypatch):
    from backend.routers.knowledge_base import DynamicLLMInvoker
    monkeypatch.setattr(
        DynamicLLMInvoker,
        "resolve_selected_llm_config",
        lambda *args, **kwargs: {"provider": "google", "api_key": "test_key", "model": "gemini-2.0-flash", "source": "test"}
    )
    monkeypatch.setattr(
        DynamicLLMInvoker,
        "call_llm",
        lambda *args, **kwargs: "The Pro Tier costs $49/mo."
    )
    res = RAGPipelineEngine.process_query("What is the price of Pro Tier?", SAMPLE_DOC, "support.pdf")
    assert res["query"] == "What is the price of Pro Tier?"
    assert res["query_info"]["token_count"] > 0
    assert len(res["matches"]) > 0
    assert "49" in res["direct_answer"] or "Pro Tier" in res["direct_answer"]
    assert "GOOGLE" in res["provider_used"]
    assert res["latency_ms"] < 15000.0


def test_large_document_no_memory_error():
    # Simulate a document with thousands of unique tokens
    large_doc = " ".join([f"word_{i} token_{i} data_{i}" for i in range(10000)])
    res = RAGPipelineEngine.process_query("word_500", large_doc, "large_test.txt")
    assert len(res["matches"]) > 0
    assert res["latency_ms"] < 15000.0


