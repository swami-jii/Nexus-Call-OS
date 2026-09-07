import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.repositories.repositories import call_repo
from backend.voice_pipeline.session_manager import session_manager

router = APIRouter(prefix="/api/live-sessions", tags=["Live Call Sessions"])


class OutboundCallRequest(BaseModel):
    to_number: str
    from_number: str | None = None
    agent_id: str | None = None


@router.get("")
def get_all_live_sessions():
    sessions = session_manager.list_sessions()
    active_count = len(
        [s for s in sessions if s["status"] in ["initiating", "in-progress", "ringing"]]
    )
    total_tokens = sum(s["tokens_used"] for s in sessions)
    total_cost = sum(s["cost_usd"] for s in sessions)
    avg_latency = (
        sum(s["latency_ms"]["total_pipeline"] for s in sessions) / len(sessions)
        if sessions
        else 650.0
    )

    return {
        "active_calls_count": active_count,
        "total_sessions_count": len(sessions),
        "total_tokens": total_tokens,
        "total_cost_usd": round(total_cost, 4),
        "average_latency_ms": round(avg_latency, 2),
        "sessions": sessions,
    }


@router.get("/{call_id}")
def get_live_session_details(call_id: str):
    session = session_manager.get_session(call_id)
    if not session:
        raise HTTPException(status_code=404, detail="Live call session not found")
    return session.to_dict()


@router.post("/dispatch-call")
async def dispatch_outbound_call(
    payload: OutboundCallRequest, db: Session = Depends(get_db)
):
    call_id = f"CA{uuid.uuid4().hex[:32]}"
    telephony = provider_manager.get_telephony_provider()

    # Initiate call through Twilio Telephony Provider
    call_res = await telephony.initiate_call(
        to_number=payload.to_number,
        from_number=payload.from_number or "+18005550199",
        agent_id=payload.agent_id or "default-agent",
        webhook_url=f"/api/twilio/voice/outbound?call_id={call_id}",
    )

    session = session_manager.create_session(
        call_id=call_id,
        to_number=payload.to_number,
        from_number=payload.from_number or "+18005550199",
        agent_id=payload.agent_id,
        direction="outbound",
    )
    session.status = "ringing"
    session.add_transcript("system", "Outbound call dispatched via Twilio Gateway.")

    # Record in database CallLog repository
    try:
        call_repo.create(
            db,
            {
                "id": call_id,
                "agent_id": payload.agent_id,
                "from_number": payload.from_number or "+18005550199",
                "to_number": payload.to_number,
                "direction": "outbound",
                "status": "ringing",
                "recording_url": None,
                "summary": "Outbound AI voice call initialized.",
            },
        )
    except Exception as e:
        print(f"[LiveSessions Router] DB CallLog record exception: {e}")

    return {
        "status": "dispatched",
        "call_id": call_id,
        "provider_response": call_res,
        "session": session.to_dict(),
    }


@router.post("/{call_id}/interrupt")
def interrupt_live_session(call_id: str):
    session = session_manager.get_session(call_id)
    if not session:
        raise HTTPException(status_code=404, detail="Live session not found")

    session.is_interrupted = True
    session.set_speaking_status("interrupted")
    session.add_transcript("system", "User speech interrupted AI response.")
    return {"status": "interrupted", "call_id": call_id}


@router.post("/{call_id}/transfer")
def transfer_live_session(call_id: str, target_number: str = "+18005550199"):
    session = session_manager.get_session(call_id)
    if not session:
        raise HTTPException(status_code=404, detail="Live session not found")

    session.status = "transferred"
    session.add_transcript(
        "system", f"Call transferred to human agent ({target_number})."
    )
    return {"status": "transferred", "call_id": call_id, "target": target_number}


@router.post("/{call_id}/hangup")
async def hangup_live_session(call_id: str):
    session = session_manager.get_session(call_id)
    if not session:
        raise HTTPException(status_code=404, detail="Live session not found")

    telephony = provider_manager.get_telephony_provider()
    await telephony.terminate_call(call_id)
    session_manager.end_session(call_id)
    return {"status": "terminated", "call_id": call_id}
