import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.rag import (
    MultimodalRAGPipeline,
    MultilingualEngine,
    HierarchyChunker,
    SemanticChunker,
    VectorEmbeddingIndex,
    VoiceSynthesizerEngine,
    DynamicLLMInvoker,
    SSOTResolver,
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

class TestRagPipelineUnit(unittest.TestCase):
    def setUp(self):
        self.orig_resolve = SSOTResolver.resolve_llm_or_vision_config
        self.orig_call = DynamicLLMInvoker.call_llm
        SSOTResolver.resolve_llm_or_vision_config = lambda *args, **kwargs: {"provider": "google", "api_key": "test_key", "model": "gemini-2.5-flash", "source": "test"}
        DynamicLLMInvoker.call_llm = lambda *args, **kwargs: "The Pro Tier costs $49/mo."

    def tearDown(self):
        SSOTResolver.resolve_llm_or_vision_config = self.orig_resolve
        DynamicLLMInvoker.call_llm = self.orig_call

    def test_nlp_token_analysis(self):
        res = MultilingualEngine.analyze_query("How much does the Pro Tier cost?")
        self.assertTrue("cost" in res["tokens"] or "tier" in res["tokens"])
        self.assertGreater(res["token_count"], 0)

    def test_pattern_recognition(self):
        lines = [l.strip() for l in SAMPLE_DOC.split("\n\n") if l.strip()]
        self.assertEqual(HierarchyChunker.classify_pattern(lines[0]), "heading")

    def test_semantic_overlapping_chunker(self):
        text = "Word " * 200
        chunks = SemanticChunker.create_chunks(text, max_chunk_words=50, overlap_words=10)
        self.assertGreater(len(chunks), 1)
        self.assertEqual(chunks[0]["word_count"], 50)
        self.assertIn("chunk_index", chunks[0])

    def test_vector_embedding_cosine_search(self):
        chunks = SemanticChunker.create_chunks(SAMPLE_DOC)
        vector_index = VectorEmbeddingIndex(chunks)
        results = vector_index.search("How much does Pro Tier cost?", top_k=2, max_words=60)
        self.assertGreater(len(results), 0)
        self.assertGreater(results[0]["score"], 0.0)
        self.assertTrue("Pro Tier" in results[0]["fullChunk"] or "Pricing" in results[0]["fullChunk"])
        self.assertIn("word_count", results[0])

    def test_rag_pipeline_query(self):
        res = MultimodalRAGPipeline.process_query("What is the price of Pro Tier?", SAMPLE_DOC, "support.pdf", max_words=60)
        self.assertEqual(res["query"], "What is the price of Pro Tier?")
        self.assertGreater(res["query_info"]["token_count"], 0)
        self.assertGreater(len(res["matches"]), 0)
        self.assertTrue("49" in res["direct_answer"] or "Pro Tier" in res["direct_answer"])
        self.assertTrue("GOOGLE" in res["provider_used"] or "GEMINI" in res["provider_used"])
        self.assertLess(res["latency_ms"], 15000.0)

    def test_large_document_no_memory_error(self):
        large_doc = " ".join([f"word_{i} token_{i} data_{i}" for i in range(10000)])
        res = MultimodalRAGPipeline.process_query("word_500", large_doc, "large_test.txt")
        self.assertGreater(len(res["matches"]), 0)
        self.assertLess(res["latency_ms"], 15000.0)

    def test_multiturn_session_memory_retention(self):
        session_id = "test_unit_session_mem_123"
        # Turn 1
        res1 = MultimodalRAGPipeline.process_query(
            "What subscription plans exist?",
            SAMPLE_DOC,
            "support.pdf",
            session_id=session_id
        )
        self.assertEqual(res1["session_id"], session_id)
        self.assertEqual(res1["turn_count"], 1)
        self.assertTrue(res1["memory_active"])

        # Turn 2: Follow-up
        res2 = MultimodalRAGPipeline.process_query(
            "What are the features of Starter Tier?",
            SAMPLE_DOC,
            "support.pdf",
            session_id=session_id
        )
        self.assertEqual(res2["session_id"], session_id)
        self.assertEqual(res2["turn_count"], 2)
        self.assertTrue(res2["memory_active"])

    def test_pricing_table_chunk_cohesion(self):
        table_doc = """## Page 1
# Services Overview

## Our Pricing Plans
| Starter Plan | Growth Plan |
| :--- | :--- |
| ₹9,999 | ₹24,999 |
| 5 Pages | 10 Pages |
"""
        chunks = HierarchyChunker.create_chunks(table_doc)
        pricing_chunk = next((c for c in chunks if "Our Pricing Plans" in c["title"] or "9,999" in c["text"]), None)
        self.assertIsNotNone(pricing_chunk)
        self.assertIn("9,999", pricing_chunk["text"])
        self.assertIn("Starter Plan", pricing_chunk["text"])


if __name__ == "__main__":
    unittest.main()
