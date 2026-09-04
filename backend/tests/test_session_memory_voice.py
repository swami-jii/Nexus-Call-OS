import asyncio
import pytest
from backend.services.session_memory_service import SessionMemoryManager
from backend.services.telephony_engine import TelephonyCallingEngine
from backend.services.live_knowledge_service import LiveKnowledgeService


def test_session_memory_dynamic_context_ingestion():
    mgr = SessionMemoryManager(session_id="test_01", phone_number="+919876543210")
    mgr.set_caller_name("Rahul")
    mgr.extract_and_update(user_text="Mujhe property check karne ke liye appointment chahiye")
    mgr.extract_and_update(ai_text="Sure, I can help you schedule that.")
    
    assert mgr.caller_name == "Rahul"
    assert mgr.turn_count == 1
    assert len(mgr.turns) == 2
    assert len(mgr.key_points) >= 2
    assert any("Rahul" in f for f in mgr.key_points)
    assert any("property" in p.lower() for p in mgr.key_points)

    prompt_block = mgr.get_memory_prompt_block()
    assert "Rahul" in prompt_block
    assert "ACTIVE SESSION MEMORY" in prompt_block
    assert "NEVER re-ask" in prompt_block


def test_session_memory_multilingual_context():
    mgr = SessionMemoryManager(session_id="test_02", phone_number="+15551234567")
    mgr.set_caller_name("Carlos")
    mgr.extract_and_update("Necesito información sobre los precios de los servicios de consultoría")
    
    assert mgr.caller_name == "Carlos"
    assert mgr.turn_count == 1
    assert any("consultoría" in p.lower() or "precios" in p.lower() for p in mgr.key_points)


def test_session_memory_serialization():
    mgr = SessionMemoryManager(session_id="test_04", phone_number="+919876543210")
    mgr.set_caller_name("John")
    mgr.extract_and_update("I am looking for software consulting")
    
    d = mgr.to_dict()
    assert d["caller_name"] == "John"
    assert d["session_id"] == "test_04"
    assert d["turn_count"] == 1
    
    restored = SessionMemoryManager.from_dict(d)
    assert restored.caller_name == "John"
    assert restored.session_id == "test_04"
    assert restored.turn_count == 1


def test_telephony_system_prompt_anti_repetition_and_memory():
    mgr = SessionMemoryManager(session_id="test_05")
    mgr.set_caller_name("Rohit")
    mgr.extract_and_update("Looking for luxury villa in Goa")
    mem_block = mgr.get_memory_prompt_block()
    
    prompt = TelephonyCallingEngine.build_telephony_system_prompt(
        agent_name="Nikita",
        business_type="Real Estate Advisory",
        configured_language="Hindi (India)",
        session_memory_context=mem_block,
    )
    
    assert "NEVER repeat greetings" in prompt
    assert "Rohit" in prompt
    assert "ACTIVE SESSION MEMORY" in prompt
    assert "Real Estate Advisory" in prompt


def test_live_knowledge_latency_short_circuit():
    async def run_async():
        # Conversational turn: should return None in <1ms without hitting external network
        res = await LiveKnowledgeService.resolve_realtime_knowledge_query("Mera naam Rohit hai aur mujhe kal aana hai")
        assert res is None

        # Explicit weather question: should resolve weather
        weather_res = await LiveKnowledgeService.resolve_realtime_knowledge_query("what is the weather in Mumbai?")
        assert weather_res is not None
        assert "WEATHER GROUND TRUTH" in weather_res

    asyncio.run(run_async())


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
