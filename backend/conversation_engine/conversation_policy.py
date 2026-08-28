"""
Conversation Policy Module
Nexus Call OS v2.4 Enterprise

Enforces universal conversation rules: escalation triggers, human operator transfer requests,
callback requests, hold requests, and PCI/HIPAA compliance masking.
"""

import re
from enum import Enum
from typing import Dict, Any


class ActionTrigger(str, Enum):
    NONE = "none"
    HUMAN_TRANSFER = "human_transfer"
    CALLBACK_REQUEST = "callback_request"
    HOLD_REQUEST = "hold_request"
    ESCALATION = "escalate"


class ConversationPolicyEnforcer:
    """Evaluates universal conversation rules independent of LLM prompts."""

    TRANSFER_KEYWORDS = ["agent", "human", "representative", "operator", "supervisor", "speak to someone"]
    CALLBACK_KEYWORDS = ["call me back", "callback", "later", "reach out tomorrow"]
    HOLD_KEYWORDS = ["hold on", "wait a second", "give me a minute", "one moment"]
    ESCALATE_KEYWORDS = ["lawyer", "attorney", "sue", "legal", "complain", "fraud"]

    def __init__(self, mask_pii: bool = True):
        self.mask_pii = mask_pii

    def detect_action_trigger(self, user_text: str) -> ActionTrigger:
        text_lower = user_text.lower().strip()
        if any(kw in text_lower for kw in self.TRANSFER_KEYWORDS):
            return ActionTrigger.HUMAN_TRANSFER
        if any(kw in text_lower for kw in self.CALLBACK_KEYWORDS):
            return ActionTrigger.CALLBACK_REQUEST
        if any(kw in text_lower for kw in self.HOLD_KEYWORDS):
            return ActionTrigger.HOLD_REQUEST
        if any(kw in text_lower for kw in self.ESCALATE_KEYWORDS):
            return ActionTrigger.ESCALATION
        return ActionTrigger.NONE

    def sanitize_text(self, text: str) -> str:
        if not self.mask_pii:
            return text
        # Redact SSN & Credit Card numbers
        sanitized = re.sub(r"\b\d{3}-\d{2}-\d{4}\b", "[REDACTED-SSN]", text)
        sanitized = re.sub(r"\b(?:\d[ -]*?){13,16}\b", "[REDACTED-CARD]", sanitized)
        return sanitized
