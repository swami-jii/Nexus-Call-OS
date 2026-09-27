import sys
from pathlib import Path

PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import json
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.session import SessionLocal
from backend.models.models import User, CallLog
from backend.core.security import create_access_token

client = TestClient(app)

def test_live_studio_e2e():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "mukeshswami7827@gmail.com").first()
        admin = db.query(User).filter(User.email == "admin@createcall.ai").first()

        assert user is not None, "Regular user not found!"
        assert admin is not None, "Super admin not found!"

        user_tok = create_access_token(subject=user.id, roles=[user.role])
        user_headers = {"Authorization": f"Bearer {user_tok}"}

        admin_tok = create_access_token(subject=admin.id, roles=[admin.role])
        admin_headers = {"Authorization": f"Bearer {admin_tok}"}

        # Initial call count for user and admin
        user_initial_calls = db.query(CallLog).filter(CallLog.organization_id == user.organization_id).count()
        admin_initial_calls = db.query(CallLog).filter(CallLog.organization_id == admin.organization_id).count()

        print(f"=== INITIAL STATE ===")
        print(f"User Initial Calls: {user_initial_calls}")
        print(f"Admin Initial Calls: {admin_initial_calls}")

        # Test Mode 1: Browser Mic Call for User
        session_id = f"CreateCallOS_Studio_WebRTC_{user.id[:6]}"
        print(f"\n=== 1. Starting Browser Mic Call Session ({session_id}) ===")
        start_payload = {
            "session_id": session_id,
            "phone_number": "TEST-BROWSER-MIC-01",
            "mode": "demo",
            "business_type": "Customer Support",
            "language": "hi-IN",
        }
        res_start = client.post("/api/demo/sessions/start", json=start_payload, headers=user_headers)
        print(f"Start Session Status: {res_start.status_code}")
        assert res_start.status_code == 200, f"Start failed: {res_start.text}"
        start_data = res_start.json()
        print(f"Greeting Text: {start_data.get('greeting_text')}")

        # Process a speech turn
        print("\n=== 2. Processing Conversational Turn ===")
        turn_payload = {
            "session_id": session_id,
            "user_speech_text": "Hello, I want to inquire about your calling services and pricing.",
        }
        res_turn = client.post("/api/demo/sessions/turn", json=turn_payload, headers=user_headers)
        print(f"Turn Status: {res_turn.status_code}")
        assert res_turn.status_code == 200, f"Turn failed: {res_turn.text}"
        turn_data = res_turn.json()["turn_data"]
        print(f"AI Response: {turn_data.get('ai_response')}")
        print(f"Pipeline Latencies: {turn_data.get('pipeline_latencies')}")
        print(f"Tokens Used: {turn_data.get('tokens_used')}")

        # End Call Session
        print("\n=== 3. Ending Session and Persisting CallLog ===")
        end_payload = {
            "duration_seconds": 32,
            "phone_number": "TEST-BROWSER-MIC-01",
            "contact_name": "Test Browser Mic 1",
            "call_mode": "mic",
            "transcript": [
                {"speaker": "ai", "text": start_data.get("greeting_text"), "timestamp": "00:00"},
                {"speaker": "user", "text": "Hello, I want to inquire about your calling services and pricing.", "timestamp": "00:05"},
                {"speaker": "ai", "text": turn_data.get("ai_response"), "timestamp": "00:10"}
            ]
        }
        res_end = client.post(f"/api/demo/sessions/{session_id}/end", json=end_payload, headers=user_headers)
        print(f"End Session Status: {res_end.status_code}")
        assert res_end.status_code == 200, f"End failed: {res_end.text}"
        end_data = res_end.json()
        print(f"Summary Report Call ID: {end_data.get('call_id')}")
        print(f"Summary: {end_data.get('summary')}")
        print(f"Cost: ${end_data.get('cost')}")

        # Verify Database Isolation
        user_new_calls = db.query(CallLog).filter(CallLog.organization_id == user.organization_id).count()
        admin_new_calls = db.query(CallLog).filter(CallLog.organization_id == admin.organization_id).count()

        print("\n=== 4. Verifying DB Tenant Isolation ===")
        print(f"User New Calls: {user_new_calls} (Expected: {user_initial_calls + 1})")
        print(f"Admin New Calls: {admin_new_calls} (Expected: {admin_initial_calls})")

        assert user_new_calls == user_initial_calls + 1, "User call log was not saved to user org!"
        assert admin_new_calls == admin_initial_calls, "Admin calls were improperly modified!"

        # Verify Dashboard overview updates live for user
        res_dash = client.get("/api/analytics/dashboard-overview", headers=user_headers)
        assert res_dash.status_code == 200
        dash_data = res_dash.json()
        print(f"\n=== 5. User Dashboard Realtime Update ===")
        print(f"Dashboard Total Calls for User: {dash_data['metrics']['total_calls']}")
        print(f"Dashboard Talk Minutes: {dash_data['metrics']['total_talk_minutes']}")
        print(f"Recent Calls in Dashboard Feed: {len(dash_data['recent_calls'])}")

        assert dash_data["metrics"]["total_calls"] == user_new_calls
        print("\n[SUCCESS] ALL LIVE CALL STUDIO & DATA ISOLATION TESTS PASSED 100%!")

    finally:
        db.close()

if __name__ == "__main__":
    test_live_studio_e2e()
