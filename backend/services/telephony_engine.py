import base64
import json
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple
import httpx
from sqlalchemy.orm import Session

from backend.services.live_knowledge_service import LiveKnowledgeService

RECORDINGS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "recordings")
)
os.makedirs(RECORDINGS_DIR, exist_ok=True)


class TelephonyCallingEngine:
    """
    Enterprise Full-Duplex Telephony Calling Engine.
    Dynamically routes to whichever LLM provider and model is active in API & Integrations.
    """

    @classmethod
    def build_telephony_system_prompt(
        cls,
        agent_name: str,
        business_type: str,
        configured_language: str = "Auto-Detect",
        custom_instructions: str = "",
        session_memory_context: str = "",
        active_model: str = "",
    ) -> str:
        """
        Builds a universal cognitive telephony system prompt for all 104+ languages.
        Instructs the active LLM to autonomously manage turn-taking, multilingual mirroring,
        real-time live world knowledge, session memory retention, and zero-repetition dialogue.
        """
        # Sanitize business type to remove any internal metadata words like SSOT, Rule, etc.
        clean_biz = str(business_type or "Customer Support & Inquiries")
        clean_biz = re.sub(r'(?i)\b(ssot\s*rule|ssot|rule\s*\d*|rule|workspace\s*rule|config\s*rule)\b', '', clean_biz).strip()
        if not clean_biz:
            clean_biz = "Customer Support & Inquiries"

        # Fetch 0ms live date, time, and day of week context
        dt = LiveKnowledgeService.get_live_datetime_context()

        model_ctx_line = f"ACTIVE ENGINE: {active_model} (Create Call Voice AI Platform)" if active_model else "ACTIVE ENGINE: Create Call Voice AI Platform"

        prompt = f"""You are {agent_name}, a friendly, warm, intelligent live human telephone receptionist for {clean_biz}.

CONFIGURED BASE LANGUAGE: {configured_language}
{model_ctx_line}
REAL-TIME CLOCK CONTEXT: Current time is {dt['current_time']} on {dt['day_of_week']}, {dt['current_date']} ({dt['timezone']}).

CRITICAL TELEPHONY COGNITIVE INSTRUCTIONS (104+ GLOBAL LANGUAGES):
1. STRAIGHT-FORWARD & CONCISE (JITNA QUESTION UTNA JAWAB):
   - Answer the caller's specific question or statement immediately and directly in 1 short, complete spoken sentence (under 15-20 words).
   - NEVER append repetitive robotic closing phrases like "Kya main aapki kisi aur tarah se madad kar sakta hoon?" or "How may I help you today?" at the end of every answer. Answer the question directly and stop so the caller can speak.
2. SELF-IDENTITY & ZERO HALLUCINATED BRANDS:
   - You are {agent_name} representing {clean_biz}.
   - If asked who you are or what model/system you use, answer directly: "Main {agent_name} bol rahi hoon, {clean_biz} se."
   - NEVER claim you are ChatGPT, OpenAI, GPT-4, or another third-party product.
3. REAL HUMAN PERSONA & ZERO REPETITION:
   - The opening greeting has ALREADY been given at call initiation.
   - NEVER repeat greetings or re-introduce yourself unless specifically asked.
   - NEVER recite technical jargon, database identifiers, internal codes, or developer notes.
4. ACTIVE CONVERSATIONAL MEMORY RETENTION:
   - Retain and actively use all facts provided by the caller earlier in this call (e.g. caller name, symptoms, appointment slots, preferences).
   - Address the caller politely by their name once they share it.
5. MULTILINGUAL MIRRORING & DYNAMIC LANGUAGE ADAPTATION (104+ GLOBAL LANGUAGES):
   - You fluently understand and speak 104+ global languages (Hindi, English, Tamil, Telugu, Spanish, French, German, Japanese, Arabic, Bengali, Marathi, Punjabi, Gujarati, etc.).
   - ALWAYS detect the exact language or dialect the caller is speaking in their current turn and respond naturally in the EXACT SAME language.
   - If the caller speaks Hindi -> reply in Hindi. If English -> reply in English. If Tamil -> reply in Tamil. If French -> reply in French. If German -> reply in German.
   - If the caller switches languages mid-call, switch INSTANTLY to their new spoken language.
6. NO FORMATTING:
   - NEVER use markdown bold (**), italic (*), hashtags (#), bullet points, numbered lists, XML/SSML tags, or emojis. Output plain spoken text only.
7. AUTONOMOUS CALL WRAP-UP & TERMINATION ([HANGUP]):
   - If the caller indicates they have no more questions, are satisfied, wish to end the call, ask to hang up, or say goodbye in ANY language:
     * Respond with a polite, warm closing farewell wishing them well in their language.
     * Append '[HANGUP]' at the very end of your response so the call gracefully disconnects."""

        if session_memory_context and session_memory_context.strip():
            prompt += f"\n\n{session_memory_context.strip()}"

        if custom_instructions and custom_instructions.strip():
            prompt += f"\n\nAGENT SPECIFIC KNOWLEDGE & INSTRUCTIONS:\n{custom_instructions.strip()}"

        return prompt

    @classmethod
    def extract_hangup_signal(cls, ai_response_text: str) -> Tuple[str, bool]:
        """
        Extracts the [HANGUP] signal token from the LLM completion.
        Returns clean speech text (with signal stripped) and should_hangup boolean.
        """
        if not ai_response_text:
            return "", False

        text = ai_response_text.strip()
        should_hangup = False

        if "[HANGUP]" in text or "[hangup]" in text.lower():
            should_hangup = True
            text = re.sub(r'\[hangup\]', '', text, flags=re.IGNORECASE).strip()

        # Clean any remaining technical tokens or markdown
        text = re.sub(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', '', text)
        text = re.sub(r'\b[0-9a-fA-F]{12,}\b', '', text)
        text = re.sub(r'[*#_`]', '', text)
        text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
        text = re.sub(r'^[-\*\•\d\.]+\s+', '', text, flags=re.MULTILINE)
        clean_speech_text = " ".join(text.split()).strip()

        return clean_speech_text, should_hangup

    @classmethod
    async def call_active_llm(
        cls,
        provider: str,
        api_key: str,
        model_id: str,
        system_prompt: str,
        conversation_history: List[Dict[str, str]],
        base_url: Optional[str] = None,
    ) -> Optional[str]:
        """
        Universal telephony LLM invoker delegating directly to the centralized DynamicLLMInvoker SSOT.
        Zero hardcoded provider branching, zero manual URLs.
        """
        if not api_key:
            return None

        from backend.routers.knowledge_base import DynamicLLMInvoker

        config = {
            "provider": provider,
            "api_key": api_key,
            "model": model_id,
            "base_url": base_url,
        }
        res = await DynamicLLMInvoker.call_conversation_llm_async(
            system_prompt=system_prompt,
            conversation_history=conversation_history,
            config=config,
            max_tokens=150,
            temperature=0.35,
        )
        return res.get("text") if res else None

    @classmethod
    def save_call_recording(
        cls,
        call_id: str,
        dual_channel_b64: Optional[str] = None,
        audio_turns: Optional[List[str]] = None,
    ) -> tuple[str, str]:
        """
        Saves dual-channel or multi-turn call recording to disk as a WebM or MP3 audio file.
        Returns (recording_url, recording_base64).
        """
        raw_bytes = b""
        is_webm = False
        if dual_channel_b64 and len(dual_channel_b64) > 100:
            try:
                clean_b64 = dual_channel_b64.split(",")[-1]
                raw_bytes = base64.b64decode(clean_b64)
                if raw_bytes.startswith(b"\x1a\x45\xdf\xa3") or "webm" in str(dual_channel_b64[:40]).lower():
                    is_webm = True
            except Exception as e:
                print(f"[TelephonyEngine] Dual-channel decode error: {e}")

        if not raw_bytes and audio_turns:
            try:
                raw_bytes = b"".join([base64.b64decode(chunk.split(",")[-1]) for chunk in audio_turns if chunk])
                is_webm = False
            except Exception as e:
                print(f"[TelephonyEngine] Audio turns stitching error: {e}")

        ext = "webm" if is_webm else "mp3"
        rec_filename = f"{call_id}.{ext}"
        rec_filepath = os.path.join(RECORDINGS_DIR, rec_filename)

        if raw_bytes:
            try:
                with open(rec_filepath, "wb") as f:
                    f.write(raw_bytes)
            except Exception as e:
                print(f"[TelephonyEngine] Recording disk save error: {e}")

        recording_url = f"/api/demo/recordings/{rec_filename}"
        recording_b64 = base64.b64encode(raw_bytes).decode("utf-8") if raw_bytes else ""
        return recording_url, recording_b64

    @classmethod
    def parse_carrier_rate(cls, rate_str: Any) -> float:
        """
        Dynamically extracts and parses numeric rate from string, number, or database metadata.
        Returns float value without any hardcoded assumptions.
        """
        if rate_str is None:
            return 0.0
        if isinstance(rate_str, (int, float)):
            return float(rate_str)
        s = str(rate_str).strip()
        if not s or any(k in s.lower() for k in ["free", "trial", "zero", "unlimited", "flat"]):
            return 0.0
        digits = re.findall(r"[\d\.]+", s)
        if digits:
            try:
                return float(digits[0])
            except ValueError:
                pass
        return 0.0

    @classmethod
    def resolve_carrier_rate(
        cls,
        db: Optional[Session],
        org_id: Optional[str] = None,
        call_mode: str = "carrier",
        carrier_name: Optional[str] = None,
        carrier_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Dynamically resolves active carrier pricing and metadata directly from the ProviderCredential SSOT.
        Zero hardcoded carrier names or rates.
        """
        if call_mode in ["mic", "web_mic", "browser_mic"]:
            return {
                "carrier_name": "WebRTC Real-Time Audio (Zero Carrier Cost)",
                "cost_per_min": 0.0,
                "pricing_mode": "Zero-Cost Local WebRTC",
                "inbound_cost": 0.0,
                "currency": "USD",
            }

        # Query ProviderCredential for active carrier / gateway from API & Integrations SSOT
        matched_cred = None
        if db:
            from backend.models.models import ProviderCredential
            cats = ["telephony_providers", "telephony_carriers", "sip_providers", "sip_trunks"]
            if call_mode in ["android_gsm", "gsm", "sim"]:
                cats = ["gsm_gateways", "telephony_providers"]

            query = db.query(ProviderCredential).filter(ProviderCredential.category.in_(cats))
            if org_id:
                query = query.filter((ProviderCredential.organization_id == org_id) | (ProviderCredential.organization_id == None))

            creds = query.all()
            if carrier_id:
                for c in creds:
                    if c.id == carrier_id:
                        matched_cred = c
                        break
            if not matched_cred and carrier_name:
                c_clean = carrier_name.lower().strip()
                for c in creds:
                    disp = (c.display_name or "").lower()
                    p_name = (c.provider_name or "").lower()
                    if c_clean in disp or c_clean in p_name or disp in c_clean:
                        matched_cred = c
                        break
            if not matched_cred and creds:
                matched_cred = creds[0]

        if matched_cred:
            meta = {}
            if matched_cred.metadata_json:
                try:
                    meta = json.loads(matched_cred.metadata_json) if isinstance(matched_cred.metadata_json, str) else matched_cred.metadata_json
                except Exception:
                    meta = {}

            cost_str = meta.get("cost_per_min") or meta.get("rate") or meta.get("outbound_cost") or "0.0"
            rate = cls.parse_carrier_rate(cost_str)
            disp_name = matched_cred.display_name or matched_cred.provider_name or carrier_name or "Active Connected Carrier"
            inbound_str = meta.get("inbound_cost") or meta.get("inbound_rate") or "0.0"

            return {
                "carrier_id": matched_cred.id,
                "carrier_name": disp_name,
                "cost_per_min": rate,
                "raw_rate_str": str(cost_str),
                "pricing_mode": meta.get("pricing_mode", "Active"),
                "inbound_cost": cls.parse_carrier_rate(inbound_str),
                "billing_interval": meta.get("billing_interval", "Dynamic"),
                "currency": meta.get("currency", "USD"),
            }

        return {
            "carrier_name": carrier_name or "Connected Carrier",
            "cost_per_min": 0.0,
            "raw_rate_str": "$0.00",
            "pricing_mode": "Dynamic",
            "inbound_cost": 0.0,
            "currency": "USD",
        }

    @classmethod
    def calculate_dynamic_call_cost(
        cls,
        db: Optional[Session],
        org_id: Optional[str],
        duration_seconds: float,
        call_mode: str = "mic",
        carrier_name: Optional[str] = None,
        carrier_id: Optional[str] = None,
        carrier_cost_per_min: Optional[float] = None,
        llm_tokens: int = 0,
        tts_chars: int = 0,
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Dynamically calculates exact call cost factoring active Telephony Carrier rate,
        LLM token consumption, and Neural TTS characters directly from API & Integrations SSOT.
        """
        dur_sec = max(0, float(duration_seconds or 0))
        minutes = dur_sec / 60.0

        carrier_info = cls.resolve_carrier_rate(
            db=db,
            org_id=org_id,
            call_mode=call_mode,
            carrier_name=carrier_name,
            carrier_id=carrier_id,
        )

        effective_rate = carrier_cost_per_min if carrier_cost_per_min is not None else carrier_info["cost_per_min"]
        telephony_cost = round(minutes * effective_rate, 4)

        # Dynamic LLM & TTS compute rates from DB SSOT
        llm_rate_per_1k = 0.0
        tts_rate_per_1k = 0.0
        if db:
            from backend.models.models import ProviderCredential
            try:
                llm_c = db.query(ProviderCredential).filter(ProviderCredential.category == "llm").first()
                if llm_c and llm_c.metadata_json:
                    meta = json.loads(llm_c.metadata_json) if isinstance(llm_c.metadata_json, str) else llm_c.metadata_json
                    llm_rate_per_1k = cls.parse_carrier_rate(meta.get("cost_per_1k_tokens") or meta.get("rate") or 0.00015)
                else:
                    llm_rate_per_1k = 0.00015

                tts_c = db.query(ProviderCredential).filter(ProviderCredential.category == "voice_synthesizers").first()
                if tts_c and tts_c.metadata_json:
                    meta = json.loads(tts_c.metadata_json) if isinstance(tts_c.metadata_json, str) else tts_c.metadata_json
                    tts_rate_per_1k = cls.parse_carrier_rate(meta.get("cost_per_1k_chars") or meta.get("rate") or 0.015)
                else:
                    tts_rate_per_1k = 0.015
            except Exception:
                llm_rate_per_1k = 0.00015
                tts_rate_per_1k = 0.015

        llm_cost = round((llm_tokens / 1000.0) * llm_rate_per_1k, 5) if llm_tokens > 0 else 0.0
        tts_cost = round((tts_chars / 1000.0) * tts_rate_per_1k, 5) if tts_chars > 0 else 0.0

        total_cost = round(telephony_cost + (0.0 if call_mode in ["mic", "web_mic", "browser_mic"] and dur_sec <= 3 else (llm_cost + tts_cost)), 4)
        if call_mode in ["mic", "web_mic", "browser_mic"]:
            total_cost = round(llm_cost + tts_cost, 4)

        breakdown = {
            "telephony_carrier_cost": telephony_cost,
            "carrier_name": carrier_info.get("carrier_name", "WebRTC Audio"),
            "rate_per_min": effective_rate,
            "currency": carrier_info.get("currency", "USD"),
            "llm_cost": llm_cost,
            "tts_cost": tts_cost,
            "total_cost": total_cost,
            "duration_seconds": dur_sec,
        }

        return total_cost, breakdown
