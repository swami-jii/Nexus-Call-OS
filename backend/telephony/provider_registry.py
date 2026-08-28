"""
Provider Registry Module
Nexus Call OS v2.4 Enterprise

Master registry of supported telephony provider types and capability metadata.
"""

from enum import Enum
from typing import Dict, Any, List


class TelephonyProviderType(str, Enum):
    TWILIO = "twilio"
    PLIVO = "plivo"
    EXOTEL = "exotel"
    KNOWLARITY = "knowlarity"
    SIGNALWIRE = "signalwire"
    LIVEKIT = "livekit"
    SIP = "generic_sip"
    ANDROID_COMPANION = "android_companion"
    WEBRTC = "webrtc"
    LOCAL_GSM = "local_gsm"
    SIMULATED = "simulated"


class TelephonyProviderRegistry:
    """Provider registry catalog exposing carrier capabilities."""

    CATALOG: Dict[TelephonyProviderType, Dict[str, Any]] = {
        TelephonyProviderType.TWILIO: {"name": "Twilio Programmable Voice", "supports_media_streams": True, "codecs": ["g711_mulaw", "pcm"]},
        TelephonyProviderType.PLIVO: {"name": "Plivo Voice API", "supports_media_streams": True, "codecs": ["g711_alaw", "g711_mulaw"]},
        TelephonyProviderType.EXOTEL: {"name": "Exotel Cloud Telephony", "supports_media_streams": True, "codecs": ["g711_alaw"]},
        TelephonyProviderType.KNOWLARITY: {"name": "Knowlarity Voice", "supports_media_streams": False, "codecs": ["g711_alaw"]},
        TelephonyProviderType.SIGNALWIRE: {"name": "SignalWire Communications", "supports_media_streams": True, "codecs": ["g711_mulaw", "opus"]},
        TelephonyProviderType.LIVEKIT: {"name": "LiveKit Realtime WebRTC", "supports_media_streams": True, "codecs": ["opus", "pcm"]},
        TelephonyProviderType.SIP: {"name": "Generic SIP Trunking", "supports_media_streams": True, "codecs": ["g711_mulaw", "g711_alaw", "opus"]},
        TelephonyProviderType.ANDROID_COMPANION: {"name": "Android GSM Gateway", "supports_media_streams": True, "codecs": ["pcm", "g711_alaw"]},
        TelephonyProviderType.WEBRTC: {"name": "Direct WebRTC Browser Gateway", "supports_media_streams": True, "codecs": ["opus", "pcm"]},
        TelephonyProviderType.LOCAL_GSM: {"name": "Local Hardware GSM Gateway", "supports_media_streams": True, "codecs": ["g711_alaw"]},
        TelephonyProviderType.SIMULATED: {"name": "Local Telephony Simulator", "supports_media_streams": True, "codecs": ["pcm"]},
    }

    @staticmethod
    def get_provider_info(provider_type: TelephonyProviderType) -> Dict[str, Any]:
        return TelephonyProviderRegistry.CATALOG.get(provider_type, {"name": provider_type.value, "supports_media_streams": True, "codecs": ["pcm"]})

    @staticmethod
    def get_all_providers() -> List[Dict[str, Any]]:
        return [{"id": k.value, **v} for k, v in TelephonyProviderRegistry.CATALOG.items()]
