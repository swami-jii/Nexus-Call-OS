"""
Universal Conversation Runtime Orchestrator
Integrates state machine, turn taking, interruption handling, silence detection,
humanization, emotion hooks, response scheduling, fallback, termination, and provider adapters.
"""

import time
from typing import Any, Dict, Optional

from backend.conversation_engine.emotion import EmotionDetector
from backend.conversation_engine.fallback import FallbackHandler
from backend.conversation_engine.humanization import HumanizationEngine
from backend.conversation_engine.interface import BaseTelephonyAdapter, SimulatedTelephonyAdapter
from backend.conversation_engine.interruption import InterruptionHandler
from backend.conversation_engine.pause_manager import PauseManager
from backend.conversation_engine.policy import ConversationPolicyEnforcer
from backend.conversation_engine.scheduler import ResponseScheduler
from backend.conversation_engine.silence_detector import SilenceDetector
from backend.conversation_engine.state_machine import ConversationState, ConversationStateMachine
from backend.conversation_engine.termination import TerminationManager
from backend.conversation_engine.turn_taking import SpeakerFloor, TurnTakingManager


class UniversalConversationRuntime:
    """Universal conversation runtime that manages real-time AI phone calls."""

    def __init__(
        self,
        session_id: str,
        agent_name: str = "AI Assistant",
        system_prompt: str = "You are a helpful AI assistant.",
        adapter: Optional[BaseTelephonyAdapter] = None,
    ):
        self.session_id = session_id
        self.agent_name = agent_name
        self.system_prompt = system_prompt  # Kept strictly separate from conversation rules

        # Subsystem Components
        self.telephony_adapter = adapter or SimulatedTelephonyAdapter(session_id)
        self.state_machine = ConversationStateMachine(session_id)
        self.turn_manager = TurnTakingManager()
        self.interruption_handler = InterruptionHandler()
        self.silence_detector = SilenceDetector()
        self.pause_manager = PauseManager()
        self.humanization = HumanizationEngine()
        self.emotion_detector = EmotionDetector()
        self.scheduler = ResponseScheduler()
        self.fallback_handler = FallbackHandler()
        self.termination_manager = TerminationManager()
        self.policy_enforcer = ConversationPolicyEnforcer()

        # Session Metrics
        self.created_at = time.time()
        self.turn_count = 0

        # Wire Interruption Callback
        self.interruption_handler.register_bargein_callback(self._on_bargein)

    def _on_bargein(self) -> None:
        """Executed immediately on user barge-in."""
        self.scheduler.clear_queue()
        self.state_machine.transition_to(ConversationState.INTERRUPTED, reason="user_barge_in")
        self.turn_manager.claim_floor(SpeakerFloor.USER)

    async def process_user_turn(self, raw_input: str) -> Dict[str, Any]:
        """Process an incoming user message through all universal conversation policies."""
        if self.termination_manager.is_terminated:
            return {"error": "Call is terminated", "is_terminated": True}

        # 1. Policy Enforcement & PII Sanitization
        sanitized_input = self.policy_enforcer.sanitize_input(raw_input)
        compliance = self.policy_enforcer.evaluate_compliance(raw_input)

        # 2. Update VAD & State Transition
        self.silence_detector.update_vad(is_speech=True)
        self.state_machine.transition_to(ConversationState.LISTENING, reason="user_speech_received")
        self.turn_manager.claim_floor(SpeakerFloor.USER)

        # 3. Emotion Detection
        emotion_state = self.emotion_detector.analyze_text(sanitized_input)

        # 4. Transition to Thinking
        self.state_machine.transition_to(ConversationState.THINKING, reason="processing_response")
        self.turn_manager.claim_floor(SpeakerFloor.AI)

        # 5. Check Filler Injection
        filler_needed = self.pause_manager.should_inject_filler(expected_delay_ms=400.0)
        filler_text = PauseManager.get_random_filler() if filler_needed else None

        # 6. Format Response with Humanization
        response_text = f"Hello, I am {self.agent_name}. I received your message: '{sanitized_input}'."
        humanized_response = self.humanization.format_text_for_speech(response_text)

        # 7. Transition to Speaking
        self.state_machine.transition_to(ConversationState.SPEAKING, reason="streaming_audio")
        self.turn_count += 1

        # 8. Check Termination Criteria
        duration = time.time() - self.created_at
        is_done = self.termination_manager.check_termination_criteria(
            call_duration_sec=duration,
            error_count=self.fallback_handler.error_count,
        )

        return {
            "session_id": self.session_id,
            "agent_name": self.agent_name,
            "user_input_sanitized": sanitized_input,
            "ai_response": humanized_response,
            "filler_injected": filler_text,
            "state": self.state_machine.current_state.value,
            "emotion": emotion_state.value,
            "compliance": compliance,
            "is_terminated": is_done,
            "turn_count": self.turn_count,
        }

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "agent_name": self.agent_name,
            "current_state": self.state_machine.current_state.value,
            "floor": self.turn_manager.active_floor.value,
            "emotion": self.emotion_detector.get_telemetry(),
            "duration_sec": round(time.time() - self.created_at, 2),
            "interruptions": self.interruption_handler.interruption_count,
            "nudges": self.silence_detector.nudge_count,
            "state_history": self.state_machine.get_history(),
        }
