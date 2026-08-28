"""
Central Behavior Engine
Nexus Call OS v2.4 Enterprise

The Business Intelligence Layer that evaluates caller state and decides HOW the AI should act.

Decisions:
 1. Answer Now
 2. Ask Another Question
 3. Collect More Information
 4. Transfer to Human
 5. Schedule Callback
 6. Book Appointment
 7. Continue Selling
 8. End Conversation
 9. Apologize
10. Switch Language
11. Shorten Response
12. Expand Explanation
"""

from typing import Dict, Any, Optional

from backend.behavior_engine.appointment_manager import AppointmentManager
from backend.behavior_engine.confidence_manager import ConfidenceManager
from backend.behavior_engine.conversation_strategy import ConversationStrategyResolver
from backend.behavior_engine.fallback_manager import FallbackManager
from backend.behavior_engine.faq_resolver import FAQResolver
from backend.behavior_engine.goal_manager import GoalManager, BusinessGoal
from backend.behavior_engine.intent_detector import IntentDetector, CallerIntent
from backend.behavior_engine.knowledge_selector import KnowledgeSelector
from backend.behavior_engine.memory_selector import MemorySelector
from backend.behavior_engine.objection_handler import ObjectionHandler
from backend.behavior_engine.response_validator import ResponseValidator
from backend.behavior_engine.sales_strategy import SalesStrategyEngine


class BehaviorDecision:
    """Encapsulates a Behavior Engine decision with context and recommended action."""

    def __init__(self, action: str, reason: str, context: Dict[str, Any]):
        self.action = action
        self.reason = reason
        self.context = context

    def to_dict(self) -> Dict[str, Any]:
        return {
            "action": self.action,
            "reason": self.reason,
            "context": self.context,
        }


class BehaviorEngine:
    """Central Business Intelligence layer controlling AI behavioral decisions."""

    def __init__(
        self,
        session_id: str,
        business_type: str = "general",
        strategy_override: str = "",
        primary_goal: BusinessGoal = BusinessGoal.APPOINTMENT_BOOKING,
    ):
        self.session_id = session_id
        self.business_type = business_type
        self.primary_goal = primary_goal

        # Resolve strategy
        strategy_result = ConversationStrategyResolver.resolve(business_type, strategy_override)
        self.current_strategy = strategy_result["strategy"]

        # Module Instances
        self.intent_detector = IntentDetector()
        self.goal_manager = GoalManager(primary_goal)
        self.objection_handler = ObjectionHandler()
        self.faq_resolver = FAQResolver()
        self.knowledge_selector = KnowledgeSelector()
        self.memory_selector = MemorySelector()
        self.confidence_manager = ConfidenceManager()
        self.response_validator = ResponseValidator()
        self.fallback_manager = FallbackManager()
        self.sales_engine = SalesStrategyEngine()
        self.appointment_manager = AppointmentManager()

    def evaluate(self, user_input: str, ai_response: Optional[str] = None) -> Dict[str, Any]:
        """Core decision loop: evaluate caller input and return structured behavior decision."""
        # 1. Detect Intent
        intent_result = self.intent_detector.detect_intent(user_input)
        intent = intent_result["intent"]
        intent_confidence = intent_result["confidence"]

        # 2. Record turn in memory
        self.memory_selector.add_turn("user", user_input)

        # 3. FAQ lookup
        faq_result = self.faq_resolver.resolve(user_input)
        faq_resolved = faq_result.get("resolved", False)

        # 4. Knowledge selection
        knowledge_result = self.knowledge_selector.select_relevant_chunks(user_input)
        knowledge_grounded = knowledge_result.get("grounded", False)

        # 5. Confidence scoring
        confidence_result = self.confidence_manager.evaluate(faq_resolved, knowledge_grounded, intent_confidence)
        confidence_score = confidence_result["confidence_score"]

        # 6. Decision routing
        decision = self._make_decision(
            intent=intent,
            confidence_score=confidence_score,
            faq_resolved=faq_resolved,
            faq_answer=faq_result.get("answer"),
            ai_response=ai_response,
        )

        # 7. Validate final response
        validated = self.response_validator.validate(ai_response or decision.context.get("recommended_response", ""))

        return {
            "session_id": self.session_id,
            "intent": intent,
            "intent_confidence": intent_confidence,
            "confidence_score": confidence_score,
            "strategy": self.current_strategy,
            "business_type": self.business_type,
            "goal_status": self.goal_manager.get_status(),
            "decision": decision.to_dict(),
            "faq_resolved": faq_resolved,
            "faq_answer": faq_result.get("answer"),
            "knowledge_grounded": knowledge_grounded,
            "response_validation": validated,
            "anti_hallucination_active": confidence_result.get("anti_hallucination_active", False),
        }

    def _make_decision(
        self,
        intent: str,
        confidence_score: float,
        faq_resolved: bool,
        faq_answer: Optional[str],
        ai_response: Optional[str],
    ) -> BehaviorDecision:
        """Applies the 12-decision behavior tree."""

        # Transfer to human
        if intent == CallerIntent.HUMAN_TRANSFER.value:
            return BehaviorDecision(
                action="transfer_to_human",
                reason="caller_requested_human",
                context={"recommended_response": "Of course! Let me connect you with our team right away."},
            )

        # Book appointment
        if intent == CallerIntent.BOOK_APPOINTMENT.value:
            next_q = self.appointment_manager.get_next_question()
            return BehaviorDecision(
                action="book_appointment" if not next_q else "collect_more_information",
                reason="appointment_intent_detected",
                context={"recommended_response": next_q or "Great! Let me confirm your booking."},
            )

        # Objection handling
        if intent in [CallerIntent.OBJECTION_PRICE.value, CallerIntent.OBJECTION_TRUST.value]:
            obj_type = self.objection_handler.detect_objection_type(intent)
            obj_response = self.objection_handler.handle_objection(obj_type)
            return BehaviorDecision(
                action="handle_objection",
                reason="objection_detected",
                context={"recommended_response": f"{obj_response['empathy']} {obj_response['reframe']} {obj_response['offer']}"},
            )

        # End conversation
        if intent == CallerIntent.GOODBYE.value:
            return BehaviorDecision(
                action="end_conversation",
                reason="caller_said_goodbye",
                context={"recommended_response": "Thank you for calling! Have a wonderful day. Goodbye!"},
            )

        # Low confidence — fallback
        if confidence_score < 0.65:
            fallback = self.fallback_manager.get_fallback_action(confidence_score, intent)
            return BehaviorDecision(
                action=fallback["action"],
                reason="low_confidence",
                context={"recommended_response": fallback.get("message", "Could you please clarify what you need?")},
            )

        # FAQ direct answer
        if faq_resolved and faq_answer:
            return BehaviorDecision(
                action="answer_now",
                reason="faq_matched",
                context={"recommended_response": faq_answer},
            )

        # Default — answer with AI response
        return BehaviorDecision(
            action="answer_now",
            reason="llm_response_grounded",
            context={"recommended_response": ai_response or "Let me check that for you right away."},
        )
