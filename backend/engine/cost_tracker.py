class CostTracker:
    # Rates per unit
    OPENAI_PER_1K_TOKENS = 0.005
    GEMINI_PER_1K_TOKENS = 0.000125
    DEEPGRAM_PER_MINUTE = 0.0043
    ELEVENLABS_PER_1K_CHARS = 0.015
    TWILIO_PER_MINUTE = 0.014

    @classmethod
    def calculate_call_cost(
        cls,
        duration_seconds: float,
        llm_provider: str,
        llm_tokens: int,
        tts_chars: int,
    ) -> dict[str, float]:
        minutes = max(0.1, duration_seconds / 60.0)

        # Telephony cost
        twilio_cost = round(minutes * cls.TWILIO_PER_MINUTE, 4)

        # STT cost
        deepgram_cost = round(minutes * cls.DEEPGRAM_PER_MINUTE, 4)

        # TTS cost
        elevenlabs_cost = round((tts_chars / 1000.0) * cls.ELEVENLABS_PER_1K_CHARS, 4)

        # LLM cost
        if "openai" in llm_provider.lower():
            llm_cost = round((llm_tokens / 1000.0) * cls.OPENAI_PER_1K_TOKENS, 4)
        else:
            llm_cost = round((llm_tokens / 1000.0) * cls.GEMINI_PER_1K_TOKENS, 4)

        total = round(twilio_cost + deepgram_cost + elevenlabs_cost + llm_cost, 4)
        cost_per_minute = round(total / minutes, 4) if minutes > 0 else total

        return {
            "twilio_cost": twilio_cost,
            "deepgram_cost": deepgram_cost,
            "elevenlabs_cost": elevenlabs_cost,
            "llm_cost": llm_cost,
            "total_cost": total,
            "cost_per_minute": cost_per_minute,
        }
