"""
Conversation Policy Module
Nexus Call OS v2.4 Enterprise

Enforces universal conversation rules: escalation triggers, human operator transfer requests,
callback requests, hold requests, and PCI/HIPAA compliance masking.
"""

import re
from enum import Enum
from typing import Dict, Any, List, Optional


class ActionTrigger(str, Enum):
    NONE = "none"
    HUMAN_TRANSFER = "human_transfer"
    CALLBACK_REQUEST = "callback_request"
    HOLD_REQUEST = "hold_request"
    ESCALATION = "escalate"


class ConversationPolicyEnforcer:
    """Evaluates universal conversation rules independent of LLM prompts."""

    def __init__(
        self,
        mask_pii: bool = True,
        transfer_keywords: Optional[list] = None,
        callback_keywords: Optional[list] = None,
        hold_keywords: Optional[list] = None,
        escalate_keywords: Optional[list] = None,
    ):
        self.mask_pii = mask_pii
        self.transfer_keywords = transfer_keywords or []
        self.callback_keywords = callback_keywords or []
        self.hold_keywords = hold_keywords or []
        self.escalate_keywords = escalate_keywords or []

    def detect_action_trigger(self, user_text: str) -> ActionTrigger:
        if not user_text:
            return ActionTrigger.NONE
        text_lower = user_text.lower().strip()
        if self.transfer_keywords and any(kw in text_lower for kw in self.transfer_keywords):
            return ActionTrigger.HUMAN_TRANSFER
        if self.callback_keywords and any(kw in text_lower for kw in self.callback_keywords):
            return ActionTrigger.CALLBACK_REQUEST
        if self.hold_keywords and any(kw in text_lower for kw in self.hold_keywords):
            return ActionTrigger.HOLD_REQUEST
        if self.escalate_keywords and any(kw in text_lower for kw in self.escalate_keywords):
            return ActionTrigger.ESCALATION
        return ActionTrigger.NONE

    def sanitize_text(self, text: str) -> str:
        if not self.mask_pii:
            return text
        # Redact SSN & Credit Card numbers
        sanitized = re.sub(r"\b\d{3}-\d{2}-\d{4}\b", "[REDACTED-SSN]", text)
        sanitized = re.sub(r"\b(?:\d[ -]*?){13,16}\b", "[REDACTED-CARD]", sanitized)
        return sanitized
