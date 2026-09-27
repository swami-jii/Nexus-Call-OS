"""
Create Call OS — System Prompts & Voice Instructions for Grounded Telephony Calling AI.
Powered by GroundingSkill for zero-hardcode, multimodal, and cross-domain intelligence.
"""

from backend.rag.skills.grounding_skill import GroundingSkill

# Default zero-hardcode Telephony Voice System Prompt
TELEPHONY_VOICE_SYSTEM_PROMPT = GroundingSkill.build_system_prompt(modality="document")

__all__ = ["TELEPHONY_VOICE_SYSTEM_PROMPT"]
