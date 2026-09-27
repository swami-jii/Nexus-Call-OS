"""
Core RAG Subsystem.
Orchestration pipeline and central SSOT dynamic credential resolver.
"""

from backend.rag.core.ssot_resolver import SSOTResolver
from backend.rag.core.pipeline import MultimodalRAGPipeline

__all__ = ["SSOTResolver", "MultimodalRAGPipeline"]
