"""
Appointment Manager Module
Nexus Call OS v2.4 Enterprise

Manages appointment slot collection, validation, and booking confirmation flow.
"""

from typing import Dict, Any, List, Optional


class AppointmentManager:
    """Drives appointment booking workflows and multi-step slot confirmation."""

    REQUIRED_FIELDS = ["patient_name", "phone", "preferred_date", "preferred_time", "service"]

    def __init__(self):
        self.collected: Dict[str, str] = {}
        self.is_confirmed = False

    def collect_field(self, field: str, value: str) -> Dict[str, Any]:
        self.collected[field] = value
        remaining = [f for f in self.REQUIRED_FIELDS if f not in self.collected]
        return {
            "collected": self.collected,
            "remaining_fields": remaining,
            "progress_percent": round(len(self.collected) / len(self.REQUIRED_FIELDS) * 100),
            "is_complete": len(remaining) == 0,
        }

    def confirm_appointment(self) -> Dict[str, Any]:
        if not all(f in self.collected for f in self.REQUIRED_FIELDS):
            return {"status": "incomplete", "message": "Missing required appointment information."}

        self.is_confirmed = True
        return {
            "status": "confirmed",
            "appointment": self.collected,
            "confirmation_id": f"APT-{hash(str(self.collected)) % 100000:05d}",
        }

    def get_next_question(self) -> Optional[str]:
        prompts = {
            "patient_name": "May I have your full name please?",
            "phone": "What is the best phone number to reach you?",
            "preferred_date": "Which date would you prefer for the appointment?",
            "preferred_time": "What time works best for you — morning or afternoon?",
            "service": "What type of service or consultation are you booking for?",
        }
        for field in self.REQUIRED_FIELDS:
            if field not in self.collected:
                return prompts[field]
        return None
