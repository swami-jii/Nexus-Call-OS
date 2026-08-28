"""
Integration Test Suite — Enterprise AI Behavior & Decision Engine
Nexus Call OS v2.4 Enterprise

Automated unittest suite verifying:
1. Intent Detection
2. Confidence Scoring & Anti-Hallucination
3. FAQ Resolution
4. Objection Handling
5. Appointment Booking Flow
6. Behavior Decision Routing
7. Strategy Resolution by Business Type
8. Fallback & Human Transfer
"""

import unittest
from backend.behavior_engine.behavior_engine import BehaviorEngine
from backend.behavior_engine.behavior_runtime import BehaviorEngineRuntime
from backend.behavior_engine.confidence_manager import ConfidenceManager
from backend.behavior_engine.conversation_strategy import ConversationStrategyResolver
from backend.behavior_engine.faq_resolver import FAQResolver
from backend.behavior_engine.intent_detector import IntentDetector, CallerIntent
from backend.behavior_engine.objection_handler import ObjectionHandler, ObjectionType
from backend.behavior_engine.response_validator import ResponseValidator


class TestIntentDetector(unittest.TestCase):
    def setUp(self):
        self.detector = IntentDetector()

    def test_detects_appointment_intent(self):
        res = self.detector.detect_intent("I want to book an appointment")
        self.assertEqual(res["intent"], CallerIntent.BOOK_APPOINTMENT.value)

    def test_detects_human_transfer(self):
        res = self.detector.detect_intent("Can I speak to a human agent?")
        self.assertEqual(res["intent"], CallerIntent.HUMAN_TRANSFER.value)

    def test_detects_price_objection(self):
        res = self.detector.detect_intent("This seems too expensive for me")
        self.assertEqual(res["intent"], CallerIntent.OBJECTION_PRICE.value)

    def test_detects_goodbye(self):
        res = self.detector.detect_intent("Thank you, goodbye!")
        self.assertEqual(res["intent"], CallerIntent.GOODBYE.value)


class TestFAQResolver(unittest.TestCase):
    def setUp(self):
        self.faq = FAQResolver()

    def test_resolves_timing_question(self):
        res = self.faq.resolve("What are your opening hours?")
        self.assertTrue(res["resolved"])

    def test_no_match_returns_unresolved(self):
        res = self.faq.resolve("xyzzy_unknown_query_12345")
        self.assertFalse(res["resolved"])


class TestConfidenceManager(unittest.TestCase):
    def setUp(self):
        self.cm = ConfidenceManager()

    def test_high_confidence_no_clarification(self):
        res = self.cm.evaluate(faq_resolved=True, knowledge_grounded=True, intent_confidence=0.9)
        self.assertFalse(res["should_clarify"])
        self.assertFalse(res["anti_hallucination_active"])

    def test_low_confidence_triggers_clarification(self):
        res = self.cm.evaluate(faq_resolved=False, knowledge_grounded=False, intent_confidence=0.3)
        self.assertTrue(res["should_clarify"])
        self.assertTrue(res["anti_hallucination_active"])


class TestObjectionHandler(unittest.TestCase):
    def setUp(self):
        self.handler = ObjectionHandler()

    def test_detects_pricing_objection(self):
        obj_type = self.handler.detect_objection_type("It's too expensive")
        self.assertEqual(obj_type, ObjectionType.PRICING)

    def test_pricing_objection_response_has_empathy(self):
        res = self.handler.handle_objection(ObjectionType.PRICING)
        self.assertIn("empathy", res)
        self.assertIn("reframe", res)
        self.assertIn("offer", res)


class TestResponseValidator(unittest.TestCase):
    def setUp(self):
        self.validator = ResponseValidator()

    def test_flags_hallucination_marker(self):
        result = self.validator.validate("I think the price is around 5000 rupees.")
        self.assertFalse(result["is_valid"])
        self.assertTrue(len(result["issues"]) > 0)

    def test_shortens_long_responses(self):
        long_text = " ".join(["word"] * 120)
        result = self.validator.validate(long_text, max_words=80)
        self.assertTrue(result["is_shortened"])


class TestStrategyResolver(unittest.TestCase):
    def test_dental_maps_to_appointment(self):
        res = ConversationStrategyResolver.resolve("dental_clinic")
        self.assertEqual(res["strategy"], "appointment_booking")

    def test_insurance_maps_to_sales(self):
        res = ConversationStrategyResolver.resolve("insurance")
        self.assertEqual(res["strategy"], "sales")

    def test_override_works(self):
        res = ConversationStrategyResolver.resolve("general", override_strategy="survey")
        self.assertEqual(res["strategy"], "survey")


class TestBehaviorEngineRuntime(unittest.TestCase):
    def setUp(self):
        self.runtime = BehaviorEngineRuntime()
        self.session_id = "test_behavior_9901"

    def test_create_and_evaluate_session(self):
        self.runtime.create_session(self.session_id, business_type="dental_clinic")
        res = self.runtime.evaluate_turn(self.session_id, "I want to book an appointment")
        self.assertIn("intent", res)
        self.assertIn("decision", res)
        self.assertIn("confidence_score", res)

    def test_close_session(self):
        self.runtime.create_session(self.session_id, business_type="general")
        res = self.runtime.close_session(self.session_id)
        self.assertEqual(res["status"], "closed")
        self.assertTrue(res["found"])


if __name__ == "__main__":
    unittest.main()
