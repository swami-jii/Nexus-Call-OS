"""
Android GSM Gateway API Router
Nexus Call OS v2.4 Enterprise

Exposes /api/android-gateway endpoints for QR code pairing token generation,
pairing exchange, device management, auto-answer toggles, and authenticated live audio streaming.
"""

import secrets
import logging
from typing import Optional, Dict, Any
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    Query,
    Header,
)
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.auth.deps import get_current_user
from backend.models.models import User
from backend.android_gateway.pairing_manager import PairingManager
from backend.android_gateway.device_registry import DeviceRegistry
from backend.android_gateway.device_health_monitor import DeviceHealthMonitor
from backend.android_gateway.android_websocket_bridge import AndroidWebSocketBridgeServer

logger = logging.getLogger("NexusAndroidRouter")

router = APIRouter(prefix="/api/android-gateway", tags=["Android GSM Gateway"])

_device_registry = DeviceRegistry()
_pairing_manager = PairingManager()
_health_monitor = DeviceHealthMonitor(_device_registry)
_ws_bridge_server = AndroidWebSocketBridgeServer(_device_registry)


class GeneratePairingTokenRequest(BaseModel):
    label: str = "Android Companion Phone"
    workspace_id: Optional[str] = "default-workspace"


class ExchangePairingTokenRequest(BaseModel):
    pairing_token: str
    signature: str
    device_id: str
    name: str = "Android Companion"
    device_type: str = "android"
    sim_number: Optional[str] = "+91 98765 43210"
    carrier_name: Optional[str] = "Cellular SIM"
    os_version: Optional[str] = "Android 14"


class SetAutoAnswerRequest(BaseModel):
    device_id: str
    auto_answer: bool


class RenameDeviceRequest(BaseModel):
    device_id: str
    new_name: str


class RegisterMobileDeviceRequest(BaseModel):
    device_id: str
    name: str
    device_type: str = "android"
    sim_number: Optional[str] = "+91 98765 43210"
    carrier_name: Optional[str] = "Cellular SIM"
    os_version: Optional[str] = "Android / iOS"
    battery_level: Optional[int] = 95
    is_charging: Optional[bool] = True
    network_type: Optional[str] = "5G / WiFi"
    signal_dbm: Optional[int] = -70
    latency_ms: Optional[int] = 18


class QuickConnectDeviceRequest(BaseModel):
    device_id: Optional[str] = "android-dev-primary"
    name: Optional[str] = "Pixel 8 Pro (Primary GSM)"
    sim_number: Optional[str] = "+91 98765 43210"
    carrier_name: Optional[str] = "Jio 5G / Airtel"


class DisconnectDeviceRequest(BaseModel):
    device_id: str


@router.post("/pair/generate-token")
async def generate_pairing_token(
    req: GeneratePairingTokenRequest,
    current_user: User = Depends(get_current_user),
):
    """Generates a single-use HMAC pairing token bound to the caller's organization."""
    org_id = current_user.organization_id or "default-org"
    res = _pairing_manager.generate_pairing_token(
        organization_id=org_id,
        workspace_id=req.workspace_id or "default-workspace",
        label=req.label,
    )
    return {"status": "success", "pairing_data": res}


@router.post("/pair/exchange")
async def exchange_pairing_token(req: ExchangePairingTokenRequest):
    """Exchanges a one-time pairing token & signature for a persistent device_token."""
    token_data = _pairing_manager.consume_pairing_token(req.pairing_token, req.signature)
    if not token_data:
        raise HTTPException(
            status_code=400,
            detail="Invalid, expired, or already consumed pairing token signature",
        )

    org_id = token_data.get("organization_id")
    workspace_id = token_data.get("workspace_id")

    # Generate persistent cryptographically secure device secret token
    device_token = f"nxs_dev_{secrets.token_hex(24)}"

    # Register and persist companion device in DB
    device = _device_registry.register_device(
        device_id=req.device_id,
        name=req.name,
        sim_number=req.sim_number or "+91 98765 43210",
        carrier_name=req.carrier_name or "Cellular SIM",
        os_version=req.os_version or "Android 14",
        device_type=req.device_type,
        organization_id=org_id,
        workspace_id=workspace_id,
        device_token=device_token,
    )

    logger.info(
        f"[DevicePairing] Device {req.device_id} ({req.name}) successfully paired to org {org_id}!"
    )

    return {
        "status": "paired",
        "device_id": req.device_id,
        "device_token": device_token,
        "organization_id": org_id,
        "workspace_id": workspace_id,
        "ws_url": "/api/android-gateway/ws/bridge",
        "device": device.to_dict(),
    }


@router.post("/devices/quick-connect")
async def quick_connect_device_endpoint(
    req: QuickConnectDeviceRequest,
    current_user: User = Depends(get_current_user),
):
    """Instantly connects and activates a virtual or real companion gateway."""
    org_id = current_user.organization_id or "default-org"
    dev = _device_registry.quick_connect_device(
        device_id=req.device_id or "android-dev-primary",
        name=req.name or "Pixel 8 Pro (Primary GSM)",
        sim_number=req.sim_number or "+91 98765 43210",
        carrier_name=req.carrier_name or "Jio 5G / Airtel",
        organization_id=org_id,
    )
    return {
        "status": "success",
        "message": "Device connected successfully",
        "device": dev.to_dict(),
    }


@router.get("/download/{platform}")
async def download_gateway_client(platform: str):
    """Download native installation packages."""
    clean_platform = platform.lower().strip()
    root_dir = Path(__file__).resolve().parent.parent.parent
    downloads_dir = root_dir / "public" / "downloads"
    apk_file = downloads_dir / "Nexus-GSM-Gateway-v2.4.apk"
    ios_file = downloads_dir / "Nexus-iOS-Companion-Xcode.zip"
    mac_file = downloads_dir / "Nexus-macOS-Companion.zip"
    win_file = downloads_dir / "Nexus-Windows-Companion.zip"
    zip_file = downloads_dir / "Nexus-Android-Companion-Source.zip"

    if clean_platform in ["android", "apk"]:
        if apk_file.exists():
            return FileResponse(
                path=str(apk_file),
                filename="Nexus-GSM-Gateway-v2.4.apk",
                media_type="application/vnd.android.package-archive",
            )
        debug_apk = root_dir / "apps" / "android" / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"
        if debug_apk.exists():
            return FileResponse(
                path=str(debug_apk),
                filename="Nexus-GSM-Gateway-v2.4.apk",
                media_type="application/vnd.android.package-archive",
            )
        raise HTTPException(status_code=404, detail="Android APK package not found.")
    elif clean_platform in ["ios", "iphone", "apple"]:
        if ios_file.exists():
            return FileResponse(
                path=str(ios_file),
                filename="Nexus-iOS-Companion-Xcode.zip",
                media_type="application/zip",
            )
    elif clean_platform in ["mac", "macos", "dmg"]:
        if mac_file.exists():
            return FileResponse(
                path=str(mac_file),
                filename="Nexus-macOS-Companion.zip",
                media_type="application/zip",
            )
    elif clean_platform in ["win", "windows", "exe"]:
        if win_file.exists():
            return FileResponse(
                path=str(win_file),
                filename="Nexus-Windows-Companion.zip",
                media_type="application/zip",
            )
    elif clean_platform in ["source", "zip", "project"]:
        if zip_file.exists():
            return FileResponse(
                path=str(zip_file),
                filename="Nexus-Android-Companion-Source.zip",
                media_type="application/zip",
            )
    return {"status": "success", "message": f"Installer package ready for {platform}"}


@router.post("/devices/register")
async def register_mobile_device(
    req: RegisterMobileDeviceRequest,
    current_user: User = Depends(get_current_user),
):
    """Registers or updates a mobile device with tenant association."""
    org_id = current_user.organization_id or "default-org"
    device = _device_registry.get_device(req.device_id)
    if not device:
        device = _device_registry.register_device(
            device_id=req.device_id,
            name=req.name,
            sim_number=req.sim_number or "+91 98765 43210",
            carrier_name=req.carrier_name or "Cellular SIM",
            os_version=req.os_version or "Mobile Gateway",
            device_type=req.device_type,
            organization_id=org_id,
        )
    device.update_telemetry(
        battery_level=req.battery_level,
        is_charging=req.is_charging,
        signal_dbm=req.signal_dbm,
        network_type=req.network_type,
        latency_ms=req.latency_ms,
    )
    return {"status": "success", "device": device.to_dict()}


@router.post("/devices/disconnect")
async def disconnect_mobile_device(req: DisconnectDeviceRequest):
    """Marks a device as offline."""
    _device_registry.disconnect_device(req.device_id)
    _ws_bridge_server.disconnect(req.device_id)
    return {"status": "success", "message": f"Device {req.device_id} disconnected"}


@router.get("/devices")
async def list_paired_devices(
    current_user: User = Depends(get_current_user),
):
    """Returns all paired companion devices filtered by caller organization."""
    org_id = current_user.organization_id if current_user else None
    return {
        "status": "success",
        "devices": _device_registry.list_devices(organization_id=org_id),
    }


@router.post("/devices/auto-answer")
async def set_auto_answer(
    req: SetAutoAnswerRequest,
    current_user: User = Depends(get_current_user),
):
    """Toggle auto-answer state for a companion device."""
    success = _device_registry.set_auto_answer(req.device_id, req.auto_answer)
    if not success:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"status": "success", "device_id": req.device_id, "auto_answer": req.auto_answer}


@router.post("/devices/rename")
async def rename_device(
    req: RenameDeviceRequest,
    current_user: User = Depends(get_current_user),
):
    """Rename a paired companion device."""
    success = _device_registry.rename_device(req.device_id, req.new_name)
    if not success:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"status": "success", "device_id": req.device_id, "name": req.new_name}


@router.post("/devices/{device_id}/disconnect")
async def disconnect_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
):
    """Disconnect an active companion device."""
    _device_registry.disconnect_device(device_id)
    _ws_bridge_server.disconnect(device_id)
    return {"status": "success", "device_id": device_id}


@router.get("/health")
async def get_gateway_health(
    current_user: User = Depends(get_current_user),
):
    """Returns gateway health metrics and OEM battery guidance."""
    return _health_monitor.get_gateway_health_telemetry()


@router.websocket("/ws/bridge")
async def android_websocket_bridge(
    websocket: WebSocket,
    device_id: str = Query("android-primary"),
    token: Optional[str] = Query(None),
):
    """WebSocket Bridge Endpoint for Companion Devices with Authentication."""
    connected = await _ws_bridge_server.connect(device_id, websocket, device_token=token)
    if not connected:
        return

    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break
            if "bytes" in message and message["bytes"]:
                await _ws_bridge_server.handle_incoming_message(device_id, message["bytes"])
            elif "text" in message and message["text"]:
                res = await _ws_bridge_server.handle_incoming_message(device_id, message["text"])
                if res:
                    await websocket.send_json(res)
    except (WebSocketDisconnect, RuntimeError, Exception):
        pass
    finally:
        _ws_bridge_server.disconnect(device_id)


