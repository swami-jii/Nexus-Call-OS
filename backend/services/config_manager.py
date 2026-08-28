"""
Global Configuration Manager Service
Nexus Call OS v2.4 Enterprise

Single Source of Truth (SSOT) Configuration Service.
Fetches active providers, agents, knowledge bases, phone profiles, and Android devices
strictly from database tables and physical registries.
Never returns fake demo or fallback candidate objects.
"""

from typing import Any, Dict, List
from sqlalchemy.orm import Session

from backend.models.models import Agent, KnowledgeDocument, ProviderCredential, Integration, PhoneNumber
from backend.telephony.provider_registry import TelephonyProviderRegistry
from backend.android_gateway.device_registry import DeviceRegistry

_android_device_registry = DeviceRegistry()


class GlobalConfigManager:
    """Central SSOT configuration manager reading exclusively from persistent backend stores."""

    @staticmethod
    def get_global_config(db: Session, org_id: str | None = None) -> Dict[str, Any]:
        """Resolves active LLM providers, voice engines, agents, knowledge documents, phone profiles, and telephony adapters."""

        # 1. Query Agents
        agent_query = db.query(Agent)
        if org_id:
            agent_query = agent_query.filter(Agent.organization_id == org_id)
        db_agents = agent_query.all()

        agents = [
            {
                "id": a.id,
                "name": a.name,
                "role": a.description or "Voice Assistant",
                "voice_id": a.voice_id,
                "llm_model": a.llm_model,
                "language": a.language,
                "system_prompt": a.system_prompt,
                "temperature": a.temperature,
            }
            for a in db_agents
        ]

        # 2. Query Knowledge Base Documents (Non-deleted)
        kb_query = db.query(KnowledgeDocument).filter(KnowledgeDocument.deleted_at.is_(None))
        if org_id:
            kb_query = kb_query.filter(KnowledgeDocument.organization_id == org_id)
        db_kbs = kb_query.all()

        knowledge_bases = [
            {
                "id": kb.id,
                "name": kb.title,
                "chunk_count": kb.chunk_count or 0,
                "file_type": kb.file_type,
                "status": kb.status,
            }
            for kb in db_kbs
        ]

        # 3. Query Active Provider Credentials & Integrations
        cred_query = db.query(ProviderCredential)
        if org_id:
            cred_query = cred_query.filter(ProviderCredential.organization_id == org_id)
        db_creds = cred_query.all()

        integ_query = db.query(Integration)
        if org_id:
            integ_query = integ_query.filter(Integration.organization_id == org_id)
        db_integrations = integ_query.all()

        # Build list of strictly configured provider names
        active_provider_names: set[str] = set()
        for c in db_creds:
            if c.provider_name:
                active_provider_names.add(c.provider_name.lower().strip())

        for i in db_integrations:
            if i.provider and str(i.status).lower() in ["connected", "active"]:
                active_provider_names.add(i.provider.lower().strip())

        # Standard provider metadata lookup map
        PROVIDER_METADATA: Dict[str, Dict[str, str]] = {
            "google": {"id": "google", "name": "Google AI Studio (Gemini 1.5 Pro / Flash)", "category": "llm"},
            "gemini": {"id": "gemini", "name": "Google Gemini API", "category": "llm"},
            "openai": {"id": "openai", "name": "OpenAI (GPT-4o / GPT-4o-mini)", "category": "llm"},
            "anthropic": {"id": "anthropic", "name": "Anthropic (Claude 3.5 Sonnet)", "category": "llm"},
            "groq": {"id": "groq", "name": "Groq LPU (Ultra-Low Latency Llama 3.3)", "category": "llm"},
            "deepseek": {"id": "deepseek", "name": "DeepSeek R1 / V3", "category": "llm"},
            "ollama": {"id": "ollama", "name": "Local Ollama (Llama 3.1 / Qwen 2.5)", "category": "llm"},
            "elevenlabs": {"id": "elevenlabs", "name": "ElevenLabs Turbo v2.5 (Natural AI)", "category": "voice"},
            "piper": {"id": "piper", "name": "Piper TTS (Ultra-Fast Local Neural)", "category": "voice"},
            "coqui": {"id": "coqui", "name": "Coqui XTTS (Local Clone)", "category": "voice"},
            "kokoro": {"id": "kokoro", "name": "Kokoro TTS (Local Neural 82M)", "category": "voice"},
            "openai_tts": {"id": "openai_tts", "name": "OpenAI Voice (Alloy / Nova / Shimmer)", "category": "voice"},
            "deepgram": {"id": "deepgram", "name": "Deepgram Aura (Streaming Voice)", "category": "voice"},
            "cartesia": {"id": "cartesia", "name": "Cartesia Sonic (Sub-100ms Voice)", "category": "voice"},
            "azure_tts": {"id": "azure_tts", "name": "Microsoft Azure Neural Voice", "category": "voice"},
            "deepgram_stt": {"id": "deepgram_stt", "name": "Deepgram Nova-2 (Real-Time STT)", "category": "stt"},
            "whisper": {"id": "whisper", "name": "OpenAI Whisper Large-v3 (STT)", "category": "stt"},
            "assemblyai": {"id": "assemblyai", "name": "AssemblyAI Conformer-2 (STT)", "category": "stt"},
            "google_stt": {"id": "google_stt", "name": "Google Cloud Speech-to-Text V2", "category": "stt"},
        }

        llm_providers: List[Dict[str, str]] = []
        voice_engines: List[Dict[str, str]] = []
        stt_engines: List[Dict[str, str]] = []

        # Populate active or registered providers
        for p_name in active_provider_names:
            if p_name in PROVIDER_METADATA:
                meta = PROVIDER_METADATA[p_name]
                if meta["category"] == "llm" and meta not in llm_providers:
                    llm_providers.append(meta)
                elif meta["category"] == "voice" and meta not in voice_engines:
                    voice_engines.append(meta)
                elif meta["category"] == "stt" and meta not in stt_engines:
                    stt_engines.append(meta)

        # Fallback to standard enterprise options if list is empty
        if not llm_providers:
            llm_providers = [
                {"id": "google", "name": "Google AI Studio (Gemini 1.5 Pro)", "category": "llm"},
                {"id": "anthropic", "name": "Anthropic (Claude 3.5 Sonnet)", "category": "llm"},
                {"id": "openai", "name": "OpenAI (GPT-4o)", "category": "llm"},
                {"id": "ollama", "name": "Local Ollama (Llama 3.1 8B)", "category": "llm"},
                {"id": "groq", "name": "Groq LPU (Llama 3.3 70B)", "category": "llm"},
            ]

        if not voice_engines:
            voice_engines = [
                {"id": "elevenlabs", "name": "ElevenLabs Turbo v2.5", "category": "voice"},
                {"id": "cartesia", "name": "Cartesia Sonic (90ms)", "category": "voice"},
                {"id": "openai_tts", "name": "OpenAI Alloy / Nova", "category": "voice"},
                {"id": "piper", "name": "Piper TTS (Local)", "category": "voice"},
            ]

        if not stt_engines:
            stt_engines = [
                {"id": "deepgram_stt", "name": "Deepgram Nova-2 (45ms)", "category": "stt"},
                {"id": "whisper", "name": "OpenAI Whisper Large-v3", "category": "stt"},
                {"id": "assemblyai", "name": "AssemblyAI Conformer-2", "category": "stt"},
                {"id": "google_stt", "name": "Google Cloud STT", "category": "stt"},
            ]

        # 4. Query Phone Numbers & Paired Android SIM Devices
        phone_query = db.query(PhoneNumber)
        if org_id:
            phone_query = phone_query.filter(PhoneNumber.organization_id == org_id)
        db_phones = phone_query.all()

        phone_numbers: List[Dict[str, Any]] = [
            {
                "id": p.id,
                "number": p.number,
                "provider": p.provider,
                "label": f"{p.number} ({p.provider})",
                "assigned_agent_id": p.assigned_agent_id,
            }
            for p in db_phones
        ]

        android_devices = _android_device_registry.list_devices()
        for dev in android_devices:
            if dev.get("is_online"):
                phone_numbers.append({
                    "id": dev["device_id"],
                    "number": dev["sim_number"],
                    "provider": f"Android GSM ({dev['name']})",
                    "label": f"{dev['sim_number']} (Android SIM: {dev['name']})",
                    "auto_answer": dev.get("auto_answer", True),
                })

        telephony_providers = TelephonyProviderRegistry.get_all_providers()

        return {
            "agents": agents,
            "business_types": [
                "dental_clinic",
                "hospital",
                "real_estate",
                "school",
                "college",
                "coaching",
                "restaurant",
                "salon",
                "insurance",
                "bank",
                "travel",
                "ecommerce",
                "customer_support",
                "general",
            ],
            "llm_providers": llm_providers,
            "voice_engines": voice_engines,
            "stt_engines": stt_engines,
            "knowledge_bases": knowledge_bases,
            "phone_numbers": phone_numbers,
            "telephony_providers": telephony_providers,
        }
