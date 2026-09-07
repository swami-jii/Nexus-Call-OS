"""
Android GSM Companion Telephony Adapter
Nexus Call OS v2.4 Enterprise

Implements ITelephonyProvider to plug the Companion App directly into
the Universal Telephony Gateway as a real-time duplex voice stream adapter.
"""

import time
import logging
from typing import Any, Dict, Optional
from backend.telephony.interfaces import ITelephonyProvider, TelephonyCallStatus

logger = logging.getLogger("NexusAndroidAdapter")


def _get_gateway_deps():
    from backend.routers.android_gateway_router import _ws_bridge_server, _device_registry
    return _ws_bridge_server, _device_registry


class AndroidCompanionProviderAdapter(ITelephonyProvider):
    """Adapter bridging native Android companion app to the Universal Telephony Gateway."""

    def __init__(self, session_id: str):
        super().__init__(session_id=session_id, provider_name="android_companion")
        self.call_status = TelephonyCallStatus.INITIATED
        self.device_id: Optional[str] = None

    async def connect(self, connection_params: Dict[str, Any]) -> bool:
        self.device_id = connection_params.get("device_id", "android-primary")
        ws_bridge, dev_registry = _get_gateway_deps()
        
        # Verify device exists and is online
        dev = dev_registry.get_device(self.device_id)
        if not dev:
            logger.warning(f"[AndroidAdapter] Device {self.device_id} not found in registry")
            return False

        self.is_connected = True
        self.call_status = TelephonyCallStatus.IN_PROGRESS
        dev.active_session_id = self.session_id
        
        # If destination phone number is provided, command Android phone to dial via configured SIM
        phone_number = connection_params.get("phone_number")
        if phone_number:
            ws = ws_bridge._active_connections.get(self.device_id)
            if ws:
                try:
                    await ws.send_json({
                        "event": "OUTGOING_CALL",
                        "session_id": self.session_id,
                        "phone_number": phone_number,
                        "subscription_id": dev.selected_sub_id,
                    })
                except Exception as e:
                    logger.warning(f"Error sending OUTGOING_CALL to companion: {e}")

        logger.info(f"[AndroidAdapter] Session {self.session_id} connected to companion {self.device_id}")
        return True

    async def disconnect(self, reason: str = "normal_clearing") -> bool:
        self.is_connected = False
        self.call_status = TelephonyCallStatus.COMPLETED
        if self.device_id:
            ws_bridge, dev_registry = _get_gateway_deps()
            dev = dev_registry.get_device(self.device_id)
            if dev and dev.active_session_id == self.session_id:
                dev.active_session_id = None
        return True

    async def answer_call(self) -> bool:
        self.call_status = TelephonyCallStatus.IN_PROGRESS
        if self.device_id:
            ws_bridge, dev_registry = _get_gateway_deps()
            ws = ws_bridge._active_connections.get(self.device_id)
            if ws:
                try:
                    await ws.send_json({"event": "ANSWER", "session_id": self.session_id})
                except Exception as e:
                    logger.warning(f"Error sending ANSWER to companion: {e}")
        return True

    async def hangup(self, reason: str = "normal_clearing") -> bool:
        self.is_connected = False
        self.call_status = TelephonyCallStatus.COMPLETED
        if self.device_id:
            ws_bridge, dev_registry = _get_gateway_deps()
            ws = ws_bridge._active_connections.get(self.device_id)
            if ws:
                try:
                    await ws.send_json({"event": "HANGUP", "session_id": self.session_id, "reason": reason})
                except Exception as e:
                    logger.warning(f"Error sending HANGUP to companion: {e}")
            dev = dev_registry.get_device(self.device_id)
            if dev and dev.active_session_id == self.session_id:
                dev.active_session_id = None
        return True

    async def mute(self) -> bool:
        self.is_muted = True
        return True

    async def unmute(self) -> bool:
        self.is_muted = False
        return True

    async def send_audio(self, pcm_payload: bytes, sample_rate: int = 16000) -> bool:
        """Streams outbound AI speech PCM payload to companion device AudioTrack."""
        if not self.device_id or not self.is_connected:
            return False
        ws_bridge, dev_registry = _get_gateway_deps()
        return await ws_bridge.send_audio_frame(self.device_id, pcm_payload)

    async def receive_audio(self) -> Optional[bytes]:
        """Pops the oldest inbound PCM audio frame received from companion microphone."""
        if not self.device_id:
            return None
        ws_bridge, dev_registry = _get_gateway_deps()
        buffer = ws_bridge._audio_buffers.get(self.device_id)
        if buffer and len(buffer) > 0:
            return buffer.pop(0)
        return None

    async def send_dtmf(self, digits: str) -> bool:
        if self.device_id:
            ws_bridge, dev_registry = _get_gateway_deps()
            ws = ws_bridge._active_connections.get(self.device_id)
            if ws:
                try:
                    await ws.send_json({"event": "DTMF", "session_id": self.session_id, "digits": digits})
                    return True
                except Exception:
                    return False
        return True

    async def hold(self) -> bool:
        self.is_on_hold = True
        return True

    async def resume(self) -> bool:
        self.is_on_hold = False
        return True

    async def transfer(self, target_number: str) -> bool:
        return True

