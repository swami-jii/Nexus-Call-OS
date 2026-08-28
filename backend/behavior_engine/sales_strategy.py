"""
Sales Strategy Module
Nexus Call OS v2.4 Enterprise

Controls sales conversation progression: pitch, value proposition, soft close, and follow-up.
"""

from enum import Enum
from typing import Dict, Any


class SalesStage(str, Enum):
    OPENING = "opening"
    DISCOVERY = "discovery"
    PITCH = "pitch"
    OBJECTION = "objection"
    CLOSING = "closing"
    FOLLOW_UP = "follow_up"


class SalesStrategyEngine:
    """Drives sales conversation stage progression and closing logic."""

    STAGE_TRANSITIONS = {
        SalesStage.OPENING: SalesStage.DISCOVERY,
        SalesStage.DISCOVERY: SalesStage.PITCH,
        SalesStage.PITCH: SalesStage.CLOSING,
        SalesStage.OBJECTION: SalesStage.PITCH,
        SalesStage.CLOSING: SalesStage.FOLLOW_UP,
    }

    def __init__(self):
        self.current_stage = SalesStage.OPENING
        self.objection_count = 0

    def advance_stage(self) -> SalesStage:
        next_stage = self.STAGE_TRANSITIONS.get(self.current_stage, SalesStage.FOLLOW_UP)
        self.current_stage = next_stage
        return next_stage

    def handle_objection(self) -> Dict[str, Any]:
        self.objection_count += 1
        self.current_stage = SalesStage.OBJECTION
        return {
            "action": "handle_objection",
            "objection_count": self.objection_count,
            "next_stage": SalesStage.PITCH.value,
            "recommendation": "empathize_and_reframe",
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "current_stage": self.current_stage.value,
            "objection_count": self.objection_count,
        }
