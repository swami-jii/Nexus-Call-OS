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
        catalog_summary = LiveKnowledgeService.get_catalog_categories_summary()

        prompt = f"""You are {agent_name}, a friendly, warm, intelligent live human telephone receptionist for {clean_biz}.

CONFIGURED BASE LANGUAGE: {configured_language}
REAL-TIME CLOCK CONTEXT: Current time is {dt['current_time']} on {dt['day_of_week']}, {dt['current_date']} ({dt['timezone']}).
UNIVERSAL PUBLIC APIS KNOWLEDGE BASE: {catalog_summary}

CRITICAL TELEPHONY COGNITIVE INSTRUCTIONS (104+ GLOBAL LANGUAGES):
1. REAL HUMAN PERSONA & ZERO REPETITION: Speak naturally and warmly like a live human receptionist.
   - The opening greeting has ALREADY been given at call initiation.
   - NEVER repeat greetings, re-introduce your identity, or repeat opening questions in subsequent turns.
   - Answer the caller's specific statement or question directly, conversationally, and smartly.
   - NEVER recite technical jargon, database identifiers, internal codes, or developer notes.
   - NEVER generate filler turns or start talking by yourself without caller speech.
2. ACTIVE CONVERSATIONAL MEMORY RETENTION:
   - Retain and actively use all facts provided by the caller earlier in this call (e.g. caller name, symptoms, appointment slots, preferences).
   - NEVER re-ask for details the caller already told you. Address the caller politely by their name once they share it.
3. MULTILINGUAL MIRRORING: You fluently understand and speak 104+ global languages and cultural dialects. Always detect the caller's spoken language and reply in the EXACT SAME language and conversational tone naturally.
4. ULTRA-CONCISE VOICE CADENCE & PAUSE (STRICT 1 SHORT SENTENCE, 10-18 WORDS MAX):
   - This is a fast live phone call. You MUST reply in ONLY 1 short conversational sentence (maximum 10 to 18 words).
   - NEVER give long explanations, bullet points, or multiple sentences.
   - Always STOP speaking immediately after 1 short sentence so the caller has the floor to respond.
5. REAL-TIME LIVE KNOWLEDGE & POLITE PIVOT:
   - If the caller asks general real-world questions (e.g., current time, today's weather, currency rates, general facts), answer helpfully and accurately in 1 short spoken sentence.
   - Guide the conversation naturally toward assisting them with {clean_biz} without sounding robotic or repeating the exact same pitch line over and over.
   - NEVER refuse the caller or say "I cannot tell you the weather/time". Always be helpful, warm, and guide the conversation gracefully.
6. NO FORMATTING: NEVER use markdown bold (**), italic (*), hashtags (#), bullet points, numbered lists, XML/SSML tags, or emojis. Output plain spoken text only.
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
        Universal invoker that routes to the user's active configured LLM provider & model.
        Supports Google Gemini, OpenAI, Anthropic, Groq, DeepSeek, OpenRouter, Mistral, Ollama.
        """
        if not api_key:
            return None

        prov = (provider or "google").lower().strip()
        mod = (model_id or "").strip()

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                # 1. Google Gemini
                if prov in ["google", "gemini", "google_ai_studio"]:
                    active_model = mod if mod and mod not in ["dynamic", "default", "Auto-Optimized"] else "gemini-2.5-flash"
                    active_model = active_model.replace("models/", "")

                    contents = []
                    for msg in conversation_history:
                        role = "user" if msg.get("role") in ["user", "caller", "human"] else "model"
                        txt = msg.get("text", "").strip()
                        if txt:
                            if contents and contents[-1]["role"] == role:
                                contents[-1]["parts"][0]["text"] += f"\n{txt}"
                            else:
                                contents.append({"role": role, "parts": [{"text": txt}]})

                    if not contents:
                        return None
                    if contents[0]["role"] != "user":
                        contents.insert(0, {"role": "user", "parts": [{"text": "Hello"}]})

                    # Try configured model, and gracefully fallback to available flash models if rate limited
                    model_attempts = [active_model]
                    for alt_m in ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"]:
                        if alt_m not in model_attempts:
                            model_attempts.append(alt_m)

                    for m_try in model_attempts:
                        res = await client.post(
                            f"https://generativelanguage.googleapis.com/v1beta/models/{m_try}:generateContent?key={api_key}",
                            headers={"Content-Type": "application/json"},
                            json={
                                "systemInstruction": {"parts": [{"text": system_prompt}]},
                                "contents": contents,
                                "generationConfig": {"temperature": 0.35, "maxOutputTokens": 50},
                            },
                        )
                        if res.status_code == 200:
                            data = res.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts:
                                    return parts[0].get("text", "").strip()

                # 2. OpenAI / Azure OpenAI / Compatible API
                elif prov in ["openai", "azure_openai"]:
                    active_model = mod if mod and mod not in ["dynamic", "default", "Auto-Optimized"] else "gpt-4o-mini"
                    endpoint = base_url or "https://api.openai.com/v1/chat/completions"
                    messages = [{"role": "system", "content": system_prompt}]
                    for msg in conversation_history:
                        role = "user" if msg.get("role") in ["user", "caller", "human"] else "assistant"
                        messages.append({"role": role, "content": msg.get("text", "")})

                    res = await client.post(
                        endpoint,
                        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                        json={"model": active_model, "messages": messages, "max_tokens": 50, "temperature": 0.35},
                    )
                    if res.status_code == 200:
                        choices = res.json().get("choices", [])
                        if choices:
                            return choices[0].get("message", {}).get("content", "").strip()

                # 3. Anthropic Claude
                elif prov in ["anthropic", "claude"]:
                    active_model = mod if mod and mod not in ["dynamic", "default", "Auto-Optimized"] else "claude-3-5-haiku-latest"
                    messages = []
                    for msg in conversation_history:
                        role = "user" if msg.get("role") in ["user", "caller", "human"] else "assistant"
                        messages.append({"role": role, "content": msg.get("text", "")})

                    res = await client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
                        json={"model": active_model, "system": system_prompt, "messages": messages, "max_tokens": 50},
                    )
                    if res.status_code == 200:
                        content = res.json().get("content", [])
                        if content:
                            return content[0].get("text", "").strip()

                # 4. Groq Ultra-Fast Inference
                elif prov in ["groq"]:
                    active_model = mod if mod and mod not in ["dynamic", "default", "Auto-Optimized"] else "llama-3.3-70b-versatile"
                    messages = [{"role": "system", "content": system_prompt}]
                    for msg in conversation_history:
                        role = "user" if msg.get("role") in ["user", "caller", "human"] else "assistant"
                        messages.append({"role": role, "content": msg.get("text", "")})

                    res = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                        json={"model": active_model, "messages": messages, "max_tokens": 50, "temperature": 0.35},
                    )
                    if res.status_code == 200:
                        choices = res.json().get("choices", [])
                        if choices:
                            return choices[0].get("message", {}).get("content", "").strip()

                # 5. DeepSeek / OpenRouter / Mistral / Generic OpenAI-Compatible API
                else:
                    active_model = mod if mod and mod not in ["dynamic", "default", "Auto-Optimized"] else "deepseek-chat"
                    endpoint = "https://api.deepseek.com/v1/chat/completions" if prov == "deepseek" else (base_url or "https://openrouter.ai/api/v1/chat/completions")
                    messages = [{"role": "system", "content": system_prompt}]
                    for msg in conversation_history:
                        role = "user" if msg.get("role") in ["user", "caller", "human"] else "assistant"
                        messages.append({"role": role, "content": msg.get("text", "")})

                    res = await client.post(
                        endpoint,
                        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                        json={"model": active_model, "messages": messages, "max_tokens": 50, "temperature": 0.35},
                    )
                    if res.status_code == 200:
                        choices = res.json().get("choices", [])
                        if choices:
                            return choices[0].get("message", {}).get("content", "").strip()

            except Exception as e:
                print(f"[TelephonyEngine] Error calling active provider '{prov}': {e}")

        return None

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
        Parses numeric per-minute carrier rate from rate string or number.
        Examples: '$0.014' -> 0.014, '$0.0035' -> 0.0035, '₹0.70' -> 0.0084, 'Free' -> 0.0
        """
        if rate_str is None:
            return 0.014
        if isinstance(rate_str, (int, float)):
            return float(rate_str)
        s = str(rate_str).strip()
        if "free" in s.lower() or "flat-rate" in s.lower() or "trial" in s.lower():
            return 0.0
        # INR conversion approx ~ 1 USD = 84 INR (₹0.70 / min ~ $0.0083 / min)
        if "₹" in s or "inr" in s.lower():
            digits = re.findall(r"[\d\.]+", s)
            if digits:
                return round(float(digits[0]) / 84.0, 5)
        # USD or standard dollar / cents
        digits = re.findall(r"[\d\.]+", s)
        if digits:
            try:
                return float(digits[0])
            except ValueError:
                pass
        return 0.014

    @classmethod
    def resolve_carrier_rate(
        cls,
        db: Optional[Session],
        org_id: Optional[str],
        call_mode: str = "carrier",
        carrier_name: Optional[str] = None,
        carrier_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Dynamically resolves active carrier pricing and rate card from ProviderCredential SSOT.
        """
        if call_mode in ["mic", "web_mic", "browser_mic"]:
            return {
                "carrier_name": "WebRTC Real-Time Audio (Zero Carrier Cost)",
                "cost_per_min": 0.0,
                "pricing_mode": "Zero-Cost Local WebRTC",
                "inbound_cost": 0.0,
            }

        if call_mode in ["android_gsm", "gsm"]:
            return {
                "carrier_name": carrier_name or "Android GSM Cellular SIM (Unlimited Plan)",
                "cost_per_min": 0.0,
                "pricing_mode": "Cellular SIM Unlimited",
                "inbound_cost": 0.0,
            }

        # Query ProviderCredential for matching carrier in DB
        matched_cred = None
        if db:
            from backend.models.models import ProviderCredential
            query = db.query(ProviderCredential).filter(
                ProviderCredential.category.in_(["telephony_providers", "telephony_carriers", "sip_providers", "sip_trunks"])
            )
            if org_id:
                query = query.filter((ProviderCredential.organization_id == org_id) | (ProviderCredential.organization_id == None))
            
            creds = query.all()
            if carrier_id:
                for c in creds:
                    if c.id == carrier_id:
                        matched_cred = c
                        break
            if not matched_cred and carrier_name:
                c_name_clean = carrier_name.lower().strip()
                for c in creds:
                    disp = (c.display_name or "").lower()
                    p_name = (c.provider_name or "").lower()
                    if c_name_clean in disp or c_name_clean in p_name or disp in c_name_clean:
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
            cost_str = meta.get("cost_per_min", "$0.014")
            rate = cls.parse_carrier_rate(cost_str)
            disp_name = matched_cred.display_name or matched_cred.provider_name or carrier_name or "Cloud Telephony Carrier"
            return {
                "carrier_id": matched_cred.id,
                "carrier_name": disp_name,
                "cost_per_min": rate,
                "raw_rate_str": str(cost_str),
                "pricing_mode": meta.get("pricing_mode", "Paid"),
                "inbound_cost": cls.parse_carrier_rate(meta.get("inbound_cost", "$0.0085")),
                "billing_interval": meta.get("billing_interval", "60s/60s (Standard)"),
            }

        return {
            "carrier_name": carrier_name or "Twilio Cloud Telephony",
            "cost_per_min": 0.014,
            "raw_rate_str": "$0.014",
            "pricing_mode": "Paid",
            "inbound_cost": 0.0085,
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
        Calculates complete transparent call cost factoring active Telephony Carrier rate,
        LLM token consumption, and Neural TTS characters.
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
        
        # Telephony Carrier Cost
        telephony_cost = round(minutes * effective_rate, 4)

        # AI Compute & Synthesis Cost (Transparent breakdown)
        llm_cost = round((llm_tokens / 1000.0) * 0.00015, 5) if llm_tokens > 0 else (0.0008 if dur_sec > 0 else 0.0)
        tts_cost = round((tts_chars / 1000.0) * 0.015, 5) if tts_chars > 0 else (0.0012 if dur_sec > 0 else 0.0)

        total_cost = round(telephony_cost + (0.0 if call_mode in ["mic", "web_mic", "browser_mic"] and dur_sec <= 3 else (llm_cost + tts_cost)), 4)
        
        # For browser mic / WebRTC tests, keep nominal total cost clean and accurate (e.g. $0.000 to $0.002)
        if call_mode in ["mic", "web_mic", "browser_mic"]:
            total_cost = round(llm_cost + tts_cost, 4)

        breakdown = {
            "telephony_carrier_cost": telephony_cost,
            "carrier_name": carrier_info.get("carrier_name", "WebRTC Audio"),
            "rate_per_min": effective_rate,
            "llm_cost": llm_cost,
            "tts_cost": tts_cost,
            "total_cost": total_cost,
            "duration_seconds": dur_sec,
        }

        return total_cost, breakdown
