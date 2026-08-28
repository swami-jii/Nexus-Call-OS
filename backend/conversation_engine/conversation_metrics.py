"""
Conversation Metrics Module
Nexus Call OS v2.4 Enterprise

Collects real-time telemetry metrics: latency ms, tokens used, cost USD, interruption counts.
"""

import time
from typing import Dict, Any


class ConversationMetricsCollector:
    """Telemetry metrics collector for real-time conversation analytics."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.start_time = time.time()
        self.total_latency_ms = 0.0
        self.total_tokens = 0
        self.total_cost = 0.0
        self.turn_count = 0

    def record_turn_metrics(self, latency_ms: float, tokens: int, cost: float = 0.0001) -> None:
        self.turn_count += 1
        self.total_latency_ms += latency_ms
        self.total_tokens += tokens
        self.total_cost += cost

    def get_average_latency_ms(self) -> float:
        return round(self.total_latency_ms / max(1, self.turn_count), 2)

    def get_telemetry(self) -> Dict[str, Any]:
        duration = round(time.time() - self.start_time, 2)
        return {
            "session_id": self.session_id,
            "call_duration_sec": duration,
            "turn_count": self.turn_count,
            "total_tokens": self.total_tokens,
            "avg_latency_ms": self.get_average_latency_ms(),
            "total_cost_usd": round(self.total_cost, 6),
        }
