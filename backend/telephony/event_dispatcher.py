"""
Event Dispatcher Module
Nexus Call OS v2.4 Enterprise

Publisher-subscriber Telephony Event Bus for real-time call event broadcasting.
"""

from typing import Callable, Dict, List
from backend.telephony.telephony_events import TelephonyEvent, TelephonyEventType


class TelephonyEventDispatcher:
    """Event bus manager dispatching carrier events to subscribed handlers."""

    def __init__(self):
        self._subscribers: Dict[TelephonyEventType, List[Callable[[TelephonyEvent], None]]] = {}

    def subscribe(self, event_type: TelephonyEventType, callback: Callable[[TelephonyEvent], None]) -> None:
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)

    def publish(self, event: TelephonyEvent) -> None:
        handlers = self._subscribers.get(event.event_type, [])
        for handler in handlers:
            try:
                handler(event)
            except Exception as e:
                print(f"Telephony event handler error: {e}")
