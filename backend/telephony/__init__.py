"""
Universal Telephony Gateway Subsystem
Nexus Call OS v2.4 Enterprise

Provider-agnostic single entry point for incoming and outgoing phone calls.
Decouples carrier transport protocols (Twilio, Plivo, Exotel, SignalWire, SIP, LiveKit, WebRTC) from Core AI Logic.
"""

from backend.telephony.audio_buffer import JitterBuffer
from backend.telephony.audio_stream import AudioStreamPipeline
from backend.telephony.call_router import CallRouter
from backend.telephony.call_session import CallSession
from backend.telephony.codec_manager import CodecManager, TelephonyCodec
from backend.telephony.event_dispatcher import TelephonyEventDispatcher
from backend.telephony.interfaces import ITelephonyProvider, TelephonyCallStatus, TelephonyDirection
from backend.telephony.provider_manager import GenericTelephonyAdapter, ProviderManager
from backend.telephony.provider_registry import TelephonyProviderRegistry, TelephonyProviderType
from backend.telephony.runtime import UniversalTelephonyGateway
from backend.telephony.session_manager import SessionManager
from backend.telephony.telephony_events import TelephonyEvent, TelephonyEventType
from backend.telephony.telephony_metrics import TelephonyMetricsCollector

__all__ = [
    "UniversalTelephonyGateway",
    "ITelephonyProvider",
    "GenericTelephonyAdapter",
    "TelephonyDirection",
    "TelephonyCallStatus",
    "TelephonyCodec",
    "CodecManager",
    "TelephonyEventType",
    "TelephonyEvent",
    "TelephonyEventDispatcher",
    "TelephonyMetricsCollector",
    "CallSession",
    "SessionManager",
    "CallRouter",
    "TelephonyProviderType",
    "TelephonyProviderRegistry",
    "ProviderManager",
    "JitterBuffer",
    "AudioStreamPipeline",
]
