"""
Objection Handler Module
Nexus Call OS v2.4 Enterprise

Resolves caller objections with empathy, reframing, and value-reinforcement responses.
Handles: Pricing, Trust, Timing, Feature, Competition, and Need objections.
"""

from enum import Enum
from typing import Dict, Any


class ObjectionType(str, Enum):
    PRICING = "pricing"
    TRUST = "trust"
    TIMING = "timing"
    FEATURE = "feature"
    COMPETITION = "competition"
    NEED = "need"
    UNKNOWN = "unknown"


OBJECTION_RESPONSES: Dict[ObjectionType, Dict[str, str]] = {
    ObjectionType.PRICING: {
        "empathy": "I completely understand your concern about the cost.",
        "reframe": "Our pricing reflects the quality and results you'll receive.",
        "offer": "We do have flexible payment options available.",
    },
    ObjectionType.TRUST: {
        "empathy": "That's a very valid concern and I'm glad you brought it up.",
        "reframe": "We have served thousands of satisfied customers across the country.",
        "offer": "I can share verified reviews and references if you'd like.",
    },
    ObjectionType.TIMING: {
        "empathy": "I understand this may not be the perfect time.",
        "reframe": "Many of our customers who waited faced higher costs later.",
        "offer": "We can schedule a tentative slot with no commitment required.",
    },
    ObjectionType.COMPETITION: {
        "empathy": "It makes sense to explore all your options.",
        "reframe": "What sets us apart is our track record and dedicated support.",
        "offer": "Would you like me to do a quick comparison for you?",
    },
    ObjectionType.NEED: {
        "empathy": "I hear you — this might not seem immediately relevant.",
        "reframe": "Let me quickly explain the key benefit that applies to your situation.",
        "offer": "It only takes a moment — would that be okay?",
    },
}


class ObjectionHandler:
    """Detects and resolves caller objections using a structured empathy-reframe-offer matrix."""

    def detect_objection_type(self, text_input: str) -> ObjectionType:
        txt = text_input.lower()
        if any(w in txt for w in ["expensive", "costly", "price", "too much", "afford"]):
            return ObjectionType.PRICING
        if any(w in txt for w in ["trust", "safe", "scam", "legit", "fake"]):
            return ObjectionType.TRUST
        if any(w in txt for w in ["later", "next week", "busy", "not now", "wait"]):
            return ObjectionType.TIMING
        if any(w in txt for w in ["competitor", "other company", "better option", "elsewhere"]):
            return ObjectionType.COMPETITION
        if any(w in txt for w in ["don't need", "not interested", "unnecessary"]):
            return ObjectionType.NEED
        return ObjectionType.UNKNOWN

    def handle_objection(self, objection_type: ObjectionType) -> Dict[str, Any]:
        response = OBJECTION_RESPONSES.get(objection_type)
        if not response:
            return {
                "objection": objection_type.value,
                "empathy": "I understand your hesitation.",
                "reframe": "Let me help clarify this for you.",
                "offer": "May I answer any specific questions?",
            }
        return {
            "objection": objection_type.value,
            **response,
        }
