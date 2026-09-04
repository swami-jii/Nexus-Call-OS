"""
Central Conversation Engine Orchestrator (Core Brain)
Nexus Call OS v2.4 Enterprise

The central intelligence layer controlling HOW and WHEN the AI speaks.
Business prompts remain strictly separate from these universal conversation rules.

Public APIs:
- ConversationEngine.start()
- ConversationEngine.process_audio()
- ConversationEngine.process_text()
- ConversationEngine.generate_response()
- ConversationEngine.end()
"""

import time
from typing import Any, Dict, Optional

from backend.conversation_engine.call_lifecycle import CallLifecycleManager, CallEndReason
from backend.conversation_engine.context_manager import ContextManager
from backend.conversation_engine.conversation_metrics import ConversationMetricsCollector
from backend.conversation_engine.conversation_policy import ConversationPolicyEnforcer, ActionTrigger
from backend.conversation_engine.conversation_state import ConversationStateMachine, CoreConversationState
from backend.conversation_engine.emotion_state import EmotionTracker
from backend.conversation_engine.humanizer import SpeechHumanizer
from backend.conversation_engine.interruption_manager import InterruptionManager
from backend.conversation_engine.pause_manager import PauseManager
from backend.conversation_engine.response_scheduler import ResponseScheduler
from backend.conversation_engine.silence_detector import SilenceDetector
from backend.conversation_engine.turn_manager import TurnManager, FloorOwner


class ConversationEngine:
    """Central Conversation Engine controlling real-time AI telephony intelligence."""

    def __init__(
        self,
        session_id: str,
        agent_id: str = "default_agent",
        agent_name: str = "AI Assistant",
        business_prompt: str = "You are a professional AI voice assistant.",
    ):
        self.session_id = session_id
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.business_prompt = business_prompt  # Separate business prompt

        # Core Intelligence Sub-modules
        self.state_machine = ConversationStateMachine(session_id)
        self.turn_manager = TurnManager()
        self.pause_manager = PauseManager()
        self.interruption_manager = InterruptionManager()
        self.silence_detector = SilenceDetector()
        self.response_scheduler = ResponseScheduler()
        self.policy_enforcer = ConversationPolicyEnforcer()
        self.emotion_tracker = EmotionTracker()
        self.context_manager = ContextManager(agent_id)
        self.metrics_collector = ConversationMetricsCollector(session_id)
        self.humanizer = SpeechHumanizer()
        self.lifecycle_manager = CallLifecycleManager()

        # Wire Interruption Callback
        self.interruption_manager.register_bargein_callback(self._on_bargein)

    def _on_bargein(self) -> None:
        """Executed immediately on user barge-in interruption."""
        self.response_scheduler.clear_queue()
        self.state_machine.transition_to(CoreConversationState.LISTENING, reason="user_barge_in")
        self.turn_manager.acquire_floor(FloorOwner.USER)

    def start(self) -> Dict[str, Any]:
        """Public API: Initialize and start conversation session."""
        self.state_machine.transition_to(CoreConversationState.GREETING, reason="call_started")
        self.turn_manager.acquire_floor(FloorOwner.AI)
        greeting_text = f"Hello! Thank you for calling. I am {self.agent_name}. How can I help you today?"
        humanized_greeting = self.humanizer.humanize_text(greeting_text)

        self.context_manager.add_turn(speaker="assistant", text=humanized_greeting)
        self.state_machine.transition_to(CoreConversationState.WAITING, reason="greeting_completed")
        self.turn_manager.release_floor()

        return {
            "status": "started",
            "session_id": self.session_id,
            "agent_name": self.agent_name,
            "initial_greeting": humanized_greeting,
            "state": self.state_machine.current_state.value,
        }

    def process_audio(self, pcm_chunk: bytes) -> Dict[str, Any]:
        """Public API: Process incoming raw PCM audio stream."""
        self.silence_detector.register_speech_activity()
        return {"status": "processed", "bytes_received": len(pcm_chunk)}

    def process_text(self, raw_input: str, ai_response_override: Optional[str] = None) -> Dict[str, Any]:
        """Public API: Process incoming recognized user text input."""
        start_time = time.time()
        if self.lifecycle_manager.status != CallEndReason.IN_PROGRESS:
            return {"status": "ended", "reason": self.lifecycle_manager.status.value}

        # 1. Update VAD & State
        self.silence_detector.register_speech_activity()
        self.state_machine.transition_to(CoreConversationState.LISTENING, reason="user_text_received")
        self.turn_manager.acquire_floor(FloorOwner.USER)

        # 2. Sanitize & Policy Check
        sanitized_input = self.policy_enforcer.sanitize_text(raw_input)
        action_trigger = self.policy_enforcer.detect_action_trigger(sanitized_input)

        # 3. Emotion Analysis
        emotion = self.emotion_tracker.update_sentiment(sanitized_input)

        # 4. Context Update & Language Detection
        self.context_manager.add_turn(speaker="user", text=sanitized_input)

        # 5. Goodbye Intent Check
        is_goodbye = self.lifecycle_manager.evaluate_goodbye_intent(sanitized_input)

        # 6. State Transition to Processing
        self.state_machine.transition_to(CoreConversationState.PROCESSING, reason="generating_response")
        self.turn_manager.acquire_floor(FloorOwner.AI)

        # 7. Generate Response
        response_data = self.generate_response(
            user_text=sanitized_input,
            action_trigger=action_trigger,
            is_goodbye=is_goodbye,
            ai_response_override=ai_response_override,
        )

        latency_ms = round((time.time() - start_time) * 1000, 2)
        self.metrics_collector.record_turn_metrics(
            latency_ms=latency_ms,
            tokens=len(sanitized_input.split()) + len(response_data["response_text"].split()),
        )

        return {
            "session_id": self.session_id,
            "agent_name": self.agent_name,
            "sanitized_input": sanitized_input,
            "ai_response": response_data["response_text"],
            "humanized_ssml": response_data["ssml_response"],
            "action_trigger": action_trigger.value,
            "emotion": emotion.value,
            "speech_speed": self.emotion_tracker.speech_speed,
            "language": self.context_manager.detected_language,
            "state": self.state_machine.current_state.value,
            "latency_ms": latency_ms,
            "is_ended": is_goodbye or (action_trigger == ActionTrigger.HUMAN_TRANSFER),
        }

    def generate_response(
        self,
        user_text: str,
        action_trigger: ActionTrigger,
        is_goodbye: bool,
        ai_response_override: Optional[str] = None,
    ) -> Dict[str, str]:
        """Public API: Determine response text based on universal rules & policies or dynamic LLM output."""
        if ai_response_override and str(ai_response_override).strip():
            text = str(ai_response_override).strip()
        elif action_trigger == ActionTrigger.HUMAN_TRANSFER:
            text = "I understand you would like to speak with a human operator. Transferring your call now."
        elif action_trigger == ActionTrigger.CALLBACK_REQUEST:
            text = "I have scheduled a callback request for you. A specialist will reach out to you shortly."
        elif action_trigger == ActionTrigger.HOLD_REQUEST:
            text = "No problem, I will hold on for a moment while you get that ready."
        elif is_goodbye:
            text = f"Thank you for reaching out to {self.agent_name}. Have a wonderful day!"
            self.lifecycle_manager.mark_completed(CallEndReason.NORMAL_GOODBYE)
        else:
            text = f"I am {self.agent_name}. I have noted your message: '{user_text}'. How may I assist you further?"

        ssml = self.humanizer.humanize_text(text)
        self.context_manager.add_turn(speaker="assistant", text=text)

        if is_goodbye:
            self.state_machine.transition_to(CoreConversationState.COMPLETED, reason="goodbye_completed")
        else:
            self.state_machine.transition_to(CoreConversationState.RESPONDING, reason="response_delivered")
            self.state_machine.transition_to(CoreConversationState.WAITING, reason="awaiting_user_input")

        self.turn_manager.release_floor()
        return {"response_text": text, "ssml_response": ssml}

    def end(self, reason: str = "normal_hangup") -> Dict[str, Any]:
        """Public API: End conversation session and return final telemetry."""
        self.state_machine.transition_to(CoreConversationState.COMPLETED, reason=reason)
        self.lifecycle_manager.mark_completed(CallEndReason.NORMAL_GOODBYE)
        return {
            "status": "ended",
            "session_id": self.session_id,
            "metrics": self.metrics_collector.get_telemetry(),
            "state_history": self.state_machine.get_history_logs(),
        }
