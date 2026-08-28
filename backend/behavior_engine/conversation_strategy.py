"""
Conversation Strategy Module
Nexus Call OS v2.4 Enterprise

Resolves the appropriate conversation strategy based on agent configuration and detected intent.
Supports 10 dynamic strategies adapting to business type and caller behavior.
"""

from enum import Enum
from typing import Dict, Any


class ConversationStrategy(str, Enum):
    SALES = "sales"
    SUPPORT = "support"
    LEAD_QUALIFICATION = "lead_qualification"
    APPOINTMENT_BOOKING = "appointment_booking"
    COMPLAINT_HANDLING = "complaint_handling"
    INFORMATION_DESK = "information_desk"
    FOLLOW_UP = "follow_up"
    DEBT_COLLECTION = "debt_collection"
    SURVEY = "survey"
    RECEPTIONIST = "receptionist"


class BusinessType(str, Enum):
    DENTAL_CLINIC = "dental_clinic"
    HOSPITAL = "hospital"
    REAL_ESTATE = "real_estate"
    SCHOOL = "school"
    COLLEGE = "college"
    COACHING = "coaching"
    RESTAURANT = "restaurant"
    SALON = "salon"
    INSURANCE = "insurance"
    BANK = "bank"
    TRAVEL = "travel"
    ECOMMERCE = "ecommerce"
    CUSTOMER_SUPPORT = "customer_support"
    GENERAL = "general"


# Default strategy per business type
BUSINESS_TYPE_STRATEGY_MAP: Dict[BusinessType, ConversationStrategy] = {
    BusinessType.DENTAL_CLINIC: ConversationStrategy.APPOINTMENT_BOOKING,
    BusinessType.HOSPITAL: ConversationStrategy.APPOINTMENT_BOOKING,
    BusinessType.REAL_ESTATE: ConversationStrategy.LEAD_QUALIFICATION,
    BusinessType.SCHOOL: ConversationStrategy.INFORMATION_DESK,
    BusinessType.COLLEGE: ConversationStrategy.INFORMATION_DESK,
    BusinessType.COACHING: ConversationStrategy.LEAD_QUALIFICATION,
    BusinessType.RESTAURANT: ConversationStrategy.RECEPTIONIST,
    BusinessType.SALON: ConversationStrategy.APPOINTMENT_BOOKING,
    BusinessType.INSURANCE: ConversationStrategy.SALES,
    BusinessType.BANK: ConversationStrategy.SUPPORT,
    BusinessType.TRAVEL: ConversationStrategy.SALES,
    BusinessType.ECOMMERCE: ConversationStrategy.SUPPORT,
    BusinessType.CUSTOMER_SUPPORT: ConversationStrategy.COMPLAINT_HANDLING,
    BusinessType.GENERAL: ConversationStrategy.RECEPTIONIST,
}


class ConversationStrategyResolver:
    """Resolves the optimal conversation strategy based on business type and agent configuration."""

    @staticmethod
    def resolve(business_type: str, override_strategy: str = "") -> Dict[str, Any]:
        if override_strategy:
            try:
                strategy = ConversationStrategy(override_strategy)
                return {"strategy": strategy.value, "source": "override"}
            except ValueError:
                pass

        try:
            biz = BusinessType(business_type.lower())
        except ValueError:
            biz = BusinessType.GENERAL

        strategy = BUSINESS_TYPE_STRATEGY_MAP.get(biz, ConversationStrategy.RECEPTIONIST)
        return {
            "strategy": strategy.value,
            "business_type": biz.value,
            "source": "auto_resolved",
        }
