"""
API Router for Enterprise AI Behavior & Decision Engine
Exposes /api/behavior endpoints for session creation, turn evaluation, and telemetry.
"""

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.auth.deps import get_current_user
from backend.behavior_engine.behavior_runtime import BehaviorEngineRuntime
from backend.models.models import User

router = APIRouter(prefix="/api/behavior", tags=["Enterprise AI Behavior Engine"])

_behavior_runtime = BehaviorEngineRuntime()


class CreateBehaviorSessionRequest(BaseModel):
    session_id: str
    business_type: str = "general"
    strategy_override: str = ""
    primary_goal: str = "appointment_booking"


class EvaluateTurnRequest(BaseModel):
    session_id: str
    user_input: str
    ai_response: Optional[str] = None


@router.post("/sessions/create")
async def create_behavior_session(
    req: CreateBehaviorSessionRequest,
    current_user: User = Depends(get_current_user),
):
    res = _behavior_runtime.create_session(
        session_id=req.session_id,
        business_type=req.business_type,
        strategy_override=req.strategy_override,
        primary_goal=req.primary_goal,
    )
    return {"status": "success", "result": res}


@router.post("/sessions/evaluate")
async def evaluate_turn(
    req: EvaluateTurnRequest,
    current_user: User = Depends(get_current_user),
):
    res = _behavior_runtime.evaluate_turn(
        session_id=req.session_id,
        user_input=req.user_input,
        ai_response=req.ai_response,
    )
    return {"status": "success", "result": res}


@router.post("/sessions/{session_id}/close")
async def close_behavior_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    res = _behavior_runtime.close_session(session_id)
    return {"status": "success", "result": res}


@router.get("/health")
async def behavior_engine_health():
    return {
        **_behavior_runtime.get_telemetry(),
        "version": "2.4.0",
    }
