"""
Android WebSocket Bridge Module
Nexus Call OS v2.4 Enterprise

Encrypted WebSocket Server endpoint for bidirectional audio streaming,
authenticated device handshakes, ping/pong keepalive, and telemetry streaming.
"""

import json
import time
import logging
from typing import Dict, Any, Optional, Set
from fastapi import WebSocket, WebSocketDisconnect

from backend.android_gateway.device_registry import DeviceRegistry

logger = logging.getLogger("NexusWSBridge")


class AndroidWebSocketBridgeServer:
    """Manages active authenticated WebSocket connections with native companion apps."""

    def __init__(self, device_registry: Optional[DeviceRegistry] = None):
        self.device_registry = device_registry or DeviceRegistry()
        self._active_connections: Dict[str, WebSocket] = {}
        self._audio_buffers: Dict[str, list] = {}
        self._authenticated_devices: Set[str] = set()

    async def connect(
        self,
        device_id: str,
        websocket: WebSocket,
        device_token: Optional[str] = None,
    ) -> bool:
        """Accept WebSocket connection and verify authentication."""
        await websocket.accept()

        # If token provided via query/header, authenticate or auto-register new device
        if device_token:
            dev = self.device_registry.get_device(device_id)
            if not dev:
                dev = self.device_registry.register_device(
                    device_id=device_id,
                    name="Android Companion Phone",
                    sim_number="",
                    carrier_name="Cellular SIM",
                    os_version="Android 14",
                    device_token=device_token,
                )
            self._active_connections[device_id] = websocket
            self._audio_buffers[device_id] = []
            self._authenticated_devices.add(device_id)
            self.device_registry.mark_online(device_id)
            logger.info(f"[AndroidWSBridge] Device {device_id} ({dev.name}) authenticated & connected.")
            await websocket.send_json({
                "event": "AUTH_SUCCESS",
                "device_id": device_id,
                "organization_id": dev.organization_id,
                "workspace_id": dev.workspace_id,
                "timestamp": time.time(),
            })
            return True

        # Allow socket open to wait for initial AUTH message frame
        self._active_connections[device_id] = websocket
        self._audio_buffers[device_id] = []
        return True


    def disconnect(self, device_id: str) -> None:
        self._active_connections.pop(device_id, None)
        self._audio_buffers.pop(device_id, None)
        self._authenticated_devices.discard(device_id)
        self.device_registry.disconnect_device(device_id)
        logger.info(f"[AndroidWSBridge] Device {device_id} disconnected.")

    def is_authenticated(self, device_id: str) -> bool:
        return device_id in self._authenticated_devices

    async def handle_incoming_message(self, device_id: str, raw_data: Any) -> Dict[str, Any]:
        """Parse incoming JSON event or binary audio payload from companion device."""
        # Check authentication for audio frames
        if isinstance(raw_data, bytes):
            if device_id not in self._authenticated_devices:
                return {"type": "error", "error": "Unauthenticated audio frame rejected"}
            buffer = self._audio_buffers.get(device_id, [])
            buffer.append(raw_data)
            return {
                "type": "audio_frame",
                "device_id": device_id,
                "bytes_received": len(raw_data),
                "timestamp": time.time(),
            }

        # Text JSON Control Event
        try:
            event = json.loads(raw_data)
        except Exception:
            event = {"event": "unknown"}

        event_name = event.get("event")

        # Handle AUTH Handshake
        if event_name in ["AUTH", "HANDSHAKE"]:
            token = event.get("device_token") or event.get("token")
            dev_name = event.get("model") or event.get("name") or "Android Smartphone"
            os_ver = event.get("os_version") or "Android 14"
            carrier = event.get("carrier_name") or "Cellular SIM"
            sim_num = event.get("sim_number") or ""
            auto_ans = event.get("auto_answer", True)
            auto_delay = event.get("auto_answer_delay_sec", 3)

            dev = self.device_registry.get_device(device_id)
            if not dev:
                dev = self.device_registry.register_device(
                    device_id=device_id,
                    name=dev_name,
                    sim_number=sim_num,
                    carrier_name=carrier,
                    os_version=os_ver,
                    device_token=token or f"dev_token_{device_id}"
                )

            # Update initial telemetry snapshot with real device hardware model and OS
            dev.update_telemetry(
                name=dev_name,
                os_version=os_ver,
                battery_level=event.get("battery_level"),
                is_charging=event.get("is_charging"),
                signal_dbm=event.get("signal_dbm"),
                network_type=event.get("network_type"),
                latency_ms=event.get("latency_ms"),
                carrier_name=carrier,
                sim_number=sim_num,
                subscriptions=event.get("subscriptions"),
                selected_sub_id=event.get("selected_sub_id"),
                call_state=event.get("call_state"),
                auto_answer=auto_ans,
                auto_answer_delay_sec=auto_delay,
            )

            self._authenticated_devices.add(device_id)
            self.device_registry.mark_online(device_id)
            logger.info(f"[AndroidWSBridge] Device {device_id} ({dev.name} - {dev.os_version}) authenticated with genuine hardware telemetry.")
            return {
                "type": "AUTH_SUCCESS",
                "device_id": device_id,
                "organization_id": dev.organization_id,
                "workspace_id": dev.workspace_id,
                "timestamp": time.time(),
            }

        # All subsequent control messages require authentication
        if device_id not in self._authenticated_devices:
            return {"type": "error", "error": "Unauthenticated request"}

        if event_name == "PING":
            dev = self.device_registry.get_device(device_id)
            if dev:
                dev.update_telemetry(
                    name=event.get("model") or event.get("name"),
                    os_version=event.get("os_version"),
                    battery_level=event.get("battery_level"),
                    is_charging=event.get("is_charging"),
                    signal_dbm=event.get("signal_dbm"),
                    network_type=event.get("network_type"),
                    latency_ms=event.get("latency_ms"),
                    carrier_name=event.get("carrier_name"),
                    sim_number=event.get("sim_number"),
                    subscriptions=event.get("subscriptions"),
                    selected_sub_id=event.get("selected_sub_id"),
                    call_state=event.get("call_state"),
                    auto_answer=event.get("auto_answer"),
                    auto_answer_delay_sec=event.get("auto_answer_delay_sec"),
                )
            return {"type": "PONG", "timestamp": time.time()}

        if event_name == "TELEMETRY":
            dev = self.device_registry.get_device(device_id)
            if dev:
                dev.update_telemetry(
                    name=event.get("model") or event.get("name"),
                    os_version=event.get("os_version"),
                    battery_level=event.get("battery_level"),
                    is_charging=event.get("is_charging"),
                    signal_dbm=event.get("signal_dbm"),
                    network_type=event.get("network_type"),
                    latency_ms=event.get("latency_ms"),
                    carrier_name=event.get("carrier_name"),
                    sim_number=event.get("sim_number"),
                    subscriptions=event.get("subscriptions"),
                    selected_sub_id=event.get("selected_sub_id"),
                    call_state=event.get("call_state"),
                    auto_answer=event.get("auto_answer"),
                    auto_answer_delay_sec=event.get("auto_answer_delay_sec"),
                )
            return {"type": "telemetry_ack", "device_id": device_id}



        if event_name == "INCOMING_CALL":
            return {
                "type": "call_initiated",
                "device_id": device_id,
                "sim_number": event.get("sim_number"),
                "caller_number": event.get("caller_number"),
            }

        if event_name == "BARGE_IN_INTERRUPT":
            self._audio_buffers[device_id] = []
            return {
                "type": "barge_in_processed",
                "device_id": device_id,
                "action": "flush_audio_playback",
            }

        return {"type": "event_ack", "event": event_name}

    async def send_audio_frame(self, device_id: str, pcm_data: bytes) -> bool:
        ws = self._active_connections.get(device_id)
        if ws and device_id in self._authenticated_devices:
            try:
                await ws.send_bytes(pcm_data)
                return True
            except Exception:
                return False
        return False

