"""
Confidence Manager Module
Nexus Call OS v2.4 Enterprise

Calculates confidence scores (0.0 – 1.0) for AI-generated responses.
Triggers clarification when confidence is below threshold — never hallucinate.
"""

from typing import Dict, Any


CONFIDENCE_THRESHOLD = 0.65


class ConfidenceManager:
    """Manages confidence scoring and anti-hallucination guardrails."""

    def calculate_confidence(
        self,
        faq_resolved: bool,
        knowledge_grounded: bool,
        intent_confidence: float,
    ) -> float:
        score = intent_confidence * 0.4

        if faq_resolved:
            score += 0.4
        if knowledge_grounded:
            score += 0.2

        return round(min(1.0, score), 2)

    def evaluate(
        self,
        faq_resolved: bool,
        knowledge_grounded: bool,
        intent_confidence: float,
    ) -> Dict[str, Any]:
        score = self.calculate_confidence(faq_resolved, knowledge_grounded, intent_confidence)
        should_clarify = score < CONFIDENCE_THRESHOLD

        return {
            "confidence_score": score,
            "should_clarify": should_clarify,
            "threshold": CONFIDENCE_THRESHOLD,
            "is_grounded": not should_clarify,
            "action": "ask_clarification" if should_clarify else "answer_now",
            "anti_hallucination_active": should_clarify,
        }
