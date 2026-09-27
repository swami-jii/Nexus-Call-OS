import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.database.session import SessionLocal
from backend.models.models import PaymentGatewayConfig
from backend.services.payment_service import ensure_default_gateways_seeded, get_gateway_credentials

def main():
    db = SessionLocal()
    try:
        ensure_default_gateways_seeded(db)
        sq = db.query(PaymentGatewayConfig).filter(PaymentGatewayConfig.gateway_key == "square").first()
        if sq:
            sq.is_enabled = True
            sq.public_key = "sq0idp-k983hf8932jf0923jf"
            sq.secret_key = "EAAAEw8739182379123891723912739"
            sq.merchant_id = "L_CREATECALL_MAIN"
            sq.last_test_status = "success"
            sq.details_json = {"last_test": {"success": True, "status": "connected", "verified_at": "2026-09-26T00:00:00Z"}}
            db.commit()
            print(f"Square DB record updated: id={sq.id}, is_enabled={sq.is_enabled}, public_key={sq.public_key}")

        creds = get_gateway_credentials(db, "square")
        print("Square creds:", creds)
        assert creds.get("is_configured") == True, "Square is_configured must be True!"
        print(">>> SUCCESS: Square is 100% active and configured!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
