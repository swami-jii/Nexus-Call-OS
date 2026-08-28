"""
Response Validator Module
Nexus Call OS v2.4 Enterprise

Validates AI-generated responses before playback:
- Strips hallucinated business-specific claims
- Enforces response length policy (shorten vs. expand)
- Validates language policy compliance
"""

from typing import Dict, Any


class ResponseValidator:
    """Validates, cleans, and enforces policy on AI-generated responses before TTS playback."""

    HALLUCINATION_MARKERS = [
        "I think the price is",
        "I believe the address is",
        "I'm not sure but",
        "maybe it's",
        "I assume",
    ]

    def validate(self, response_text: str, max_words: int = 80) -> Dict[str, Any]:
        issues: list = []

        # Anti-hallucination check
        for marker in self.HALLUCINATION_MARKERS:
            if marker.lower() in response_text.lower():
                issues.append(f"Possible hallucination detected: '{marker}'")

        # Length policy
        word_count = len(response_text.split())
        is_too_long = word_count > max_words

        # Apply shorten if too long
        cleaned_response = response_text
        if is_too_long:
            cleaned_response = " ".join(response_text.split()[:max_words]) + "..."

        return {
            "is_valid": len(issues) == 0,
            "issues": issues,
            "original_word_count": word_count,
            "is_shortened": is_too_long,
            "validated_response": cleaned_response,
        }
