import pytest
from sqlalchemy.orm import Session

from backend.database.session import SessionLocal
from backend.models.models import AgentMemoryFact, AgentSessionMemory
from backend.services.session_memory_service import (
    build_autonomous_call_session,
    generate_canonical_session_id,
    generate_structured_session_id,
    get_historical_caller_context,
)


def test_canonical_session_ids_all_5_domains():
    """Verifies that all 5 domains generate canonical CreateCallOS_ IDs."""
    sid_voice = generate_canonical_session_id("voice_agents", "Nikita")
    assert sid_voice.startswith("CreateCallOS_VoiceAgent_Nikita_")

    sid_rag = generate_canonical_session_id("rag_knowledge", "1pdf")
    assert sid_rag.startswith("CreateCallOS_RAG_1pdf_")

    sid_wf = generate_canonical_session_id("workflows", "LoanEMI")
    assert sid_wf.startswith("CreateCallOS_Workflow_LoanEMI_")

    sid_studio = generate_canonical_session_id("demo_studio")
    assert sid_studio.startswith("CreateCallOS_Studio_WebRTC_")

    sid_gsm = generate_canonical_session_id("gsm_gateway", "SIM1")
    assert sid_gsm.startswith("CreateCallOS_GSM_SIM1_")


def test_autonomous_session_builder_5_domains():
    """Tests autonomous memory building across all 5 modules with DB persistence."""
    db: Session = SessionLocal()
    try:
        # 1. AI Voice Agents
        sess_agent = build_autonomous_call_session(
            db=db,
            channel_type="voice_agents",
            agent_id="35ff8ccb-a86b-4d77-b6e1-b12c3f7a4a0e",
            agent_name="Nikita",
            phone_number="+919876543210",
            caller_name="Rohan Gupta",
            initial_context="Caller inquired about enterprise VoIP SIP setup for 50 agents.",
            turns=[
                {"speaker": "assistant", "text": "Namaste! Main Nikita bol rahi hu. Kaise sahayata kar sakti hu?", "turn": 1},
                {"speaker": "user", "text": "Mera naam Rohan Gupta hai, mujhe 50 agents ke liye calling software chahiye.", "turn": 2},
                {"speaker": "assistant", "text": "Bilkul Rohan ji! Humare paas enterprise plan available hai.", "turn": 3},
            ],
            duration_sec=120,
            status="completed",
        )
        assert sess_agent.session_id.startswith("CreateCallOS_VoiceAgent_Nikita_")
        assert sess_agent.turn_count == 3
        assert sess_agent.status == "completed"

        # 2. Knowledge Base (RAG)
        sess_rag = build_autonomous_call_session(
            db=db,
            channel_type="rag_knowledge",
            caller_name="1.pdf Grounding Vault",
            phone_number="DOC: 1.pdf",
            initial_context="Retrieved section 4 SLA uptime policy with 94.2% cosine match.",
            turns=[
                {"speaker": "user", "text": "What is the uptime SLA in 1.pdf?", "turn": 1},
                {"speaker": "assistant", "text": "According to 1.pdf, Create Call OS guarantees 99.98% uptime.", "turn": 2},
            ],
            duration_sec=25,
            status="completed",
        )
        assert sess_rag.session_id.startswith("CreateCallOS_RAG_")
        assert sess_rag.agent_id == "dept_rag_knowledge"

        # 3. Voice Workflows
        sess_wf = build_autonomous_call_session(
            db=db,
            channel_type="workflows",
            caller_name="Loan EMI Verification Flow",
            phone_number="FLOW: #loan_emi",
            initial_context="Customer completed 4 IVR nodes and verified KYC for ₹5L personal loan.",
            turns=[
                {"speaker": "assistant", "text": "Press 1 for Personal Loan.", "turn": 1},
                {"speaker": "user", "text": "Selected 1 - Amount ₹5,00,000", "turn": 2},
            ],
            duration_sec=40,
            status="completed",
        )
        assert sess_wf.session_id.startswith("CreateCallOS_Workflow_")
        assert sess_wf.agent_id == "dept_workflows"

        # 4. Live Call Studio
        sess_studio = build_autonomous_call_session(
            db=db,
            channel_type="demo_studio",
            caller_name="Customer Support Inbound Sandbox",
            phone_number="WEBRTC_SANDBOX",
            initial_context="Microphone audio benchmark test running with 138ms latency and Opus 48kHz.",
            turns=[
                {"speaker": "assistant", "text": "Live Call Studio sandbox ready.", "turn": 1},
                {"speaker": "user", "text": "Testing sub-180ms audio latency and echo cancellation.", "turn": 2},
            ],
            duration_sec=30,
            status="completed",
        )
        assert sess_studio.session_id.startswith("CreateCallOS_Studio_WebRTC_")
        assert sess_studio.agent_id == "dept_demo_studio"

        # 5. Pair & Apps GSM Gateway
        sess_gsm = build_autonomous_call_session(
            db=db,
            channel_type="gsm_gateway",
            caller_name="GSM Cellular Callee",
            phone_number="+919811223344",
            device_id="gsm_gateway_01",
            device_name="GSM Gateway SIM 1 (Pixel 7)",
            initial_context="VoLTE hardware bridge established via Pixel 7 SIM 1 with -76 dBm carrier signal.",
            turns=[
                {"speaker": "assistant", "text": "Connecting via GSM SIM 1.", "turn": 1},
                {"speaker": "user", "text": "Call connected successfully.", "turn": 2},
            ],
            duration_sec=55,
            status="completed",
        )
        assert sess_gsm.session_id.startswith("CreateCallOS_GSM_SIM1_")
        assert sess_gsm.agent_id == "dept_gsm_gateway"

        # Verify Historical Context Retrieval for repeat caller
        hist = get_historical_caller_context(db=db, phone_number="+919876543210")
        assert "Rohan Gupta" in hist or "PREVIOUS CALLS" in hist

    finally:
        db.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
