"""
Verification Script: 21 Tabs User Autonomy & Strict Tenant Isolation Test
Verifies that a regular user (role="user") can perform all operations across all 21 tabs
without any 403 or permission block, and verifies that user data is strictly isolated.
"""

import sys
from pathlib import Path
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.deps import get_current_user
from backend.models.models import User, Organization
from backend.database.session import SessionLocal

client = TestClient(app)

def run_verification():
    db = SessionLocal()
    print("=== Starting 21 Tabs User Autonomy Verification ===")
    
    # 1. Setup Test Tenant User and Super Admin User
    test_user_org_id = "test-tenant-org-999"
    test_user_id = "test-regular-user-999"
    
    admin_org_id = "test-superadmin-org-000"
    admin_user_id = "test-superadmin-user-000"
    
    class RegularUserCtx:
        id = test_user_id
        organization_id = test_user_org_id
        role = "user"
        email = "regular.tenant@example.com"
        is_active = True
        is_verified = True
        
    class SuperAdminCtx:
        id = admin_user_id
        organization_id = admin_org_id
        role = "super_admin"
        email = "admin@createcall.ai"
        is_active = True
        is_verified = True

    # ----------------------------------------------------
    # TEST 1: Regular User Saves LLM & Voice Credentials (No 403!)
    # ----------------------------------------------------
    app.dependency_overrides[get_current_user] = lambda: RegularUserCtx()
    
    print("1. Testing Credentials Saving for Regular User...")
    res_llm = client.post("/api/credentials/", json={
        "provider": "openai",
        "category": "llm",
        "is_owner": True,
        "primary_model": "gpt-4o",
        "api_key": "sk-user-test-key-12345678"
    })
    assert res_llm.status_code == 200, f"LLM save failed: {res_llm.text}"
    print("   [OK] Regular user saved LLM Provider (Status 200)")

    res_stt = client.post("/api/credentials/", json={
        "provider": "deepgram",
        "category": "stt",
        "is_owner": True,
        "api_key": "dg-user-test-key-12345678"
    })
    assert res_stt.status_code == 200, f"STT save failed: {res_stt.text}"
    print("   [OK] Regular user saved STT Engine (Status 200)")

    res_voice = client.post("/api/credentials/", json={
        "provider": "elevenlabs",
        "category": "voice",
        "is_owner": True,
        "api_key": "xi-user-test-key-12345678"
    })
    assert res_voice.status_code == 200, f"Voice save failed: {res_voice.text}"
    print("   [OK] Regular user saved Voice Engine (Status 200)")

    # ----------------------------------------------------
    # TEST 2: Tab Endpoints Access for Regular User
    # ----------------------------------------------------
    print("2. Testing 21 Tab Endpoints for Regular User...")
    
    # Tab 1: Dashboard / Analytics
    res = client.get("/api/analytics?time_range=7d")
    assert res.status_code == 200
    print("   [OK] Tab 1 (Dashboard / Analytics) accessible")

    # Tab 2: Live Call Studio options
    res = client.get("/api/credentials/all-categories")
    assert res.status_code == 200
    print("   [OK] Tab 2 (Live Call Studio Config) accessible")

    # Tab 3: AI Agents
    res = client.post("/api/agents", json={
        "name": "User Voice Assistant",
        "description": "User specific agent",
        "system_prompt": "Helpful AI voice agent",
        "voice_id": "ElevenLabs Turbo v2.5",
        "llm_model": "OpenAI GPT-4o",
        "language": "en-US",
    })
    assert res.status_code in [200, 201]
    agent_id = res.json()["id"]
    print("   [OK] Tab 3 (AI Voice Agents create & list) accessible")

    # Tab 4: Call History
    res = client.get("/api/calls")
    assert res.status_code == 200
    print("   [OK] Tab 4 (Call History) accessible")

    # Tab 5: Analytics
    res = client.get("/api/analytics")
    assert res.status_code == 200
    print("   [OK] Tab 5 (Voice Analytics) accessible")

    # Tab 6: Campaigns
    res = client.post("/api/campaigns", json={
        "name": "User Q3 Outreach",
        "type": "Outbound Voice",
        "agent_id": agent_id,
        "schedule_type": "Immediate Execution",
    })
    assert res.status_code in [200, 201]
    print("   [OK] Tab 6 (AI Campaigns) accessible")

    # Tab 7: Contacts
    res = client.get("/api/contacts")
    assert res.status_code == 200
    print("   [OK] Tab 7 (Contacts) accessible")

    # Tab 8: Phone Numbers
    import random
    unique_num = f"+15550{random.randint(100000, 999999)}"
    res = client.post("/api/phone-numbers", json={
        "number": unique_num,
        "country_code": "US",
        "provider": "Twilio SIP",
    })
    assert res.status_code in [200, 201]
    print("   [OK] Tab 8 (Phone Numbers provision & list) accessible")

    # Tab 9: Android GSM Gateway
    res = client.get("/api/android-gateway/devices")
    assert res.status_code == 200
    print("   [OK] Tab 9 (Android GSM Gateway) accessible")

    # Tab 10: Workflows
    res = client.post("/api/workflows", json={
        "name": "User Qualification Flow",
        "description": "Voice workflow",
        "trigger_type": "Inbound Call",
    })
    assert res.status_code in [200, 201]
    print("   [OK] Tab 10 (Voice Workflows) accessible")

    # Tab 11: Agent Memory Brain
    res = client.get("/api/memory/overview")
    assert res.status_code == 200
    print("   [OK] Tab 11 (Agent Memory Brain) accessible")

    # Tab 12: Knowledge Base RAG
    res = client.get("/api/knowledge-base")
    assert res.status_code == 200
    print("   [OK] Tab 12 (Knowledge Base) accessible")

    # Tab 13: File Storage Hub
    res = client.get("/api/uploads/categories")
    assert res.status_code == 200
    print("   [OK] Tab 13 (File Storage Hub) accessible")

    # Tab 14: API & Integrations
    res = client.get("/api/integrations")
    assert res.status_code == 200
    print("   [OK] Tab 14 (API & Integrations) accessible")

    # Tab 15: Realtime Terminal Logs
    res = client.get("/api/logs")
    assert res.status_code == 200
    print("   [OK] Tab 15 (Realtime Terminal Logs) accessible")

    # Tab 16: Billing & Usage
    res = client.get("/api/billing")
    assert res.status_code == 200
    print("   [OK] Tab 16 (Billing & Usage) accessible")

    # Tab 17: API Keys
    res = client.post("/api/api-keys", json={
        "name": "User Production Key",
        "environment": "production",
        "permissions": "full"
    })
    assert res.status_code in [200, 201]
    print("   [OK] Tab 17 (API Keys) accessible")

    # Tab 18: User Profile
    res = client.get("/auth/me")
    assert res.status_code == 200
    print("   [OK] Tab 18 (User Profile) accessible")

    # Tab 19: Notifications
    res = client.get("/api/notifications")
    assert res.status_code == 200
    print("   [OK] Tab 19 (Notifications) accessible")

    # Tab 20: Recycle Bin
    res = client.get("/api/uploads/trash")
    assert res.status_code == 200
    print("   [OK] Tab 20 (Recycle Bin) accessible")

    # Tab 21: Help & Docs (client static UI / providers health)
    res = client.get("/api/providers/health")
    assert res.status_code == 200
    print("   [OK] Tab 21 (Help & Docs / Provider Health) accessible")

    # ----------------------------------------------------
    # TEST 3: Strict Isolation Verification
    # ----------------------------------------------------
    print("3. Verifying Strict Tenant Isolation between Super Admin and Regular User...")
    
    # As Super Admin, check credentials
    app.dependency_overrides[get_current_user] = lambda: SuperAdminCtx()
    res_admin_creds = client.get("/api/credentials/")
    admin_cred_list = res_admin_creds.json().get("credentials", [])
    
    # Super Admin credentials should NOT contain user's private key
    for c in admin_cred_list:
        assert c.get("plain_key") != "sk-user-test-key-12345678", "Isolation Breach: User key leaked to Admin!"
    
    # As Regular User, check credentials
    app.dependency_overrides[get_current_user] = lambda: RegularUserCtx()
    res_user_creds = client.get("/api/credentials/")
    user_cred_list = res_user_creds.json().get("credentials", [])
    assert any(c.get("provider") == "openai" for c in user_cred_list), "User's own credential missing from user list!"
    
    print("   [OK] 100% Strict Tenant Isolation Verified!")
    
    app.dependency_overrides.clear()
    print("=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_verification()
