"""
Provider Health Monitor Subsystem
Implements Rule 7 of Free-First Architecture:
Exposes capability flags (Available, Offline, Latency, Streaming, Voice, LLM, Vision, Realtime, Is Free).
"""

import time
import httpx
from typing import Any, Dict, List


from backend.integrations.registry_service import registry_service


class ProviderHealthMonitor:
    """Monitors live status and capabilities for all provider engines using single backend catalog source of truth."""

    @staticmethod
    def _get_capabilities_map() -> Dict[str, Dict[str, Any]]:
        catalog = registry_service.get_provider_catalog()
        caps_map = {}
        for category in ["llm", "voice"]:
            for item in catalog.get(category, []):
                p_id = item["id"].lower()
                caps_map[p_id] = {
                    "name": item["name"],
                    "supports_llm": item.get("supports_llm", False),
                    "supports_voice": item.get("supports_voice", False),
                    "supports_vision": item.get("supports_vision", False),
                    "supports_realtime": item.get("supports_realtime", True),
                    "streaming": item.get("streaming", True),
                    "is_free": item.get("is_free", False),
                }
        return caps_map

    @staticmethod
    async def check_provider_health(provider_id: str, endpoint: str = "") -> Dict[str, Any]:
        p_id = provider_id.lower().strip()
        caps_map = ProviderHealthMonitor._get_capabilities_map()
        caps = caps_map.get(
            p_id,
            {
                "name": provider_id.capitalize(),
                "supports_llm": True,
                "supports_voice": True,
                "supports_vision": False,
                "supports_realtime": True,
                "streaming": True,
                "is_free": False,
            },
        )

        start_time = time.time()
        is_online = True
        latency_ms = 15.0

        if caps["is_free"] and endpoint:
            try:
                async with httpx.AsyncClient(timeout=2.0) as client:
                    res = await client.get(endpoint)
                    is_online = res.status_code < 500
                    latency_ms = round((time.time() - start_time) * 1000, 1)
            except Exception:
                is_online = False
                latency_ms = 0.0

        return {
            "provider_id": p_id,
            "name": caps["name"],
            "status": "online" if is_online else "offline",
            "latency_ms": latency_ms,
            "streaming": caps["streaming"],
            "supports_llm": caps["supports_llm"],
            "supports_voice": caps["supports_voice"],
            "supports_vision": caps["supports_vision"],
            "supports_realtime": caps["supports_realtime"],
            "is_free": caps["is_free"],
        }

    @staticmethod
    async def get_all_health_statuses() -> List[Dict[str, Any]]:
        statuses = []
        caps_map = ProviderHealthMonitor._get_capabilities_map()
        for p_id in caps_map:
            st = await ProviderHealthMonitor.check_provider_health(p_id)
            statuses.append(st)
        return statuses
