"""
System Logs & Telemetry Stream Router
Create Call OS v2.4 Enterprise

Provides REST and WebSocket endpoints for real-time terminal log inspection,
searching, filtering, and live event streaming with strict multi-tenant user isolation.
"""

import asyncio
from datetime import datetime, timezone
import random
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Header, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from backend.auth.deps import (
    ensure_super_admin_exists,
    get_current_user_optional,
    get_effective_org_id,
)
from backend.core.security import decode_token
from backend.database.session import SessionLocal, get_db
from backend.models.models import User
from backend.utils.live_logger import live_log_hub

router = APIRouter(prefix="/api/logs", tags=["System Logs & Telemetry"])


@router.get("")
def get_logs(
    limit: int = Query(200, ge=1, le=1000),
    level: Optional[str] = Query("ALL"),
    component: Optional[str] = Query("ALL"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_target_organization_id: Optional[str] = Header(None, alias="X-Target-Organization-Id"),
):
    """Fetch buffered realtime system logs isolated to the authenticated user's organization."""
    effective_user = current_user or ensure_super_admin_exists(db)
    org_id = get_effective_org_id(effective_user, x_target_organization_id)
    logs = live_log_hub.get_logs(
        organization_id=org_id,
        limit=limit,
        level=level,
        component=component,
        search=search,
        db=db,
    )
    return {
        "status": "success",
        "total_count": len(logs),
        "organization_id": org_id,
        "buffer_capacity": live_log_hub.max_capacity,
        "active_subscribers": live_log_hub.active_subscribers_count,
        "logs": logs,
    }


@router.delete("")
def clear_logs(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_target_organization_id: Optional[str] = Header(None, alias="X-Target-Organization-Id"),
):
    """Clear the in-memory terminal log buffer for current user's organization."""
    effective_user = current_user or ensure_super_admin_exists(db)
    org_id = get_effective_org_id(effective_user, x_target_organization_id)
    live_log_hub.clear(organization_id=org_id)
    operator = effective_user.full_name or effective_user.email or "Administrator"
    entry = live_log_hub.add_log(
        level="INFO",
        component="SYSTEM_CORE",
        message=f"Terminal execution log buffer cleared by {operator}.",
        organization_id=org_id,
    )
    return {"status": "cleared", "message": "Log buffer successfully cleared.", "log": entry.to_dict()}


@router.post("/simulate")
def simulate_telemetry_event(
    payload: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_target_organization_id: Optional[str] = Header(None, alias="X-Target-Organization-Id"),
):
    """Simulates an authentic live telephony / RAG / conversation telemetry event isolated to the tenant."""
    effective_user = current_user or ensure_super_admin_exists(db)
    org_id = get_effective_org_id(effective_user, x_target_organization_id)

    sample_components = [
        ("SIP_TELEPHONY", "INFO", "Outbound SIP Call initiated to +91 98765 43210 via carrier primary trunk (Codec: G.711u)."),
        ("CONVERSATION_ENGINE", "INFO", "Turn #3: Floor owner acquired by ASSISTANT | Language: hi-IN | Latency: 18ms."),
        ("VOICE_PIPELINE", "INFO", "Deepgram STT completed streaming turn (Duration: 340ms, Confidence: 0.98)."),
        ("AUDIO_BRIDGE", "DEBUG", "PCM 20ms Frame synchronized with jitter buffer (Delay: 1.2ms)."),
        ("RAG_ENGINE", "INFO", "Vector Similarity Search retrieved 3 chunks from Knowledge Collection (Score: 0.94)."),
        ("GSM_GATEWAY", "INFO", "Native GSM Companion Node signal: 5G (4/4 bars) - Battery: 92%."),
        ("SECURITY_POLICY", "WARN", "PII Redaction filter masked credit card sequence in caller utterance."),
        ("CONVERSATION_ENGINE", "INFO", "Acoustic SSML Humanizer injected micro-pause (150ms) and acknowledgment filler."),
    ]
    comp, lvl, msg = random.choice(sample_components)

    if payload and payload.get("message"):
        msg = payload["message"]
        lvl = payload.get("level", lvl)
        comp = payload.get("component", comp)

    entry = live_log_hub.add_log(
        level=lvl,
        component=comp,
        message=msg,
        organization_id=org_id,
        user_id=str(effective_user.id) if effective_user else None,
    )
    return {"status": "simulated", "log": entry.to_dict()}


# Standalone WebSocket router for root /ws/logs mount
ws_logs_router = APIRouter()


@ws_logs_router.websocket("/ws/logs")
async def websocket_logs_stream(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    org_id: Optional[str] = Query(None),
):
    """Real-time WebSocket endpoint pushing live system logs scoped to tenant organization."""
    await websocket.accept()

    # Resolve organization_id from token if provided
    resolved_org_id: Optional[str] = org_id
    if token:
        try:
            payload = decode_token(token)
            if payload and payload.get("sub"):
                with SessionLocal() as db:
                    u = db.query(User).filter(User.id == str(payload["sub"])).first()
                    if u and u.organization_id:
                        resolved_org_id = org_id or u.organization_id
        except Exception:
            pass

    q = live_log_hub.register_subscriber(organization_id=resolved_org_id)

    try:
        with SessionLocal() as db:
            recent_logs = live_log_hub.get_logs(organization_id=resolved_org_id, limit=50, db=db)
        await websocket.send_json({
            "type": "INITIAL_HISTORY",
            "count": len(recent_logs),
            "organization_id": resolved_org_id,
            "logs": recent_logs,
        })

        # Continuously stream new incoming log entries for this tenant
        while True:
            try:
                log_entry = await asyncio.wait_for(q.get(), timeout=15.0)
                await websocket.send_json({
                    "type": "LOG_EVENT",
                    "log": log_entry,
                })
            except asyncio.TimeoutError:
                # Send periodic heartbeat keep-alive
                await websocket.send_json({
                    "type": "HEARTBEAT",
                    "timestamp": datetime.now(timezone.utc).strftime("%I:%M:%S %p"),
                    "buffer_size": live_log_hub.tenant_count(resolved_org_id),
                })
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        live_log_hub.unregister_subscriber(q)
