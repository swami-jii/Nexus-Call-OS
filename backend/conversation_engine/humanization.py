"""
Humanization & Natural Speech Pacing Module
Applies speech pacing, SSML punctuation breaks, and acoustic naturalness.
"""

import re


class HumanizationEngine:
    """Applies speech rate modulation and SSML micro-pauses."""

    def __init__(self, speech_rate: float = 1.0, add_breathing_pauses: bool = True):
        self.speech_rate = speech_rate
        self.add_breathing_pauses = add_breathing_pauses

    def format_text_for_speech(self, raw_text: str) -> str:
        """Clean and enhance raw text with natural SSML micro-breaks."""
        text = raw_text.strip()
        if not text:
            return text

        if self.add_breathing_pauses:
            # Replace commas and sentence ends with micro SSML break tags if supported
            text = re.sub(r',\s*', ', <break time="150ms"/> ', text)
            text = re.sub(r'\.\s*', '. <break time="300ms"/> ', text)

        return text
