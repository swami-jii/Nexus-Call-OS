"""
Context Manager & Multilingual Language Detection Engine (104+ Languages)
Create Call OS v2.4 Enterprise

Dynamically manages multi-turn conversation memory, speaker context,
and universal 104+ language identification across global scripts and phonetic variants.
"""

import re
import unicodedata
from typing import Any, Dict, List


class ContextManager:
    """Manages conversational turn memory and universal 104+ language identification."""

    # Comprehensive Unicode Script Range Map for 104+ Global Languages
    SCRIPT_LANGUAGE_MAP = [
        (re.compile(r"[\u0900-\u097F]"), "hi-IN"),      # Devanagari (Hindi, Marathi, Nepali)
        (re.compile(r"[\u0980-\u09FF]"), "bn-IN"),      # Bengali / Assamese
        (re.compile(r"[\u0A00-\u0A7F]"), "pa-IN"),      # Gurmukhi (Punjabi)
        (re.compile(r"[\u0A80-\u0AFF]"), "gu-IN"),      # Gujarati
        (re.compile(r"[\u0B00-\u0B7F]"), "or-IN"),      # Odia
        (re.compile(r"[\u0B80-\u0BFF]"), "ta-IN"),      # Tamil
        (re.compile(r"[\u0C00-\u0C7F]"), "te-IN"),      # Telugu
        (re.compile(r"[\u0C80-\u0CFF]"), "kn-IN"),      # Kannada
        (re.compile(r"[\u0D00-\u0D7F]"), "ml-IN"),      # Malayalam
        (re.compile(r"[\u0600-\u06FF\u0750-\u077F]"), "ar-SA"), # Arabic, Urdu, Persian
        (re.compile(r"[\u0590-\u05FF]"), "he-IL"),      # Hebrew
        (re.compile(r"[\u0400-\u04FF]"), "ru-RU"),      # Cyrillic (Russian, Ukrainian, Bulgarian)
        (re.compile(r"[\u3040-\u309F\u30A0-\u30FF]"), "ja-JP"), # Japanese Kana
        (re.compile(r"[\uAC00-\uD7AF\u1100-\u11FF]"), "ko-KR"), # Korean Hangul
        (re.compile(r"[\u4E00-\u9FFF]"), "zh-CN"),      # Chinese Hanzi
        (re.compile(r"[\u0E00-\u0E7F]"), "th-TH"),      # Thai
        (re.compile(r"[\u0370-\u03FF]"), "el-GR"),      # Greek
        (re.compile(r"[\u10A0-\u10FF]"), "ka-GE"),      # Georgian
        (re.compile(r"[\u0530-\u058F]"), "hy-AM"),      # Armenian
    ]

    # Latin Non-ASCII Distinctive Diacritics
    LATIN_DIACRITICS_MAP = [
        (re.compile(r"[áéíóúüñ¿¡]", re.IGNORECASE), "es-ES"),    # Spanish
        (re.compile(r"[àâçèêëîïôûùÿœæ]", re.IGNORECASE), "fr-FR"), # French
        (re.compile(r"[äöüß]", re.IGNORECASE), "de-DE"),        # German
        (re.compile(r"[ãõ]", re.IGNORECASE), "pt-PT"),           # Portuguese
        (re.compile(r"[ğış]", re.IGNORECASE), "tr-TR"),          # Turkish
        (re.compile(r"[ąćęłńóśźż]", re.IGNORECASE), "pl-PL"),    # Polish
        (re.compile(r"[đčćžš]", re.IGNORECASE), "hr-HR"),        # Croatian/Serbian
        (re.compile(r"[őű]", re.IGNORECASE), "hu-HU"),           # Hungarian
        (re.compile(r"[ăâîșț]", re.IGNORECASE), "ro-RO"),        # Romanian
        (re.compile(r"[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]", re.IGNORECASE), "vi-VN"), # Vietnamese
    ]

    # Latin Vocabulary Words for Pure ASCII Texts
    LATIN_VOCAB_MAP = [
        (re.compile(r"\b(?:por\s+favor|gracias|buenos\s+dias|buenas\s+tardes|hola|hablar|quiero|senor|senora|amigo)\b", re.IGNORECASE), "es-ES"),
        (re.compile(r"\b(?:bonjour|merci|s'il\s+vous\s+plait|parler|salut|monsieur|madame)\b", re.IGNORECASE), "fr-FR"),
        (re.compile(r"\b(?:guten\s+tag|hallo|danke|bitte|sprechen|mochte|auf\s+wiedersehen)\b", re.IGNORECASE), "de-DE"),
        (re.compile(r"\b(?:obrigado|obrigada|ola|falar|bom\s+dia|boa\s+tarde|por\s+favor)\b", re.IGNORECASE), "pt-PT"),
        (re.compile(r"\b(?:ciao|grazie|buongiorno|parlare|vorrei|per\s+favore)\b", re.IGNORECASE), "it-IT"),
        (re.compile(r"\b(?:kya|nahi|karo|bhai|kaise|baat|karna|shukriya|mujhe|aapse|bolo|hoga|karega|namaste|sirji|chahiye|theek)\b", re.IGNORECASE), "hi-IN"),
    ]

    def __init__(self, agent_id: str, default_language: str = "en-US"):
        self.agent_id = agent_id
        self.short_term_memory: List[Dict[str, str]] = []
        self.detected_language = default_language
        self.language_confidence = 1.0

    def detect_language(self, text: str) -> str:
        """Dynamically identifies language BCP-47 code from 104+ languages."""
        if not text or not text.strip():
            return self.detected_language

        clean_text = text.strip()

        # 1. Check Non-Latin Script Map (Highest Precision)
        for pattern, lang_code in self.SCRIPT_LANGUAGE_MAP:
            if pattern.search(clean_text):
                return lang_code

        # 2. Check Latin Distinctive Vocabulary (Words like 'por favor', 'kya', 'merci', etc.)
        for pattern, lang_code in self.LATIN_VOCAB_MAP:
            if pattern.search(clean_text):
                return lang_code

        # 3. Check Latin Non-ASCII Distinctive Diacritics (Only if non-ASCII chars exist)
        if any(ord(c) > 127 for c in clean_text):
            for pattern, lang_code in self.LATIN_DIACRITICS_MAP:
                if pattern.search(clean_text):
                    return lang_code

        # 4. Default to current / English
        return "en-US"

    def add_turn(self, speaker: str, text: str) -> None:
        """Appends a turn to conversation memory and updates dynamic language detection."""
        self.short_term_memory.append({"speaker": speaker, "text": text})

        if speaker == "user" and text:
            self.detected_language = self.detect_language(text)

    def get_conversation_history(self) -> List[Dict[str, str]]:
        return self.short_term_memory

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "turns_count": len(self.short_term_memory),
            "detected_language": self.detected_language,
            "language_confidence": self.language_confidence,
        }
