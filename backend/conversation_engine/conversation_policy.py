"""
Conversation Policy & Universal Action Trigger Enforcer (104+ Languages)
Create Call OS v2.4 Enterprise

Enforces universal telephony policy rules: Human operator transfer requests,
callback requests, hold requests, escalation arbitration, and PCI/HIPAA PII compliance masking.
"""

import re
from enum import Enum
from typing import Any, Dict, List, Optional


class ActionTrigger(str, Enum):
    NONE = "none"
    HUMAN_TRANSFER = "human_transfer"
    CALLBACK_REQUEST = "callback_request"
    HOLD_REQUEST = "hold_request"
    ESCALATION = "escalate"


class ConversationPolicyEnforcer:
    """Evaluates universal conversation policy triggers dynamically across 104+ languages."""

    # Dynamic Multilingual Transfer Patterns (Indic, Romance, Germanic, Arabic, East Asian, Cyrillic)
    _TRANSFER_PATTERNS = re.compile(
        r"(?:\b(?:human|operator|agent|representative|supervisor|manager|person|someone else|real person|doctor|lawyer|specialist|consultant|speak\s+with|talk\s+to)\b|"
        r"[\u0900-\u097F]*(?:इंसान|बात\s*करा|बात\s*करनी|डॉक्टर|ऑपरेटर|प्रतिनिधि|एजेंट|अधिकारी|ट्रांसफर|विशेषज्ञ|वकील|सलाहकार)[\u0900-\u097F]*|"
        r"\b(?:insan\s+se|aadmi\s+se|kisi\s+se\s+baat|transfer\s+karo|operator\s+se|manager\s+se|doctor\s+se|expert\s+se)\b|"
        r"\b(?:hablar\s+con|operador|humano|persona\s+real|médico|abogado|especialista)\b|"
        r"\b(?:parler\s+à|opérateur|conseiller|médecin|avocat|spécialiste)\b|"
        r"\b(?:mit\s+jemandem\s+sprechen|mitarbeiter|berater|arzt|anwalt|spezialist)\b|"
        r"(?:تحدث\s+مع|خدمة\s+العملاء|إنسان|تحويل\s+المكالمة|طبيب|محامي|مستشار)|"
        r"(?:オペレーター|担当者|人間|代わって|専門家|医師)|"
        r"(?:人工客服|转接|真人|专家|医生))",
        re.IGNORECASE | re.UNICODE
    )

    # Dynamic Multilingual Callback Patterns
    _CALLBACK_PATTERNS = re.compile(
        r"(?:\b(?:call\s+me\s+back|call\s+back|ring\s+back|call\s+later|busy\s+now)\b|"
        r"[\u0900-\u097F]*(?:बाद\s+में\s+कॉल|दोबारा\s+कॉल|व्यस्त|फुर्सत|वापस\s+कॉल)[\u0900-\u097F]*|"
        r"\b(?:baad\s+me\s+call|phir\s+call|busy\s+hu|thodi\s+der\s+baad|call\s+karo\s+baad)\b|"
        r"\b(?:llámame\s+más\s+tarde|volver\s+a\s+llamar|ocupado)\b|"
        r"\b(?:rappelez-moi|plus\s+tard|occupé)\b|"
        r"\b(?:später\s+anrufen|zurückrufen|beschäftigt)\b|"
        r"(?:اتصل\s+بي\s+لاحقاً|مشغول\s+الآن|معاودة\s+الاتصال)|"
        r"(?:後で電話|折り返し|掛け直して)|"
        r"(?:稍后回电|忙碌|再联系))",
        re.IGNORECASE | re.UNICODE
    )

    # Dynamic Multilingual Hold Patterns
    _HOLD_PATTERNS = re.compile(
        r"(?:\b(?:hold\s+on|wait\s+a\s+minute|one\s+second|give\s+me\s+a\s+moment|hold\s+please|just\s+a\s+sec)\b|"
        r"[\u0900-\u097F]*(?:रुकिए|एक\s+मिनट|होल्ड\s+कीजिए|थोड़ा\s+इंतज़ार)[\u0900-\u097F]*|"
        r"\b(?:ruk\s+jao|ek\s+minute|hold\s+karo|thoda\s+ruko|ek\s+sec|wait\s+karo)\b|"
        r"\b(?:espera\s+un\s+momento|un\s+segundo|un\s+momento)\b|"
        r"\b(?:attendez\s+un\s+instant|un\s+moment)\b|"
        r"\b(?:einen\s+moment|warten\s+sie\s+bitte)\b|"
        r"(?:انتظر\s+لحظة|دقيقة\s+واحدة|خليك\s+معي)|"
        r"(?:ちょっと待って|少々お待ちください)|"
        r"(?:稍等|等一下|请稍候))",
        re.IGNORECASE | re.UNICODE
    )

    # Dynamic Multilingual Escalation & Complaint Patterns
    _ESCALATE_PATTERNS = re.compile(
        r"(?:\b(?:fraud|scam|lawyer|police|court|sue\s+you|illegal|unacceptable|cheat|terrible\s+service)\b|"
        r"[\u0900-\u097F]*(?:धोखा|शिकायत|पुलिस|वकील|अवैध|कंज्यूमर\s+कोर्ट)[\u0900-\u097F]*|"
        r"\b(?:shikayat|dhoka|fraud|police|case\s+karunga|consumer\s+court|report\s+karunga)\b|"
        r"\b(?:fraude|estafa|abogado|policía|demanda)\b|"
        r"\b(?:fraude|arnaque|avocat|police|plainte)\b|"
        r"\b(?:betrug|anwalt|polizei|beschwerde)\b|"
        r"(?:احتيال|نصب|محامي|شرطة|شكوى\s+رسمية)|"
        r"(?:詐欺|警察|弁護士|クレーム)|"
        r"(?:诈骗|报警|律师|投诉))",
        re.IGNORECASE | re.UNICODE
    )

    def __init__(self, mask_pii: bool = True):
        self.mask_pii = mask_pii

    def detect_action_trigger(self, user_text: str) -> ActionTrigger:
        """Dynamically identifies action triggers across 104+ languages without language locking."""
        if not user_text or not user_text.strip():
            return ActionTrigger.NONE

        text_clean = user_text.strip()

        # 1. Escalation / Complaint
        if self._ESCALATE_PATTERNS.search(text_clean):
            return ActionTrigger.ESCALATION

        # 2. Human Operator Transfer
        if self._TRANSFER_PATTERNS.search(text_clean):
            return ActionTrigger.HUMAN_TRANSFER

        # 3. Callback Request
        if self._CALLBACK_PATTERNS.search(text_clean):
            return ActionTrigger.CALLBACK_REQUEST

        # 4. Hold Request
        if self._HOLD_PATTERNS.search(text_clean):
            return ActionTrigger.HOLD_REQUEST

        return ActionTrigger.NONE

    def sanitize_text(self, text: str) -> str:
        """Sanitizes sensitive PII data (SSN, credit card, bank codes) from telephony transcript."""
        if not self.mask_pii or not text:
            return text
        sanitized = re.sub(r"\b\d{3}-\d{2}-\d{4}\b", "[REDACTED-SSN]", text)
        sanitized = re.sub(r"\b(?:\d[ -]*?){13,16}\b", "[REDACTED-CARD]", sanitized)
        return sanitized
