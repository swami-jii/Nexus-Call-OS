"""
104+ Multilingual NLP Sub-Engine.
Multi-script tokenization, stopwords filtering, and conversational intent classification.
"""

from backend.rag.nlp_engine.multilingual_tokenizer import MultilingualTokenizer
from backend.rag.nlp_engine.stopwords import GLOBAL_STOPWORDS_104_PLUS
from backend.rag.nlp_engine.intent_classifier import IntentClassifier

# Backward-compatibility alias
MultilingualEngine = MultilingualTokenizer
NLPContextEngine = MultilingualTokenizer

__all__ = [
    "MultilingualTokenizer",
    "MultilingualEngine",
    "NLPContextEngine",
    "GLOBAL_STOPWORDS_104_PLUS",
    "IntentClassifier"
]
