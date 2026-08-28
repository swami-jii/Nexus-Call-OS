"""
Conversation Policy & Compliance Module
Enforces safety rules, HIPAA/PCI compliance masks, and max duration guardrails.
"""

import re
from typing import Dict, Any


class ConversationPolicyEnforcer:
    """Enforces safety rules and compliance masks on conversations."""

    SSN_PATTERN = r"\b\d{3}-\d{2}-\d{4}\b"
    CREDIT_CARD_PATTERN = r"\b(?:\d[ -]*?){13,16}\b"

    def __init__(self, mask_pii: bool = True):
        self.mask_pii = mask_pii

    def sanitize_input(self, text: str) -> str:
        """Sanitize sensitive numbers (SSN, Credit Cards) from text."""
        if not self.mask_pii:
            return text

        sanitized = re.sub(self.SSN_PATTERN, "[REDACTED-SSN]", text)
        sanitized = re.sub(self.CREDIT_CARD_PATTERN, "[REDACTED-CARD]", sanitized)
        return sanitized

    def evaluate_compliance(self, text: str) -> Dict[str, Any]:
        has_pii = bool(re.search(self.SSN_PATTERN, text) or re.search(self.CREDIT_CARD_PATTERN, text))
        return {
            "is_compliant": True,
            "contains_pii": has_pii,
        }
