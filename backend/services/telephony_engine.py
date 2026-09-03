import base64
import json
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple
import httpx
from sqlalchemy.orm import Session

RECORDINGS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "recordings")
)
os.makedirs(RECORDINGS_DIR, exist_ok=True)


class TelephonyCallingEngine:
    """
    Enterprise Telephony Service for Live Call Studio, GSM Gateways, and Cloud SIP.
    Operates on pure LLM-native cognitive understanding across 104+ global languages.
    Dynamically routes to whichever LLM provider and model is active in API & Integrations.
    """

    @classmethod
    def build_telephony_system_prompt(
        cls,
        agent_name: str,
        business_type: str,
        configured_language: str = "Auto-Detect",
        custom_instructions: str = "",
    ) -> str:
        """
        Builds a universal cognitive telephony system prompt for all 104+ languages.
        Instructs the active LLM to autonomously manage turn-taking, multilingual mirroring,
        and natural call termination signaling ([HANGUP]).
        """
        prompt = f"""You are {agent_name}, a friendly, warm, empathetic human-like conversational AI telephone assistant for {business_type}.

CONFIGURED BASE LANGUAGE: {configured_language}

CRITICAL TELEPHONY COGNITIVE INSTRUCTIONS (104+ GLOBAL LANGUAGES):
1. MULTILINGUAL MIRRORING: You fluently understand and speak 104+ global languages (including Hindi, English, Hinglish, Spanish, Arabic, Bengali, French, German, Russian, Japanese, Mandarin, Tamil, Telugu, Marathi, Gujarati, Punjabi, Urdu, etc.). Detect the caller's spoken language naturally and always reply in the EXACT SAME language and conversational dialect.
2. HUMAN TELEPHONE CONVERSATION: Speak naturally and warmly like a live telephone human agent. NEVER recite, spell out, or mention any database IDs, UUIDs, hex codes, or technical tokens.
3. CONVERSATIONAL CADENCE: Keep answers concise and natural for voice calls (1 to 2 short conversational sentences maximum, under 25 words). Never give monologues.
4. NO FORMATTING: NEVER use markdown bold (**), italic (*), hashtags (#), bullet points, numbered lists, XML/SSML tags, or emojis. Output plain spoken text only.
5. AUTONOMOUS CALL WRAP-UP & TERMINATION ([HANGUP]):
   - Think and evaluate the caller's intent semantically in their language.
   - If the caller indicates they have no more questions, are satisfied, wish to end the call, ask to hang up, or say goodbye in ANY language:
     * Respond with a polite, warm, and natural closing farewell in their language wishing them well.
     * Append the signal tag '[HANGUP]' at the very end of your response so the telephony switchboard automatically and gracefully disconnects the call."""

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
                    for alt_m in ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.7-flash", "gemini-flash-latest"]:
                        if alt_m not in model_attempts:
                            model_attempts.append(alt_m)

                    for m_try in model_attempts:
                        res = await client.post(
                            f"https://generativelanguage.googleapis.com/v1beta/models/{m_try}:generateContent?key={api_key}",
                            headers={"Content-Type": "application/json"},
                            json={
                                "systemInstruction": {"parts": [{"text": system_prompt}]},
                                "contents": contents,
                                "generationConfig": {"temperature": 0.45, "maxOutputTokens": 200},
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
                        json={"model": active_model, "messages": messages, "max_tokens": 200, "temperature": 0.45},
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
                        json={"model": active_model, "system": system_prompt, "messages": messages, "max_tokens": 200},
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
                        json={"model": active_model, "messages": messages, "max_tokens": 200, "temperature": 0.45},
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
                        json={"model": active_model, "messages": messages, "max_tokens": 200, "temperature": 0.45},
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
        Saves dual-channel or multi-turn call recording to disk as an MP3 audio file.
        Returns (recording_url, recording_base64).
        """
        raw_bytes = b""
        if dual_channel_b64 and len(dual_channel_b64) > 100:
            try:
                clean_b64 = dual_channel_b64.split(",")[-1]
                raw_bytes = base64.b64decode(clean_b64)
            except Exception as e:
                print(f"[TelephonyEngine] Dual-channel decode error: {e}")

        if not raw_bytes and audio_turns:
            try:
                raw_bytes = b"".join([base64.b64decode(chunk.split(",")[-1]) for chunk in audio_turns if chunk])
            except Exception as e:
                print(f"[TelephonyEngine] Audio turns stitching error: {e}")

        rec_filename = f"{call_id}.mp3"
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
