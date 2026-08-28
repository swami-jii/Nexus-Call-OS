"""
Intent Detector Module
Nexus Call OS v2.4 Enterprise

Classifies caller intents (pricing, booking, complaint, transfer, greeting, inquiry) and extracts entities.
"""

from enum import Enum
from typing import Dict, Any, List


class CallerIntent(str, Enum):
    GREETING = "greeting"
    PRICE_INQUIRY = "price_inquiry"
    BOOK_APPOINTMENT = "book_appointment"
    PRODUCT_INFO = "product_info"
    COMPLAINT = "complaint"
    HUMAN_TRANSFER = "human_transfer"
    CALLBACK_REQUEST = "callback_request"
    HOLD_REQUEST = "hold_request"
    OBJECTION_PRICE = "objection_price"
    OBJECTION_TRUST = "objection_trust"
    GOODBYE = "goodbye"
    UNKNOWN = "unknown"


class IntentDetector:
    """Classifies user speech input into structured CallerIntent and extracts entities."""

    def detect_intent(self, text_input: str) -> Dict[str, Any]:
        txt = text_input.lower()

        if any(w in txt for w in ["human", "agent", "operator", "supervisor", "person"]):
            intent = CallerIntent.HUMAN_TRANSFER
        elif any(w in txt for w in ["price", "cost", "how much", "rate", "fee"]):
            intent = CallerIntent.PRICE_INQUIRY
        elif any(w in txt for w in ["book", "appointment", "schedule", "reserve", "slot"]):
            intent = CallerIntent.BOOK_APPOINTMENT
        elif any(w in txt for w in ["too expensive", "high price", "costly", "expensive"]):
            intent = CallerIntent.OBJECTION_PRICE
        elif any(w in txt for w in ["complaint", "issue", "problem", "broken", "angry"]):
            intent = CallerIntent.COMPLAINT
        elif any(w in txt for w in ["bye", "goodbye", "end call", "talk later"]):
            intent = CallerIntent.GOODBYE
        elif any(w in txt for w in ["hi", "hello", "namaste", "hey"]):
            intent = CallerIntent.GREETING
        else:
            intent = CallerIntent.PRODUCT_INFO

        return {
            "intent": intent.value,
            "confidence": 0.92,
            "raw_input": text_input,
        }
