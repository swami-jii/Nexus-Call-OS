"""
End-to-End Verification Test for Super Admin vs Regular User Role Architecture & Data Isolation
"""

import sys
from pathlib import Path

PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.database.session import SessionLocal
from backend.models.models import User, Organization, Agent, Contact, AuditLog
from backend.core.security import create_access_token
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def run_tests():
    db = SessionLocal()
    try:
        print("=== 1. Testing Database Cleanliness ===")
        users = db.query(User).all()
        print(f"Total Users in DB: {len(users)}")
        for u in users:
            print(f" - {u.email} | Role: {u.role} | Org: {u.organization_id}")
            assert u.role in ("super_admin", "user"), f"Invalid role: {u.role}"
        
        super_admin = db.query(User).filter(User.email == "admin@createcall.ai").first()
        assert super_admin is not None, "Super admin not found!"
        assert super_admin.role == "super_admin", "Super admin role mismatch!"

        regular_user = db.query(User).filter(User.email == "mukeshswami7827@gmail.com").first()
        assert regular_user is not None, "Regular user not found!"
        assert regular_user.role == "user", "Regular user role should be 'user'!"

        print("DB verification passed!")

        print("\n=== 2. Testing Super Admin API Access ===")
        admin_token = create_access_token(subject=super_admin.id, roles=[super_admin.role])
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Admin metrics
        res = client.get("/api/admin/metrics", headers=admin_headers)
        assert res.status_code == 200, f"Failed metrics: {res.text}"
        metrics = res.json()
        print(f"Admin Metrics: total_users={metrics['total_users']}, total_orgs={metrics['total_organizations']}")
        assert metrics["total_users"] == len(users)

        # Admin users list
        res = client.get("/api/admin/users", headers=admin_headers)
        assert res.status_code == 200, f"Failed users list: {res.text}"
        admin_users = res.json()["items"]
        print(f"Admin Users Count: {len(admin_users)}")
        for au in admin_users:
            print(f" -> User: {au['email']} ({au['role']}) - Provider: {au['auth_provider']} - Org: {au['organization_name']}")

        # Admin audit logs
        res = client.get("/api/audit-logs?scope=all", headers=admin_headers)
        assert res.status_code == 200, f"Failed audit logs: {res.text}"
        print(f"Platform Audit Logs Count: {res.json()['total']}")

        print("\n=== 3. Testing Regular User Multi-Tenant Isolation ===")
        user_token = create_access_token(subject=regular_user.id, roles=[regular_user.role])
        user_headers = {"Authorization": f"Bearer {user_token}"}

        # Regular user trying to access /api/admin/metrics -> MUST BE 403 FORBIDDEN
        res = client.get("/api/admin/metrics", headers=user_headers)
        assert res.status_code == 403, f"Regular user should get 403 on admin metrics, got {res.status_code}"
        print("Regular user correctly blocked from /api/admin/metrics (403 Forbidden)")

        # Regular user trying to access /api/admin/users -> MUST BE 403 FORBIDDEN
        res = client.get("/api/admin/users", headers=user_headers)
        assert res.status_code == 403, f"Regular user should get 403 on admin users, got {res.status_code}"
        print("Regular user correctly blocked from /api/admin/users (403 Forbidden)")

        # Regular user listing agents -> only their own agents (0 if brand new, clean state)
        res = client.get("/api/agents", headers=user_headers)
        assert res.status_code == 200
        user_agents = res.json()["items"]
        print(f"Regular User Agents Count: {len(user_agents)} (isolated)")
        assert len(user_agents) == 0, f"Regular user should see 0 agents initially, got {len(user_agents)}"

        # Regular user listing contacts -> only their own contacts (0 if brand new, clean state)
        res = client.get("/api/contacts", headers=user_headers)
        assert res.status_code == 200
        user_contacts = res.json()["items"]
        print(f"Regular User Contacts Count: {len(user_contacts)} (isolated)")
        assert len(user_contacts) == 0, f"Regular user should see 0 contacts initially, got {len(user_contacts)}"

        # Regular user creates a new agent -> strictly belongs to their workspace
        new_agent_payload = {
            "name": "Mukesh Support Bot",
            "description": "Customer care voice bot",
            "system_prompt": "You are a helpful customer support agent.",
            "voice_id": "ElevenLabs Turbo v2.5",
            "llm_model": "Gemini 1.5 Pro",
            "language": "en-US",
            "temperature": 0.7,
            "status": "active"
        }
        res = client.post("/api/agents", json=new_agent_payload, headers=user_headers)
        assert res.status_code == 201, f"Failed agent creation: {res.text}"
        created_agent = res.json()
        print(f"Regular User created agent: {created_agent['name']} ({created_agent['id']})")
        assert created_agent["organization_id"] == regular_user.organization_id

        # Check that regular user now sees 1 agent
        res = client.get("/api/agents", headers=user_headers)
        assert res.json()["total"] == 1

        # Check that Super Admin does not have this agent polluting their own workspace view
        admin_agents_res = client.get("/api/agents", headers=admin_headers)
        admin_agent_ids = [a["id"] for a in admin_agents_res.json()["items"]]
        assert created_agent["id"] not in admin_agent_ids, "Regular user's agent leaked into super admin's private workspace view!"
        print("Regular user's agent is strictly isolated from super admin workspace!")

        # Clean up test agent
        del_res = client.delete(f"/api/agents/{created_agent['id']}", headers=user_headers)
        assert del_res.status_code == 200
        print("Cleaned up test agent successfully.")

        print("\n=== ALL TESTS PASSED SUCCESSFULLY! ===")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
