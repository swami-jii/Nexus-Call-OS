import time
from dataclasses import dataclass, field
from typing import Any


@dataclass
class CallSession:
    call_id: str
    stream_sid: str | None = None
    agent_id: str | None = None
    agent_name: str = "Nexus Voice Assistant"
    to_number: str = ""
    from_number: str = ""
    direction: str = "outbound"
    status: str = "initiating"
    speaker_status: str = "idle"
    transcript: list[dict[str, Any]] = field(default_factory=list)
    conversation_history: list[dict[str, str]] = field(default_factory=list)
    provider_states: dict[str, Any] = field(
        default_factory=lambda: {
            "telephony": "Twilio",
            "stt": "Deepgram",
            "tts": "ElevenLabs",
            "llm": "Gemini",
        }
    )
    latency_ms: dict[str, float] = field(
        default_factory=lambda: {
            "stt_latency": 120.0,
            "llm_first_token": 350.0,
            "tts_latency": 180.0,
            "total_pipeline": 650.0,
        }
    )
    tokens_used: int = 0
    cost_usd: float = 0.00
    audio_quality_score: float = 4.8
    is_interrupted: bool = False
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)

    def add_transcript(self, speaker: str, text: str):
        entry = {
            "speaker": speaker,
            "text": text,
            "timestamp": time.strftime("%H:%M:%S"),
        }
        self.transcript.append(entry)
        role = "user" if speaker == "user" else "assistant"
        self.conversation_history.append({"role": role, "content": text})
        self.updated_at = time.time()

    def set_speaking_status(self, status: str):
        self.speaker_status = status
        self.updated_at = time.time()

    def update_metrics(
        self, tokens: int = 0, cost: float = 0.0, pipeline_latency: float = 0.0
    ):
        from backend.engine.cost_tracker import CostTracker

        self.tokens_used += tokens
        duration_sec = time.time() - self.created_at
        tts_chars = sum(
            len(t.get("text", ""))
            for t in self.transcript
            if t.get("speaker") == "ai"
        )
        calculated = CostTracker.calculate_call_cost(
            duration_seconds=duration_sec,
            llm_provider=self.provider_states.get("llm", "Gemini"),
            llm_tokens=self.tokens_used,
            tts_chars=tts_chars,
        )
        self.cost_usd = calculated["total_cost"]
        if pipeline_latency > 0:
            self.latency_ms["total_pipeline"] = round(pipeline_latency, 2)
        self.updated_at = time.time()

    def to_dict(self) -> dict[str, Any]:
        duration_sec = int(time.time() - self.created_at)
        return {
            "call_id": self.call_id,
            "stream_sid": self.stream_sid,
            "agent_id": self.agent_id,
            "agent_name": self.agent_name,
            "to_number": self.to_number,
            "from_number": self.from_number,
            "direction": self.direction,
            "status": self.status,
            "speaker_status": self.speaker_status,
            "duration_seconds": duration_sec,
            "transcript": self.transcript,
            "conversation_history": self.conversation_history,
            "provider_states": self.provider_states,
            "latency_ms": self.latency_ms,
            "tokens_used": self.tokens_used,
            "cost_usd": round(self.cost_usd, 4),
            "audio_quality_score": self.audio_quality_score,
            "is_interrupted": self.is_interrupted,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class LiveCallSessionManager:
    """Production-ready Manager for Active Real-time Call Sessions."""

    def __init__(self):
        self._sessions: dict[str, CallSession] = {}

    def create_session(
        self,
        call_id: str,
        to_number: str = "",
        from_number: str = "",
        agent_id: str | None = None,
        direction: str = "outbound",
    ) -> CallSession:
        session = CallSession(
            call_id=call_id,
            to_number=to_number,
            from_number=from_number,
            agent_id=agent_id,
            direction=direction,
        )
        self._sessions[call_id] = session
        return session

    def get_session(self, call_id: str) -> CallSession | None:
        return self._sessions.get(call_id)

    def list_sessions(self) -> list[dict[str, Any]]:
        return [session.to_dict() for session in self._sessions.values()]

    def end_session(self, call_id: str) -> CallSession | None:
        session = self._sessions.get(call_id)
        if session:
            session.status = "completed"
            session.updated_at = time.time()
        return session

    def remove_session(self, call_id: str):
        if call_id in self._sessions:
            del self._sessions[call_id]


# Global Live Call Session Manager Singleton
session_manager = LiveCallSessionManager()
