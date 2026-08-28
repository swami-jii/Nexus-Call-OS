"""
Humanizer Module
Nexus Call OS v2.4 Enterprise

Applies SSML micro-pauses, natural speech pacing, and acoustic naturalness to AI text.
"""

import re


class SpeechHumanizer:
    """Applies acoustic humanization and SSML micro-breaks to generated responses."""

    def __init__(self, add_micro_pauses: bool = True):
        self.add_micro_pauses = add_micro_pauses

    def humanize_text(self, text: str) -> str:
        clean = text.strip()
        if not clean:
            return clean

        if self.add_micro_pauses:
            # Add SSML breaks for natural speech rhythm
            clean = re.sub(r',\s*', ', <break time="150ms"/> ', clean)
            clean = re.sub(r'\.\s*', '. <break time="250ms"/> ', clean)

        return clean
