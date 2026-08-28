from typing import Any

from sqlalchemy.orm import Session

from backend.integrations.deepgram_provider import DeepgramProvider
from backend.integrations.elevenlabs_provider import ElevenLabsProvider
from backend.integrations.interfaces import (
    LLMProviderInterface,
    STTProviderInterface,
    TelephonyProviderInterface,
    TTSProviderInterface,
)
from backend.integrations.llm_provider import GeminiProvider, OpenAIProvider
from backend.integrations.twilio_provider import TwilioProvider
from backend.models.models import Integration


class ProviderManager:
    """
    Central Manager for Voice OS Provider Layer.
    Allows seamless switching between Telephony, TTS, STT, and LLM providers.
    Fetches credentials directly from the Integrations database module.
    """

    def __init__(self):
        # Default Active Providers
        self._telephony_provider: TelephonyProviderInterface = TwilioProvider()
        self._tts_provider: TTSProviderInterface = ElevenLabsProvider()
        self._stt_provider: STTProviderInterface = DeepgramProvider()
        self._llm_provider: LLMProviderInterface = GeminiProvider()

    def sync_from_database(self, db: Session, org_id: Any = None):
        """Sync providers using DB Integrations credentials."""
        query = db.query(Integration)
        if org_id:
            query = query.filter(Integration.organization_id == org_id)
        integrations = query.all()

        for item in integrations:
            provider_type = (item.provider or "").strip().lower()
            raw_conf = getattr(item, "config_json", {}) or {}
            conf: dict[str, Any] = raw_conf if isinstance(raw_conf, dict) else {}
            status = item.status or "Connected"

            if status != "Connected":
                continue

            # Twilio Telephony
            if "twilio" in provider_type:
                account_sid = conf.get("account_sid") or conf.get("api_key")
                auth_token = conf.get("auth_token") or conf.get("secret")
                from_num = conf.get("from_number")
                self._telephony_provider = TwilioProvider(
                    account_sid=account_sid,
                    auth_token=auth_token,
                    default_from=from_num,
                )

            # ElevenLabs TTS
            elif "elevenlabs" in provider_type or "tts" in provider_type:
                api_key = conf.get("api_key") or conf.get("key")
                self._tts_provider = ElevenLabsProvider(api_key=api_key)

            # Deepgram STT
            elif "deepgram" in provider_type or "stt" in provider_type:
                api_key = conf.get("api_key") or conf.get("key")
                self._stt_provider = DeepgramProvider(api_key=api_key)

            # Gemini LLM
            elif "gemini" in provider_type or "google" in provider_type:
                api_key = conf.get("api_key") or conf.get("key")
                model = conf.get("model")
                self._llm_provider = GeminiProvider(api_key=api_key, model=model)

            # OpenAI LLM
            elif "openai" in provider_type:
                api_key = conf.get("api_key") or conf.get("key")
                model = conf.get("model")
                self._llm_provider = OpenAIProvider(api_key=api_key, model=model)

    def set_telephony_provider(self, provider: TelephonyProviderInterface):
        self._telephony_provider = provider

    def set_tts_provider(self, provider: TTSProviderInterface):
        self._tts_provider = provider

    def set_stt_provider(self, provider: STTProviderInterface):
        self._stt_provider = provider

    def set_llm_provider(self, provider: LLMProviderInterface):
        self._llm_provider = provider

    def get_telephony_provider(self) -> TelephonyProviderInterface:
        return self._telephony_provider

    def get_tts_provider(self) -> TTSProviderInterface:
        return self._tts_provider

    def get_stt_provider(self) -> STTProviderInterface:
        return self._stt_provider

    def get_llm_provider(self) -> LLMProviderInterface:
        return self._llm_provider

    async def get_all_provider_health(self) -> dict[str, Any]:
        """Perform health checks across all configured voice providers."""
        return {
            "telephony": await self._telephony_provider.health_check(),
            "tts": await self._tts_provider.health_check(),
            "stt": await self._stt_provider.health_check(),
            "llm": await self._llm_provider.health_check(),
        }


# Global Provider Manager Singleton Instance
provider_manager = ProviderManager()
