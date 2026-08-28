import re
from typing import Any


class CallingLevelOptimizer:
    """
    Central Real-Time Telephony Voice Standard & Optimization Engine.
    Ensures all TTS providers (ElevenLabs, Deepgram Aura, Cartesia, OpenAI TTS,
    Azure, Google, PlayHT, Fish Audio, LMNT, MiniMax) operate at real-time
    calling performance with normalized speaking rates and fluent Hindi/Hinglish speech.
    """

    @staticmethod
    def clean_text_for_calling(text: str) -> str:
        """
        Pre-process LLM response text specifically for voice phone calls:
        - Removes markdown formatting (**bold**, *italics*, headers, bullets).
        - Strips emojis and stage directions like (*sighs*, *chuckles*).
        - Cleans excessive ellipses, em-dashes, and trailing symbols that cause TTS stutter.
        """
        if not text:
            return ""

        cleaned = text.strip()

        # Remove stage directions in parentheses or asterisks, e.g. (laughing), *smiles*
        cleaned = re.sub(r"[\(\*][a-zA-Z\s]{2,20}[\)\*]", "", cleaned)

        # Remove markdown symbols (*, _, #, `, ~, >)
        cleaned = re.sub(r"[\*\_#\`\~\>\=]", "", cleaned)

        # Replace double or multiple dashes/dots with a single comma or space for natural speech cadence
        cleaned = re.sub(r"\-{2,}", ", ", cleaned)
        cleaned = re.sub(r"\.{2,}", ".", cleaned)

        # Remove emojis and non-speech symbols
        cleaned = re.sub(r"[\U00010000-\U0010ffff]", "", cleaned)

        # Normalize multiple spaces
        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        return cleaned

    @staticmethod
    def get_hindi_system_prompt_directive() -> str:
        """
        System prompt instructions to enforce crisp, fast, conversational Hindi/Hinglish delivery on calls.
        """
        return (
            "VOICE CALL RULES FOR HINDI & ENGLISH:\n"
            "1. Speak in crisp, natural, conversational spoken Hindi / Hinglish appropriate for a friendly phone agent.\n"
            "2. Keep responses brief (1-2 short sentences maximum per turn) to ensure low latency.\n"
            "3. Do not use robotic formal Sanskritized Hindi words; use everyday spoken Hindi words.\n"
            "4. Never include markdown, bullet points, emojis, or text formatting.\n"
        )

    @staticmethod
    def get_optimized_tts_params(
        provider: str, voice_id: str, model_id: str | None = None, text: str = ""
    ) -> dict[str, Any]:
        """
        Returns provider-specific payload overrides to guarantee low latency and optimal speaking rate.
        """
        p = (provider or "").lower().strip()
        v = (voice_id or "").strip()
        m = (model_id or "").strip()

        is_heavy_v2 = "aura-2" in v.lower() or "heavy" in v.lower() or "heavy" in m.lower()

        # 1. ElevenLabs Optimization
        if p in ["elevenlabs", "eleven_labs", "eleven-labs"]:
            target_model = m if m else "eleven_turbo_v2_5"
            return {
                "model_id": target_model,
                "optimize_streaming_latency": 4,  # Level 4 ultra-low latency mode (~150ms TTFB)
                "voice_settings": {
                    "stability": 0.45,
                    "similarity_boost": 0.85,
                    "style": 0.0,
                    "use_speaker_boost": True,
                },
            }

        # 2. OpenAI TTS Optimization
        elif p in ["openai", "openai_tts", "openai-tts"]:
            target_speed = 1.15 if is_heavy_v2 else 1.10
            return {
                "model": "tts-1",  # Realtime low-latency model
                "speed": target_speed,
            }

        # 3. Deepgram Aura Optimization
        elif p in ["deepgram", "deepgram_aura", "deepgram-aura"]:
            return {
                "encoding": "mp3",
                "bit_rate": 48000,
            }

        # 4. Cartesia Sonic Optimization
        elif p in ["cartesia", "cartesia_sonic", "cartesia-sonic"]:
            req_model = m if m and m != "sonic" else "sonic-latest"
            return {
                "model_id": req_model,
                "output_format": {
                    "container": "mp3",
                    "encoding": "mp3",
                    "sample_rate": 44100,
                },
            }

        # 5. Azure Speech Neural Optimization
        elif p in ["azure", "azure_speech", "azure-speech"]:
            rate_percent = "+15%" if is_heavy_v2 else "+10%"
            return {
                "rate_ssml": rate_percent,
            }

        # 6. PlayHT Turbo Optimization
        elif p in ["playht", "play_ht", "play-ht"]:
            return {
                "voice_engine": "PlayHT2.0-turbo",
                "speed": 1.12 if is_heavy_v2 else 1.08,
            }

        # Default fallback config
        return {
            "speed": 1.10 if is_heavy_v2 else 1.05,
        }


calling_optimizer = CallingLevelOptimizer()
