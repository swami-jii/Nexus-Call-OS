import sys
from pathlib import Path

PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import json
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.session import SessionLocal
from backend.models.models import User
from backend.core.security import create_access_token

client = TestClient(app)

def test_dashboard():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "mukeshswami7827@gmail.com").first()
        admin = db.query(User).filter(User.email == "admin@createcall.ai").first()

        def print_overview(u, label):
            tok = create_access_token(subject=u.id, roles=[u.role])
            res = client.get("/api/analytics/dashboard-overview", headers={"Authorization": f"Bearer {tok}"})
            print(f"=== {label} STATUS: {res.status_code} ===")
            if res.status_code == 200:
                data = res.json()
                print(f"User Name: {data.get('user_name')}")
                print(f"User Email: {data.get('user_email')}")
                print(f"User Role: {data.get('user_role')}")
                print(f"Org ID: {data.get('organization_id')}")
                print(f"Metrics: {json.dumps(data.get('metrics'), indent=2)}")
                print(f"Onboarding: {json.dumps(data.get('onboarding'), indent=2)}")
                print(f"Providers Status: {json.dumps(data.get('providers_status'), indent=2)}")
                print(f"Recent Calls: {len(data.get('recent_calls', []))}")
                print(f"Recent Agents: {len(data.get('recent_agents', []))}")
            else:
                print(f"Error: {res.text}")
            print("-" * 60)

        print_overview(user, "REGULAR USER (Mukesh Swami)")
        print_overview(admin, "SUPER ADMIN")
    finally:
        db.close()

if __name__ == "__main__":
    test_dashboard()

