from typing import Any, Dict, Optional


class CostTracker:
    """
    Dynamic Cost Tracking Engine.
    Resolves compute and telephony usage rates directly from ProviderCredential SSOT.
    Zero hardcoded rates or static provider assumptions.
    """

    @classmethod
    def calculate_call_cost(
        cls,
        duration_seconds: float,
        llm_provider: str = "",
        llm_tokens: int = 0,
        tts_chars: int = 0,
        carrier_name: Optional[str] = None,
        db: Optional[Any] = None,
    ) -> dict[str, Any]:
        from backend.services.telephony_engine import TelephonyCallingEngine

        total_cost, breakdown = TelephonyCallingEngine.calculate_dynamic_call_cost(
            db=db,
            org_id=None,
            duration_seconds=duration_seconds,
            carrier_name=carrier_name,
            llm_tokens=llm_tokens,
            tts_chars=tts_chars,
        )

        minutes = max(0.1, duration_seconds / 60.0) if duration_seconds > 0 else 0.1
        cost_per_minute = round(total_cost / minutes, 4) if minutes > 0 else total_cost

        carrier_cost = breakdown.get("telephony_carrier_cost", 0.0)
        llm_cost = breakdown.get("llm_cost", 0.0)
        tts_cost = breakdown.get("tts_cost", 0.0)

        return {
            "carrier_cost": carrier_cost,
            "twilio_cost": carrier_cost,
            "deepgram_cost": 0.0,
            "elevenlabs_cost": tts_cost,
            "tts_cost": tts_cost,
            "llm_cost": llm_cost,
            "total_cost": total_cost,
            "cost_per_minute": cost_per_minute,
            "breakdown": breakdown,
        }
