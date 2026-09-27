import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi.testclient import TestClient
from backend.main import app
from backend.database.session import SessionLocal
from backend.services.payment_service import ensure_default_gateways_seeded, get_gateway_credentials

def verify_gateway_setup_and_live_states():
    print("=" * 80)
    print("VERIFYING GATEWAY CONFIGURATION & LIVE/SETUP STATUSES")
    print("=" * 80)

    db = SessionLocal()
    client = TestClient(app)

    # 1. Seed Gateways
    ensure_default_gateways_seeded(db)

    # 2. Check Razorpay Status
    rzp_creds = get_gateway_credentials(db, "razorpay")
    print("\n[CHECK 1] Razorpay Status:")
    print(f"  - is_configured: {rzp_creds.get('is_configured')}")
    print(f"  - is_enabled: {rzp_creds.get('is_enabled')}")
    assert rzp_creds.get('is_configured') == True, "Razorpay must be configured!"

    # 3. Check Bank Wire Status
    wire_creds = get_gateway_credentials(db, "bank_transfer")
    print("\n[CHECK 2] Bank Wire Status:")
    print(f"  - is_configured: {wire_creds.get('is_configured')}")
    print(f"  - is_enabled: {wire_creds.get('is_enabled')}")
    assert wire_creds.get('is_configured') == True, "Bank Wire must be configured!"

    # 4. Check Adyen / Stripe / Unconfigured Status
    adyen_creds = get_gateway_credentials(db, "adyen")
    print("\n[CHECK 3] Adyen (Unconfigured in Super Admin) Status:")
    print(f"  - is_configured: {adyen_creds.get('is_configured')}")
    print(f"  - is_enabled: {adyen_creds.get('is_enabled')}")
    assert adyen_creds.get('is_configured') == False, "Adyen must report is_configured: False when no real keys exist!"

    # 5. Test GET /api/billing/gateways API Response
    res = client.get("/api/billing/gateways")
    assert res.status_code == 200, f"Gateways endpoint failed: {res.text}"
    gateways = res.json()
    
    rzp_gw = next((g for g in gateways if g.get("gateway_key") == "razorpay"), None)
    wire_gw = next((g for g in gateways if g.get("gateway_key") == "bank_transfer"), None)
    adyen_gw = next((g for g in gateways if g.get("gateway_key") == "adyen"), None)
    stripe_gw = next((g for g in gateways if g.get("gateway_key") == "stripe"), None)

    print("\n[CHECK 4] API /api/billing/gateways Statuses:")
    print(f"  - Razorpay -> is_configured: {rzp_gw.get('is_configured')} (Should be True)")
    print(f"  - Bank Wire -> is_configured: {wire_gw.get('is_configured')} (Should be True)")
    print(f"  - Adyen -> is_configured: {adyen_gw.get('is_configured')} (Should be False - Pending Setup)")
    print(f"  - Stripe -> is_configured: {stripe_gw.get('is_configured')} (Should be False - Pending Setup)")

    assert rzp_gw.get('is_configured') == True
    assert wire_gw.get('is_configured') == True
    assert adyen_gw.get('is_configured') == False
    assert stripe_gw.get('is_configured') == False

    print("\n" + "=" * 80)
    print("ALL GATEWAY CONFIG STATUSES VERIFIED ACCURATELY! REAL LIVE vs PENDING SETUP IS 100% CORRECT!")
    print("=" * 80)

if __name__ == "__main__":
    verify_gateway_setup_and_live_states()
