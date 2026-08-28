from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, Form, Request, Response
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.integrations.manager import provider_manager
from backend.repositories.repositories import call_repo
from backend.services.webhook_dispatcher import emit_domain_event
from backend.voice_pipeline.session_manager import session_manager

router = APIRouter(prefix="/api/twilio/voice", tags=["Twilio Voice Webhooks"])


@router.post("/incoming")
async def handle_incoming_call(
    request: Request,
    CallSid: Annotated[str, Form()] = "",
    From: Annotated[str, Form()] = "",
    To: Annotated[str, Form()] = "",
):
    call_id = CallSid or f"CA{uuid.uuid4().hex[:32]}"
    session = session_manager.create_session(
        call_id=call_id, to_number=To, from_number=From, direction="inbound"
    )
    session.status = "in-progress"

    # Construct TwiML for WebSocket Media Stream Connection
    host = request.headers.get("host", "localhost:8000")
    protocol = "wss" if "https" in request.url.scheme else "ws"
    stream_url = f"{protocol}://{host}/ws/twilio/stream/{call_id}"

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Connecting to Nexus AI Voice Assistant.</Say>
    <Connect>
        <Stream url="{stream_url}" />
    </Connect>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


@router.post("/outbound")
async def handle_outbound_call(
    request: Request,
    CallSid: Annotated[str, Form()] = "",
    To: Annotated[str, Form()] = "",
    From: Annotated[str, Form()] = "",
):
    call_id = CallSid or f"CA{uuid.uuid4().hex[:32]}"
    session = session_manager.create_session(
        call_id=call_id, to_number=To, from_number=From, direction="outbound"
    )
    session.status = "in-progress"

    host = request.headers.get("host", "localhost:8000")
    protocol = "wss" if "https" in request.url.scheme else "ws"
    stream_url = f"{protocol}://{host}/ws/twilio/stream/{call_id}"

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{stream_url}" />
    </Connect>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


@router.post("/status")
async def handle_status_callback(
    CallSid: Annotated[str, Form()] = "",
    CallStatus: Annotated[str, Form()] = "",
    CallDuration: Annotated[str, Form()] = "0",
    db: Session = Depends(get_db),
):
    session = session_manager.get_session(CallSid)
    if session:
        session.status = CallStatus.lower()
        if CallStatus.lower() in ["completed", "failed", "busy", "no-answer"]:
            session_manager.end_session(CallSid)

    # Sync status to DB CallLog repository if exists
    try:
        dur_str = str(CallDuration or "0")
        dur_int = int(dur_str) if dur_str.isdigit() else 0
        db_call = call_repo.get_by_id(db, CallSid)
        if db_call:
            call_repo.update(
                db,
                db_call,
                {
                    "status": CallStatus.lower(),
                    "duration_seconds": dur_int,
                },
            )
            # Emit telemetry webhook domain event
            try:
                emit_domain_event(
                    event_type=f"call.{CallStatus.lower()}",
                    data={
                        "call_id": CallSid,
                        "status": CallStatus.lower(),
                        "duration_seconds": dur_int,
                        "agent_id": db_call.agent_id,
                        "phone_number": db_call.phone_number,
                    },
                    organization_id=str(db_call.organization_id) if db_call.organization_id is not None else None,
                )
            except Exception:
                pass
    except Exception as e:
        print(f"[VoiceWebhooks] DB CallLog sync exception: {e}")

    return {"status": "success", "call_sid": CallSid, "state": CallStatus}


@router.post("/amd")
async def handle_answering_machine_detection(
    CallSid: Annotated[str, Form()] = "",
    AnsweredBy: Annotated[str, Form()] = "human",
):
    session = session_manager.get_session(CallSid)
    if session:
        if "machine" in AnsweredBy.lower():
            session.status = "voicemail"
            session.add_transcript("system", "Voicemail detected. Leaving message.")
        else:
            session.status = "in-progress"

    return {"status": "success", "call_sid": CallSid, "answered_by": AnsweredBy}


@router.post("/transfer")
async def handle_call_transfer(
    call_id: str,
    target_number: str = "+18005550199",
):
    session = session_manager.get_session(call_id)
    if session:
        session.status = "transferred"
        session.add_transcript(
            "system", f"Call transferred to human agent ({target_number})."
        )

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Transferring your call to a representative.</Say>
    <Dial>{target_number}</Dial>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


@router.post("/hangup")
async def handle_call_hangup(call_id: str):
    session_manager.end_session(call_id)
    telephony = provider_manager.get_telephony_provider()
    await telephony.terminate_call(call_id)
    return {
        "status": "success",
        "call_id": call_id,
        "message": "Call terminated successfully",
    }
