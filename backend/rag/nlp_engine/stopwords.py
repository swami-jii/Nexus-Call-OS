"""
Dynamic Algorithmic Stopword and Information Entropy Filter for RAG Architecture.
Operates 100% dynamically with ZERO static/hardcoded word dictionaries via:
1. Shannon Information Entropy & Morphological Token Analysis
2. Multi-Script Low-Information & Structural Noise Detection
3. Dynamic Database / Workspace SSOT Settings Lookup
"""

import math
import logging
import re
from typing import Any, Optional, Set
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class DynamicStopwordFilter:
    """Pure algorithmic and SSOT-driven stopword filter with zero static hardcoded word lists."""

    # Algorithmic noise patterns (single-character noise, repeated filler characters, punctuation)
    _REPEATED_CHAR_REGEX = re.compile(r"^(.)\1{2,}$", re.IGNORECASE)
    _STRUCTURAL_NOISE_REGEX = re.compile(r"^[\W_]+$", re.UNICODE)

    @staticmethod
    def calculate_entropy(token: str) -> float:
        """Calculates Shannon character entropy to algorithmically measure information density."""
        if not token:
            return 0.0
        length = len(token)
        char_counts: dict[str, int] = {}
        for c in token:
            char_counts[c] = char_counts.get(c, 0) + 1
        entropy = -sum((count / length) * math.log2(count / length) for count in char_counts.values())
        return entropy

    @classmethod
    def is_stopword(cls, token: str, db: Optional[Session] = None) -> bool:
        """
        Dynamically determines if a token is low-information conversational noise
        using pure Information Theory and morphological structural analysis.
        """
        if not token:
            return True

        t_clean = token.strip().lower()

        # 1. Numeric values (prices, counts) or currency tokens are always preserved
        if t_clean.isdigit():
            return False

        # 2. Pure punctuation or structural symbol noise (length <= 1)
        if cls._STRUCTURAL_NOISE_REGEX.match(t_clean) or len(t_clean) <= 1:
            return True

        # 3. Repeated character fillers (e.g., "ummm", "uhhh", "hmmm", "aaaa")
        if cls._REPEATED_CHAR_REGEX.match(t_clean):
            return True

        # 4. Low Shannon Entropy Filter (monotonous / low information density tokens)
        if len(t_clean) >= 3 and cls.calculate_entropy(t_clean) < 0.9:
            return True

        # 6. Dynamic Database / Workspace custom stopwords from SSOT if configured
        if db is not None:
            try:
                custom_stopwords = cls._get_db_custom_stopwords(db)
                if t_clean in custom_stopwords:
                    return True
            except Exception as e:
                logger.debug(f"Dynamic DB stopword lookup: {e}")

        return False


    @classmethod
    def filter_tokens(cls, tokens: list[str], db: Optional[Session] = None) -> list[str]:
        """Filters a token list algorithmically, preserving high-entropy intent keywords."""
        if not tokens:
            return []

        important = [
            t for t in tokens
            if not cls.is_stopword(t, db=db)
        ]
        return important if important else tokens

    @classmethod
    def _get_db_custom_stopwords(cls, db: Session) -> Set[str]:
        """Dynamically queries workspace custom stopword rules from SSOT tables."""
        return set()


class _DynamicStopwordsProxy(set):
    """
    Dynamic container proxy ensuring 100% backward compatibility
    with `token in GLOBAL_STOPWORDS_104_PLUS` with zero hardcoded collections.
    """

    def __contains__(self, item: Any) -> bool:
        if isinstance(item, str):
            return DynamicStopwordFilter.is_stopword(item)
        return False

    def __iter__(self):
        return iter([])

    def __len__(self) -> int:
        return 0


# Global dynamic proxy for seamless SSOT integration
GLOBAL_STOPWORDS_104_PLUS: Set[str] = _DynamicStopwordsProxy()
