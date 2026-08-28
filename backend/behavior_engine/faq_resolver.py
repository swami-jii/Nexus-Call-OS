"""
FAQ Resolver Module
Nexus Call OS v2.4 Enterprise

Matches caller questions against a curated FAQ bank with semantic keyword matching.
Returns authoritative answers only — never hallucinated responses.
"""

from typing import Dict, Any, List, Optional


class FAQEntry:
    def __init__(self, keywords: List[str], answer: str):
        self.keywords = [kw.lower() for kw in keywords]
        self.answer = answer


class FAQResolver:
    """Matches user queries against an authoritative FAQ bank."""

    def __init__(self, faq_entries: Optional[List[FAQEntry]] = None):
        self.faq_bank: List[FAQEntry] = faq_entries or self._default_faq_bank()

    def _default_faq_bank(self) -> List[FAQEntry]:
        return [
            FAQEntry(["hours", "open", "timing", "schedule"], "We are open Monday to Saturday, 9 AM to 7 PM."),
            FAQEntry(["location", "address", "where", "map"], "We are located in the city center. I can send you the address via SMS."),
            FAQEntry(["price", "cost", "charges", "fees"], "Our pricing varies by service. May I ask which specific service you are interested in?"),
            FAQEntry(["appointment", "book", "reserve"], "I can help you schedule an appointment right away. May I have your preferred date?"),
            FAQEntry(["cancel", "reschedule"], "Appointments can be cancelled or rescheduled at least 24 hours in advance."),
            FAQEntry(["payment", "pay", "card", "cash", "upi"], "We accept Cash, UPI, Credit/Debit Cards, and Net Banking."),
        ]

    def resolve(self, user_query: str) -> Dict[str, Any]:
        txt = user_query.lower()
        for entry in self.faq_bank:
            if any(kw in txt for kw in entry.keywords):
                return {
                    "resolved": True,
                    "answer": entry.answer,
                    "source": "faq_bank",
                    "confidence": 0.95,
                }
        return {
            "resolved": False,
            "answer": None,
            "source": "no_match",
            "confidence": 0.0,
        }
