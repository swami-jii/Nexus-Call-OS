"""
Synthesis Modality Sub-Engine.
Telephony AI Voice grounded answer generation with 104+ language dialect matching.
"""

from backend.rag.synthesis_engine.voice_synthesizer import VoiceSynthesizerEngine
from backend.rag.synthesis_engine.prompt_templates import TELEPHONY_VOICE_SYSTEM_PROMPT
from backend.rag.synthesis_engine.dynamic_llm import DynamicLLMInvoker

# Backward-compatibility alias
TelephonySynthesizer = VoiceSynthesizerEngine
GroundedLLMSynthesizer = VoiceSynthesizerEngine

__all__ = [
    "VoiceSynthesizerEngine",
    "TelephonySynthesizer",
    "GroundedLLMSynthesizer",
    "DynamicLLMInvoker",
    "TELEPHONY_VOICE_SYSTEM_PROMPT"
]
