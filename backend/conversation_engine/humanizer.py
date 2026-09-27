"""
Speech Humanizer & Acoustic SSML Engine (104+ Languages)
Create Call OS v2.4 Enterprise

Applies acoustic humanization, dynamic SSML breath pauses, conversational fillers,
and prosody modulation to AI responses for hyper-realistic telephony dialogue.
"""

import re
from typing import Optional


class SpeechHumanizer:
    """Applies acoustic humanization, conversational fillers, and SSML micro-breaks to AI telephony text."""

    # Dynamic Multilingual Conversational Fillers / Acknowledgments
    LANGUAGE_FILLERS = {
        "hi-IN": ["जी बिल्कुल, ", "हाँ समझ गया, ", "अच्छा, "],
        "es-ES": ["Entendido, ", "Claro, ", "Muy bien, "],
        "fr-FR": ["Bien sûr, ", "D'accord, ", "Très bien, "],
        "de-DE": ["Verstanden, ", "Natürlich, ", "Alles klar, "],
        "ar-SA": ["نعم بالتأكيد، ", "فهمت عليك، ", "حسناً، "],
        "ja-JP": ["かしこまりました、", "承知いたしました、", "はい、"],
        "ru-RU": ["Понятно, ", "Конечно, ", "Хорошо, "],
        "pt-PT": ["Entendido, ", "Com certeza, ", "Muito bem, "],
        "it-IT": ["Certamente, ", "Capisco, ", "Va bene, "],
        "zh-CN": ["明白了，", "好的，", "没问题，"],
        "en-US": ["I understand, ", "Certainly, ", "Got it, ", "Sure, "],
    }

    def __init__(self, add_micro_pauses: bool = True, default_style: str = "balanced"):
        self.add_micro_pauses = add_micro_pauses
        self.default_style = default_style

    def get_contextual_filler(self, language: str = "en-US") -> str:
        """Selects a natural acknowledgment filler matching the caller's language."""
        lang_prefix = language[:2].lower()
        for key, fillers in self.LANGUAGE_FILLERS.items():
            if key.startswith(lang_prefix) or key == language:
                return fillers[0]
        return ""

    def humanize_text(
        self,
        text: str,
        style: str = "balanced",
        speech_speed: float = 1.0,
        inject_filler: bool = False,
        language: str = "en-US",
    ) -> str:
        """Transforms plain text into natural acoustic speech with SSML and micro-pauses."""
        clean = text.strip()
        if not clean:
            return clean

        # 0. Clean redundant punctuation
        clean = re.sub(r"\s+", " ", clean)

        # 1. Optionally inject natural conversational filler at beginning
        if inject_filler:
            filler = self.get_contextual_filler(language)
            if filler and not clean.lower().startswith(filler.lower().strip()):
                clean = f"{filler}{clean}"

        # 2. Micro-pause injection based on punctuation
        if self.add_micro_pauses:
            if style == "expressive":
                clean = re.sub(r',\s*', ', <break time="180ms"/> ', clean)
                clean = re.sub(r'([.!?])\s+', r'\1 <break time="320ms"/> ', clean)
                clean = re.sub(r':\s*', ': <break time="200ms"/> ', clean)
            elif style == "casual":
                clean = re.sub(r',\s*', ', <break time="120ms"/> ', clean)
                clean = re.sub(r'([.!?])\s+', r'\1 <break time="200ms"/> ', clean)
            else:  # balanced
                clean = re.sub(r',\s*', ', <break time="150ms"/> ', clean)
                clean = re.sub(r'([.!?])\s+', r'\1 <break time="260ms"/> ', clean)
                clean = re.sub(r':\s*', ': <break time="180ms"/> ', clean)

        # 3. Rate & Prosody modulation if speed deviates from 1.0
        if abs(speech_speed - 1.0) > 0.03:
            rate_pct = int(speech_speed * 100)
            clean = f'<prosody rate="{rate_pct}%">{clean}</prosody>'

        return clean.strip()
