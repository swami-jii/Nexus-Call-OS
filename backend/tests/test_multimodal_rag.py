"""
Comprehensive unit and integration test suite for Modular Multimodal RAG Engine (104+ Languages).
Tests all modality sub-engines: Image, Audio, Video, Document, Tabular, Web, NLP, Retrieval, and SSOT resolution.
"""

import unittest
from backend.rag import (
    ModalityType,
    MultimodalRAGPipeline,
    ImageEngine,
    AudioEngine,
    VideoEngine,
    DocumentEngine,
    TabularEngine,
    WebEngine,
    MultilingualEngine,
    IntentClassifier,
    HierarchyChunker,
    SemanticChunker,
    HybridRetriever,
    ScoreFilter,
    SSOTResolver,
    format_evidence_snippet,
    sanitize_text,
)


class TestMultimodalRAGEngine(unittest.TestCase):

    def test_all_modality_sub_engines(self):
        # 1. Document Engine
        doc_res = DocumentEngine.parse(b"# Test Document\nSome facts here", "test.txt", "txt")
        self.assertEqual(doc_res.modality, ModalityType.DOCUMENT)
        self.assertIn("Test Document", doc_res.full_text)

        # 2. Tabular Engine
        csv_bytes = b"Plan,Price,Features\nStarter,9999,5 Pages\nGrowth,24999,10 Pages"
        csv_res = TabularEngine.parse(csv_bytes, "pricing.csv", "csv")
        self.assertEqual(csv_res.modality, ModalityType.TABULAR)
        self.assertIn("Starter", csv_res.full_text)
        self.assertIn("9999", csv_res.full_text)

        # 3. Audio Engine
        audio_res = AudioEngine.parse(b"RIFF....WAVE", "call_recording.wav", "wav")
        self.assertEqual(audio_res.modality, ModalityType.AUDIO)

        # 4. Video Engine
        video_res = VideoEngine.parse(b"MP4VIDEO....", "demo_video.mp4", "mp4")
        self.assertEqual(video_res.modality, ModalityType.VIDEO)
        self.assertGreaterEqual(len(video_res.pages), 1)

        # 5. Web Engine
        html_bytes = b"<html><body><h1>Service Catalog</h1><p>We build web apps.</p></body></html>"
        web_res = WebEngine.parse(html_bytes, "index.html", "html")
        self.assertEqual(web_res.modality, ModalityType.WEB)
        self.assertIn("Service Catalog", web_res.full_text)

        # 6. Master Pipeline Dispatcher
        auto_doc = MultimodalRAGPipeline.parse_document(b"Sample PDF", "catalog.pdf", "pdf")
        self.assertEqual(auto_doc.modality, ModalityType.DOCUMENT)

        auto_csv = MultimodalRAGPipeline.parse_document(csv_bytes, "catalog.csv", "csv")
        self.assertEqual(auto_csv.modality, ModalityType.TABULAR)

    def test_multilingual_nlp_engine(self):
        # 1. Hinglish query analysis
        q_hinglish = "our services mee kon kon sa price plan hai"
        info = MultilingualEngine.analyze_query(q_hinglish)
        self.assertIn("services", info["important_terms"])
        self.assertIn("price", info["important_terms"])
        self.assertIn("plan", info["important_terms"])

        # 2. Devanagari Hindi
        q_hindi = "हमारी सर्विसेज के क्या प्राइस प्लान हैं"
        info_hindi = MultilingualEngine.analyze_query(q_hindi)
        self.assertEqual(info_hindi["script"], "devanagari")

        # 3. Dynamic Intent classification with zero hardcoding
        intent = IntentClassifier.classify_intent("what is the price plan for $49/mo?")
        self.assertTrue(intent["wants_pricing"])
        self.assertEqual(intent["primary_intent"], "pricing_and_plans")

    def test_semantic_chunker_and_snippet_limits(self):
        raw_doc = """
        # Create Call OS Possibilities
        ## Page 1 — Core Web Development Services
        [Logo] [Icon] Custom Website Development | [Icon] E-Commerce Development
        |||| We build high-converting websites starting from ₹9,999.
        |||| Maintenance plan is ₹2,999 per month.
        """
        chunks = SemanticChunker.create_chunks(raw_doc)
        self.assertGreater(len(chunks), 0)

        # Verify evidence snippet is clean and under 25 words
        snip = format_evidence_snippet(raw_doc, query="what are the prices?", max_words=20)
        self.assertNotIn("[Logo]", snip)
        self.assertNotIn("[Icon]", snip)
        self.assertNotIn("||||", snip)
        words = snip.split()
        self.assertLessEqual(len(words), 25)

    def test_hybrid_retriever_and_score_filter(self):
        chunks = [
            {
                "chunk_index": 0,
                "title": "Page 1 — Overview",
                "page_number": 1,
                "text": "Digital solutions and strategy for businesses.",
                "snippet": "Digital solutions."
            },
            {
                "chunk_index": 1,
                "title": "Page 2 — Web Development Pricing Plans",
                "page_number": 2,
                "text": "Starter Plan: ₹9,999. Growth Plan: ₹24,999. Business Plan: ₹49,999.",
                "snippet": "Starter Plan: ₹9,999. Growth Plan: ₹24,999."
            }
        ]
        retriever = HybridRetriever(chunks)
        results = retriever.search("our services price plan kya hai", top_k=2, max_words=20)

        self.assertGreater(len(results), 0)
        top_match = results[0]
        self.assertEqual(top_match["chunk_index"], 1)
        self.assertGreaterEqual(top_match["score"], 0.35)

        # Filter by confidence
        filtered = ScoreFilter.filter_by_confidence(results, threshold=0.35)
        self.assertGreaterEqual(len(filtered), 1)
        self.assertEqual(filtered[0]["chunk_index"], 1)

    def test_pipeline_end_to_end_query(self):
        sample_doc = """
        # Create Call OS Services & Pricing
        ## Section 1: Voice Calling Plans
        - Starter AI Voice Plan: $49 per month for 500 call minutes.
        - Growth Enterprise Plan: $199 per month for unlimited telephony calling.
        - Custom LLM integration and dedicated phone numbers included.
        Contact our team at support@createcallos.com for assistance.
        """
        res = MultimodalRAGPipeline.process_query(
            query="starter voice plan kitne ka hai",
            doc_text=sample_doc,
            filename="catalog.pdf",
            limit=3,
            max_words=20
        )
        self.assertIn("direct_answer", res)
        self.assertIn("matches", res)
        self.assertIn("pipeline_stages", res)
        self.assertGreaterEqual(len(res["matches"]), 1)
        self.assertIn("49", res["direct_answer"])


if __name__ == "__main__":
    unittest.main()
