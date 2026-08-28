"""
API Router for Core Runtime Orchestrator Subsystem
Exposes /api/runtime endpoints for end-to-end voice session orchestration, user turn execution, and health telemetry.
"""

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.auth.deps import get_current_user
from backend.models.models import User
from backend.runtime.core_orchestrator import CoreRuntimeOrchestrator

router = APIRouter(prefix="/api/runtime", tags=["Core Runtime Orchestrator"])

# Global Core Runtime Orchestrator Instance
_runtime_orchestrator = CoreRuntimeOrchestrator()


class StartVoiceSessionRequest(BaseModel):
    session_id: str
    phone_number: str = "+18005550199"
    provider_name: str = "simulated"
    direction: str = "outbound"
    agent_id: Optional[str] = None


class UserSpeechTurnRequest(BaseModel):
    session_id: str
    user_speech_text: str
    raw_pcm_hex: Optional[str] = None


@router.post("/sessions/start")
async def start_voice_session(
    req: StartVoiceSessionRequest,
    current_user: User = Depends(get_current_user),
):
    res = await _runtime_orchestrator.start_voice_session(
        session_id=req.session_id,
        phone_number=req.phone_number,
        provider_name=req.provider_name,
        direction=req.direction,
        agent_id=req.agent_id,
    )
    return {"status": "success", "result": res}


@router.post("/sessions/turn")
async def process_user_turn(
    req: UserSpeechTurnRequest,
    current_user: User = Depends(get_current_user),
):
    res = await _runtime_orchestrator.process_user_speech_turn(
        session_id=req.session_id,
        user_speech_text=req.user_speech_text,
        raw_pcm_hex=req.raw_pcm_hex,
    )
    return {"status": "success", "result": res}


@router.post("/sessions/{session_id}/end")
async def end_voice_session(
    session_id: str,
    reason: str = "normal_clearing",
    current_user: User = Depends(get_current_user),
):
    res = await _runtime_orchestrator.end_voice_session(session_id, reason=reason)
    return {"status": "success", "result": res}


@router.get("/health")
async def get_runtime_health():
    return {
        "subsystem": "Core Runtime Orchestrator",
        "status": "online",
        "dashboard": _runtime_orchestrator.get_system_health(),
    }
