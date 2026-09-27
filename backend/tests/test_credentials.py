from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_credentials_flow():
    # 1. We need auth token. Assuming a test login flow or mock.
    # Since we can't easily mock the DB in this raw script without setup, 
    # we will rely on a health check style test or test failure on missing auth.
    
    # Test unauthenticated access (returns dev operator user in dev mode)
    res = client.get("/api/credentials/")
    assert res.status_code in [200, 401]

    # In a full test suite we would mock `get_current_user` and `get_db`.
    # Let's override dependencies for the test.
    from backend.auth.deps import get_current_user
    from backend.database.session import get_db
    from backend.models.models import User
    
    class MockUser:
        id = "test-user-id"
        organization_id = "test-org-id"
        role = "super_admin"
        
    app.dependency_overrides[get_current_user] = lambda: MockUser()
    
    # Let's test the validation endpoint which doesn't need DB for some providers if it hits httpx directly
    res = client.post("/api/credentials/test", json={
        "provider": "openai",
        "api_key": "invalid-key"
    })
    # Will likely return 400 because httpx will fail with invalid key
    assert res.status_code == 400
    detail_lower = res.json().get("detail", "").lower()
    assert any(k in detail_lower for k in ["invalid", "error", "failed"])
    
    app.dependency_overrides.clear()


def test_regular_user_save_and_manage_credentials():
    from backend.auth.deps import get_current_user
    
    class MockRegularUser:
        id = "regular-user-id"
        organization_id = "regular-user-org-123"
        role = "user"
        email = "user@company.com"
        
    app.dependency_overrides[get_current_user] = lambda: MockRegularUser()
    
    # Regular user saves LLM provider with is_owner=True
    res = client.post("/api/credentials/", json={
        "provider": "openai",
        "category": "llm",
        "is_owner": True,
        "primary_model": "gpt-4o",
        "selection_strategy": "dynamic",
        "api_key": "sk-test-real-format-key-1234567890"
    })
    
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    assert res.json().get("status") == "success"
    
    # Regular user saves Voice engine
    res_voice = client.post("/api/credentials/", json={
        "provider": "elevenlabs",
        "category": "voice",
        "is_owner": True,
        "default_voice_id": "21m00Tcm4TlvDq8ikWAM",
        "selection_strategy": "dynamic",
        "api_key": "xi-test-real-format-key-1234567890"
    })
    assert res_voice.status_code == 200, f"Expected 200, got {res_voice.status_code}: {res_voice.text}"
    
    # Query credentials
    res_get = client.get("/api/credentials/")
    assert res_get.status_code == 200
    creds = res_get.json().get("credentials", [])
    assert any(c["provider"] == "openai" for c in creds)
    assert any(c["provider"] == "elevenlabs" for c in creds)
    
    app.dependency_overrides.clear()
