"""
Create Call OS — Modular Multimodal RAG Package.
Production-grade RAG Architecture supporting 104+ Languages, Universal Data Formats,
and Dynamic Tab 1-4 Database SSOT Model Resolution.
"""

from backend.rag.types import (
    DocumentPattern,
    ModalityType,
    ParsedDocument,
    ParsedPage,
    RetrievalMatch,
    RAGPipelineResult,
)
from backend.rag.core.ssot_resolver import SSOTResolver
from backend.rag.core.pipeline import MultimodalRAGPipeline
from backend.rag.skills import (
    GroundingSkill,
    QueryExtractionSkill,
    MultimodalSkill,
    DomainIntelligenceSkill,
)
from backend.rag.image_engine import ImageEngine
from backend.rag.audio_engine import AudioEngine
from backend.rag.video_engine import VideoEngine
from backend.rag.document_engine import (
    DocumentEngine,
    HierarchyChunker,
    format_evidence_snippet,
    sanitize_text,
)
from backend.rag.tabular_engine import TabularEngine, TabularRowChunker
from backend.rag.web_engine import WebEngine
from backend.rag.nlp_engine import (
    GLOBAL_STOPWORDS_104_PLUS,
    IntentClassifier,
    MultilingualEngine,
    MultilingualTokenizer,
    NLPContextEngine,
)
from backend.rag.retrieval_engine import (
    BM25LexicalRetriever,
    HybridRetriever,
    RankFusionEngine,
    ScoreFilter,
    SemanticVectorIndex,
    VectorEmbeddingIndex,
)
from backend.rag.synthesis_engine import (
    DynamicLLMInvoker,
    GroundedLLMSynthesizer,
    TELEPHONY_VOICE_SYSTEM_PROMPT,
    TelephonySynthesizer,
    VoiceSynthesizerEngine,
)

# Backward-compatibility alias
SemanticChunker = HierarchyChunker
SemanticTextChunker = HierarchyChunker

__all__ = [
    # Data Models & Enums
    "ModalityType",
    "DocumentPattern",
    "ParsedDocument",
    "ParsedPage",
    "RetrievalMatch",
    "RAGPipelineResult",

    # Core & SSOT
    "SSOTResolver",
    "MultimodalRAGPipeline",

    # Cognitive Skills
    "GroundingSkill",
    "QueryExtractionSkill",
    "MultimodalSkill",
    "DomainIntelligenceSkill",

    # Modality Sub-Engines
    "ImageEngine",
    "AudioEngine",
    "VideoEngine",
    "DocumentEngine",
    "TabularEngine",
    "WebEngine",

    # NLP Sub-Engine
    "MultilingualTokenizer",
    "MultilingualEngine",
    "NLPContextEngine",
    "GLOBAL_STOPWORDS_104_PLUS",
    "IntentClassifier",

    # Chunking & Formatting
    "HierarchyChunker",
    "SemanticChunker",
    "SemanticTextChunker",
    "TabularRowChunker",
    "sanitize_text",
    "format_evidence_snippet",

    # Retrieval Sub-Engine
    "HybridRetriever",
    "BM25LexicalRetriever",
    "SemanticVectorIndex",
    "RankFusionEngine",
    "ScoreFilter",
    "VectorEmbeddingIndex",

    # Synthesis Sub-Engine
    "VoiceSynthesizerEngine",
    "TelephonySynthesizer",
    "GroundedLLMSynthesizer",
    "DynamicLLMInvoker",
    "TELEPHONY_VOICE_SYSTEM_PROMPT",
]
