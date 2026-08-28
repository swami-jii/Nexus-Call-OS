"""
Goal Manager Module
Nexus Call OS v2.4 Enterprise

Tracks active business goals, completion progress, and required caller info fields.
"""

from enum import Enum
from typing import Dict, Any, List


class BusinessGoal(str, Enum):
    LEAD_QUALIFICATION = "lead_qualification"
    APPOINTMENT_BOOKING = "appointment_booking"
    SALES_CONVERSION = "sales_conversion"
    SUPPORT_RESOLUTION = "support_resolution"
    COMPLAINT_HANDLING = "complaint_handling"
    DEBT_COLLECTION = "debt_collection"
    SURVEY_COMPLETION = "survey_completion"
    INFORMATION_DESK = "information_desk"


class GoalManager:
    """Manages active call goal progression and required information collection."""

    def __init__(self, primary_goal: BusinessGoal = BusinessGoal.APPOINTMENT_BOOKING):
        self.primary_goal = primary_goal
        self.collected_fields: Dict[str, Any] = {}
        self.required_fields = ["name", "phone", "preferred_date"] if primary_goal == BusinessGoal.APPOINTMENT_BOOKING else ["query"]

    def update_goal_progress(self, field_name: str, value: Any) -> float:
        self.collected_fields[field_name] = value
        progress = len(self.collected_fields) / max(1, len(self.required_fields))
        return round(min(1.0, progress), 2)

    def is_goal_achieved(self) -> bool:
        return all(f in self.collected_fields for f in self.required_fields)

    def get_status(self) -> Dict[str, Any]:
        return {
            "primary_goal": self.primary_goal.value,
            "is_achieved": self.is_goal_achieved(),
            "collected_fields": self.collected_fields,
            "required_fields": self.required_fields,
        }
