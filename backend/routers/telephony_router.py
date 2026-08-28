"""
API Router for Universal Telephony Gateway Subsystem
Exposes /api/telephony endpoints for carrier session control, call dispatch, and stream telemetry.
"""

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.auth.deps import get_current_user
from backend.models.models import User
from backend.telephony.runtime import UniversalTelephonyGateway

router = APIRouter(prefix="/api/telephony", tags=["Universal Telephony Gateway Subsystem"])

# Global Telephony Gateway Instance
_telephony_gateway = UniversalTelephonyGateway()


class InitiateCallRequest(BaseModel):
    session_id: str
    phone_number: str
    provider_name: str = "simulated"
    direction: str = "outbound"
    agent_id: Optional[str] = None


class DTMFRequest(BaseModel):
    digits: str


class TransferRequest(BaseModel):
    target_number: str


@router.post("/calls/initiate")
async def initiate_telephony_call(
    req: InitiateCallRequest,
    current_user: User = Depends(get_current_user),
):
    res = await _telephony_gateway.initiate_call(
        session_id=req.session_id,
        phone_number=req.phone_number,
        provider_name=req.provider_name,
        direction=req.direction,
        agent_id=req.agent_id,
    )
    return {"status": "success", "result": res}


@router.post("/calls/{session_id}/hangup")
async def hangup_telephony_call(
    session_id: str,
    reason: str = "normal_clearing",
    current_user: User = Depends(get_current_user),
):
    res = await _telephony_gateway.end_call(session_id, reason=reason)
    return {"status": "success", "result": res}


@router.post("/calls/{session_id}/dtmf")
async def send_dtmf(
    session_id: str,
    req: DTMFRequest,
    current_user: User = Depends(get_current_user),
):
    res = await _telephony_gateway.send_dtmf_digit(session_id, req.digits)
    return {"status": "success", "result": res}


@router.post("/calls/{session_id}/hold")
async def hold_call(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    res = await _telephony_gateway.hold_call(session_id)
    return {"status": "success", "result": res}


@router.post("/calls/{session_id}/resume")
async def resume_call(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    res = await _telephony_gateway.resume_call(session_id)
    return {"status": "success", "result": res}


@router.post("/calls/{session_id}/transfer")
async def transfer_call(
    session_id: str,
    req: TransferRequest,
    current_user: User = Depends(get_current_user),
):
    res = await _telephony_gateway.transfer_call(session_id, req.target_number)
    return {"status": "success", "result": res}


@router.get("/sessions")
async def list_active_sessions(
    current_user: User = Depends(get_current_user),
):
    return {"status": "success", "telemetry": _telephony_gateway.get_telemetry()}


@router.get("/providers")
async def list_supported_providers():
    return {"status": "success", "providers": _telephony_gateway.get_telemetry()["supported_providers"]}


@router.get("/health")
async def telephony_gateway_health():
    return {
        "subsystem": "Universal Telephony Gateway",
        "status": "online",
        "active_calls": _telephony_gateway.session_manager.get_active_sessions_count(),
        "version": "2.4.0",
    }
