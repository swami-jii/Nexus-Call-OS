import pytest
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
