"""
API Router for Live Media Bridge Subsystem
Exposes /api/media-bridge endpoints for 20ms audio frame processing, barge-in flushing, and stream telemetry.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.auth.deps import get_current_user
from backend.models.models import User
from backend.media_bridge.bridge_runtime import LiveMediaBridgeRuntime

router = APIRouter(prefix="/api/media-bridge", tags=["Live Media Bridge Subsystem"])

# Global Live Media Bridge Instance
_media_bridge = LiveMediaBridgeRuntime()


class CreateBridgeSessionRequest(BaseModel):
    session_id: str
    codec: str = "pcm"
    sample_rate: int = 8000


class AudioChunkRequest(BaseModel):
    session_id: str
    raw_pcm_hex: str  # Hex-encoded PCM payload


@router.post("/sessions/create")
async def create_bridge_session(
    req: CreateBridgeSessionRequest,
    current_user: User = Depends(get_current_user),
):
    res = _media_bridge.create_bridge_session(
        session_id=req.session_id,
        codec=req.codec,
        sample_rate=req.sample_rate,
    )
    return {"status": "success", "result": res}


@router.post("/stream/chunk")
async def process_stream_chunk(
    req: AudioChunkRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        raw_pcm_bytes = bytes.fromhex(req.raw_pcm_hex)
    except ValueError:
        raw_pcm_bytes = b"\x00" * 320

    res = _media_bridge.process_inbound_stream_chunk(req.session_id, raw_pcm_bytes)
    return {"status": "success", "result": res}


@router.post("/stream/{session_id}/flush")
async def flush_stream_queue(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    res = _media_bridge.trigger_bargein_flush(session_id)
    return {"status": "success", "result": res}


@router.post("/sessions/{session_id}/close")
async def close_bridge_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    res = _media_bridge.close_bridge_session(session_id)
    return {"status": "success", "result": res}


@router.get("/telemetry")
async def get_bridge_telemetry(
    current_user: User = Depends(get_current_user),
):
    return {"status": "success", "telemetry": _media_bridge.get_telemetry()}


@router.get("/health")
async def media_bridge_health():
    return {
        "subsystem": "Live Media Bridge",
        "status": "online",
        "active_streams": len(_media_bridge.stream_manager.get_all_streams()),
        "target_latency_ms": _media_bridge.latency_controller.target_latency_ms,
        "version": "2.4.0",
    }
