"""
Automated Test Suite for Demo & Production Control Center API
Nexus Call OS v2.4 Enterprise
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.deps import get_current_user

client = TestClient(app)


class MockUser:
    id = "test-demo-user"
    organization_id = "test-org-id"
    role = "super_admin"


@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: MockUser()
    yield
    app.dependency_overrides.clear()


def test_get_demo_config_options():
    res = client.get("/api/demo/config-options")
    assert res.status_code == 200
    data = res.json()
    assert "agents" in data
    assert "business_types" in data
    assert "llm_providers" in data
    assert "voice_engines" in data
    assert "knowledge_bases" in data


def test_demo_session_lifecycle():
    session_id = "test_demo_session_101"

    # 1. Start Demo Session
    start_res = client.post(
        "/api/demo/sessions/start",
        json={
            "session_id": session_id,
            "phone_number": "+18005550199",
            "mode": "demo",
            "business_type": "dental_clinic",
            "llm_provider": "ollama",
            "voice_engine": "piper",
        },
    )
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "success"

    # 2. Process Turn
    turn_res = client.post(
        "/api/demo/sessions/turn",
        json={
            "session_id": session_id,
            "user_speech_text": "I want to book a dental checkup for Saturday morning",
        },
    )
    assert turn_res.status_code == 200
    turn_data = turn_res.json()["turn_data"]
    assert "behavior_evaluation" in turn_data
    assert "pipeline_latencies" in turn_data
    assert "tokens_used" in turn_data

    # 3. End Session & Verify Post-Call Report
    end_res = client.post(f"/api/demo/sessions/{session_id}/end")
    assert end_res.status_code == 200
    report = end_res.json()["post_call_report"]
    assert report["session_id"] == session_id
    assert "lead_qualification" in report
    assert "appointment_result" in report
    assert "sentiment" in report
    assert "knowledge_sources_used" in report
