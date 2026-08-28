"""
API Router for Universal Conversation Engine Subsystem
Exposes /api/conversation-engine endpoints for session telemetry, turn processing, and barge-in triggers.
"""

from typing import Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.models.models import Agent as AgentModel, User
from backend.conversation_engine.runtime import UniversalConversationRuntime

router = APIRouter(prefix="/api/conversation-engine", tags=["Universal Conversation Engine Subsystem"])

# Session Store
_active_runtimes: Dict[str, UniversalConversationRuntime] = {}


def get_or_create_runtime(session_id: str, agent_name: str = "AI Assistant") -> UniversalConversationRuntime:
    if session_id not in _active_runtimes:
        _active_runtimes[session_id] = UniversalConversationRuntime(
            session_id=session_id,
            agent_name=agent_name,
        )
    return _active_runtimes[session_id]


class UniversalTurnRequest(BaseModel):
    session_id: str
    agent_id: Optional[str] = None
    user_input: str
    telephony_provider: str = "simulated"


class BargeInRequest(BaseModel):
    session_id: str


@router.post("/turn")
async def process_universal_turn(
    req: UniversalTurnRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent_name = "AI Assistant"
    if req.agent_id:
        agent_row = db.query(AgentModel).filter(AgentModel.id == req.agent_id).first()
        if agent_row and agent_row.name:
            agent_name = str(agent_row.name)

    runtime = get_or_create_runtime(req.session_id, agent_name=agent_name)
    res = await runtime.process_user_turn(req.user_input)
    return {
        "status": "success",
        "result": res,
        "telemetry": runtime.get_telemetry(),
    }


@router.post("/barge-in")
async def trigger_barge_in(
    req: BargeInRequest,
    current_user: User = Depends(get_current_user),
):
    if req.session_id not in _active_runtimes:
        raise HTTPException(status_code=404, detail="Conversation session not found")
    runtime = _active_runtimes[req.session_id]
    runtime._on_bargein()
    return {"status": "success", "session_id": req.session_id, "state": runtime.state_machine.current_state.value}


@router.get("/session/{session_id}")
async def get_conversation_telemetry(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    if session_id not in _active_runtimes:
        raise HTTPException(status_code=404, detail="Conversation session not found")
    runtime = _active_runtimes[session_id]
    return {"status": "success", "telemetry": runtime.get_telemetry()}


@router.get("/health")
async def conversation_engine_health():
    return {
        "subsystem": "Universal Conversation Engine",
        "status": "online",
        "active_sessions": len(_active_runtimes),
        "version": "2.4.0",
    }
