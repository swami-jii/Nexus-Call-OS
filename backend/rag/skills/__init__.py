"""
Create Call OS — Universal Cognitive Skills & Intelligence Package.
Contains modular reasoning skills for Grounding, Query Extraction, Multimodal Processing, and Domain Adaptation.
"""

from backend.rag.skills.grounding_skill import GroundingSkill
from backend.rag.skills.query_extraction_skill import QueryExtractionSkill
from backend.rag.skills.multimodal_skill import MultimodalSkill
from backend.rag.skills.domain_intelligence_skill import DomainIntelligenceSkill

__all__ = [
    "GroundingSkill",
    "QueryExtractionSkill",
    "MultimodalSkill",
    "DomainIntelligenceSkill",
]
