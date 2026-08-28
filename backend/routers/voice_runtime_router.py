from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from backend.auth.deps import get_current_user
from backend.engine.voice_runtime import CallState, voice_runtime_engine
from backend.models.models import User

router = APIRouter(
    prefix="/api/voice-runtime", tags=["Enterprise Voice Runtime Engine"]
)


class StateTransitionRequest(BaseModel):
    call_id: str
    new_state: CallState


class JobEnqueueRequest(BaseModel):
    task_type: str
    payload: Dict[str, Any]


class RecordingMetaDataRequest(BaseModel):
    call_id: str
    duration_seconds: float
    provider: str
    transcript_snippet: str
    cost_usd: float


@router.get("/telemetry")
def get_runtime_telemetry(
    current_user: User = Depends(get_current_user),
):
    return voice_runtime_engine.get_telemetry_metrics()


@router.post("/state-transition")
def transition_call_state(
    req: StateTransitionRequest,
    current_user: User = Depends(get_current_user),
):
    final_state = voice_runtime_engine.transition_state(req.call_id, req.new_state)
    return {
        "status": "success",
        "call_id": req.call_id,
        "current_state": final_state.value,
    }


@router.post("/jobs/enqueue")
def enqueue_background_job(
    req: JobEnqueueRequest,
    current_user: User = Depends(get_current_user),
):
    job = voice_runtime_engine.job_engine.enqueue(req.task_type, req.payload)
    processed = voice_runtime_engine.job_engine.process_next()
    return {
        "status": "queued",
        "job_id": job.job_id,
        "processed_status": processed.status if processed else "pending",
    }


@router.get("/events")
def get_event_bus_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    return {
        "events": voice_runtime_engine.event_bus.get_history(limit=limit),
        "total_recorded": len(voice_runtime_engine.event_bus._event_history),
    }


@router.post("/recordings")
def save_call_recording(
    req: RecordingMetaDataRequest,
    current_user: User = Depends(get_current_user),
):
    rec = voice_runtime_engine.record_call_metadata(
        call_id=req.call_id,
        duration_sec=req.duration_seconds,
        provider=req.provider,
        transcript_snippet=req.transcript_snippet,
        cost_usd=req.cost_usd,
    )
    return {"status": "saved", "recording": rec}
