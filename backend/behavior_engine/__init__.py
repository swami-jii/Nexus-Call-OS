"""
Enterprise AI Behavior & Decision Engine Subsystem
Nexus Call OS v2.4 Enterprise

Business Intelligence Layer for dynamic AI decision-making:
Intent detection, confidence scoring, objection handling, FAQ resolution,
appointment booking, knowledge selection, and anti-hallucination guardrails.
"""

from backend.behavior_engine.appointment_manager import AppointmentManager
from backend.behavior_engine.behavior_engine import BehaviorDecision, BehaviorEngine
from backend.behavior_engine.behavior_runtime import BehaviorEngineRuntime
from backend.behavior_engine.confidence_manager import ConfidenceManager
from backend.behavior_engine.conversation_strategy import BusinessType, ConversationStrategy, ConversationStrategyResolver
from backend.behavior_engine.fallback_manager import FallbackManager
from backend.behavior_engine.faq_resolver import FAQEntry, FAQResolver
from backend.behavior_engine.goal_manager import BusinessGoal, GoalManager
from backend.behavior_engine.intent_detector import CallerIntent, IntentDetector
from backend.behavior_engine.knowledge_selector import KnowledgeChunk, KnowledgeSelector
from backend.behavior_engine.memory_selector import MemorySelector
from backend.behavior_engine.objection_handler import ObjectionHandler, ObjectionType
from backend.behavior_engine.response_validator import ResponseValidator
from backend.behavior_engine.sales_strategy import SalesStage, SalesStrategyEngine

__all__ = [
    "BehaviorEngine",
    "BehaviorDecision",
    "BehaviorEngineRuntime",
    "IntentDetector",
    "CallerIntent",
    "GoalManager",
    "BusinessGoal",
    "ConversationStrategyResolver",
    "ConversationStrategy",
    "BusinessType",
    "SalesStrategyEngine",
    "SalesStage",
    "AppointmentManager",
    "ObjectionHandler",
    "ObjectionType",
    "FAQResolver",
    "FAQEntry",
    "KnowledgeSelector",
    "KnowledgeChunk",
    "MemorySelector",
    "ConfidenceManager",
    "ResponseValidator",
    "FallbackManager",
]
