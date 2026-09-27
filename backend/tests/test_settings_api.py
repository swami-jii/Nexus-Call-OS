import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database.session import SessionLocal
from backend.models.models import User, Organization, WorkspaceSettings


@pytest.fixture
def client():
    return TestClient(app)


def test_get_and_update_settings(client):
    # Test GET settings
    resp = client.get("/api/settings")
    assert resp.status_code == 200
    data = resp.json()
    assert "timezone" in data
    assert "default_tts_engine" in data
    assert "features" in data

    # Test PATCH settings
    patch_payload = {
        "timezone": "Asia/Kolkata",
        "default_tts_engine": "ElevenLabs Turbo v2.5",
        "features": {
            "workspaceName": "Create Call OS Enterprise Workspace",
            "currency": "INR (₹)",
            "noiseSuppression": True,
            "ipWhitelist": ["127.0.0.1", "10.0.0.0/24"],
        },
    }
    patch_resp = client.patch("/api/settings", json=patch_payload)
    assert patch_resp.status_code == 200
    updated_data = patch_resp.json()
    assert updated_data["timezone"] == "Asia/Kolkata"
    assert updated_data["features"]["workspaceName"] == "Create Call OS Enterprise Workspace"
    assert updated_data["features"]["currency"] == "INR (₹)"


def test_system_stats(client):
    resp = client.get("/api/settings/system-stats")
    assert resp.status_code == 200
    stats = resp.json()
    assert "call_count" in stats
    assert "total_workspace_mb" in stats
    assert "db_size_mb" in stats
    assert "rag_chunks_indexed" in stats
    assert "host_free_gb" in stats


def test_clear_cache(client):
    resp = client.post("/api/settings/clear-cache")
    assert resp.status_code == 200
    res = resp.json()
    assert res["success"] is True
    assert "freed_mb" in res


def test_webhook_test_execution(client):
    test_payload = {
        "url": "http://127.0.0.1:8000/api/health",
        "secret": "whsec_test_secret_12345",
        "event_type": "call.completed",
    }
    resp = client.post("/api/settings/test-webhook", json=test_payload)
    assert resp.status_code == 200
    res = resp.json()
    assert "event_type" in res
    assert "latency_ms" in res
    assert "signature" in res


def test_team_management(client):
    # Invite member
    invite_payload = {
        "name": "Sarah Connor",
        "email": "sarah.c@createcall.ai",
        "role": "Voice Architect",
        "scope": "Agent Flows & RAG Engineering",
    }
    resp = client.post("/api/settings/team/invite", json=invite_payload)
    assert resp.status_code == 200
    res = resp.json()
    assert res["success"] is True
    member_id = res["member"]["id"]
    assert res["member"]["name"] == "Sarah Connor"

    # Revoke member
    del_resp = client.delete(f"/api/settings/team/{member_id}")
    assert del_resp.status_code == 200
    del_res = del_resp.json()
    assert del_res["success"] is True
    assert not any(m.get("id") == member_id for m in del_res["teamMembers"])


def test_reset_defaults(client):
    resp = client.post("/api/settings/reset-defaults")
    assert resp.status_code == 200
    res = resp.json()
    assert res["success"] is True
    assert res["settings"]["default_tts_engine"] == "ElevenLabs Turbo v2.5"
