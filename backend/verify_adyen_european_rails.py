import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi.testclient import TestClient
from backend.main import app
from backend.database.session import SessionLocal
from backend.services.payment_service import ensure_default_gateways_seeded, get_gateway_credentials

def verify_adyen_european_rails():
    print("=" * 80)
    print("VERIFYING ADYEN & EUROPEAN DIRECT BANKING INTEGRATION")
    print("=" * 80)

    db = SessionLocal()
    client = TestClient(app)

    # 1. Seed & Verify Gateway Status from Super Admin DB
    ensure_default_gateways_seeded(db)
    creds = get_gateway_credentials(db, "adyen")
    print("\n[CHECK 1] Super Admin Adyen Config Status:")
    print(f"  - Gateway Key: {creds.get('gateway_key')}")
    print(f"  - Is Enabled: {creds.get('is_enabled')}")
    print(f"  - Is Configured: {creds.get('is_configured')}")
    print(f"  - Merchant ID: {creds.get('merchant_id')}")
    print(f"  - Public Key: {creds.get('public_key')}")
    assert creds.get('is_configured') == True, "Adyen should be marked as configured in Super Admin DB!"

    # 2. Test GET /api/billing/gateways
    res = client.get("/api/billing/gateways")
    assert res.status_code == 200, f"Gateways endpoint failed: {res.text}"
    gateways = res.json()
    adyen_gw = next((g for g in gateways if g.get("gateway_key") == "adyen"), None)
    assert adyen_gw is not None, "Adyen gateway missing from /api/billing/gateways!"
    print("\n[CHECK 2] GET /api/billing/gateways Response for Adyen:")
    print(f"  - Display Name: {adyen_gw.get('display_name')}")
    print(f"  - is_configured: {adyen_gw.get('is_configured')}")
    print(f"  - is_enabled: {adyen_gw.get('is_enabled')}")
    assert adyen_gw.get("is_configured") == True, "Adyen must report is_configured: True to frontend!"

    # 3. Test All 6 European Direct Banking Rails via /api/billing/checkout/initiate
    rails = [
        ("ideal", "iDEAL 2.0 (Netherlands)", "ING", "NL02 INGB 0123 4567 89"),
        ("bancontact", "Bancontact & Payconiq (Belgium)", "Belfius", "BE68 5390 0754 7034"),
        ("sofort", "Sofort / Giropay (Germany)", "Deutsche Bank", "DE89 3704 0044 0532 0130 00"),
        ("cartes_bancaires", "Cartes Bancaires (France)", "BNP Paribas", "FR76 3000 4000 0112 3456 7890 123"),
        ("eps", "EPS Überweisung (Austria)", "Erste Bank", "AT61 2011 1000 0012 3456"),
        ("blik", "BLIK 6-Digit (Poland)", "PKO Bank Polski", "PL61 1020 1014 0000 0712 1981 2840"),
    ]

    for bank_code, rail_name, selected_bank, sample_iban in rails:
        print(f"\n[CHECK 3] Testing European Rail: {rail_name} ({bank_code})...")
        payload = {
            "type": "wallet_topup",
            "amount_usd": 25.0,
            "currency": "EUR",
            "gateway": "adyen",
            "billing_name": "Mukesh Swami",
            "billing_email": "mukesh@createcall.ai",
            "billing_country": "DE",
            "adyen_sub_tab": "local_banking",
            "adyen_bank": bank_code,
            "adyen_ideal_bank": selected_bank if bank_code == "ideal" else None,
            "adyen_bancontact_bank": selected_bank if bank_code == "bancontact" else None,
            "adyen_sofort_bank": selected_bank if bank_code == "sofort" else None,
            "adyen_cb_bank": selected_bank if bank_code == "cartes_bancaires" else None,
            "adyen_eps_bank": selected_bank if bank_code == "eps" else None,
            "adyen_blik_bank": selected_bank if bank_code == "blik" else None,
            "adyen_blik_code": "782 914" if bank_code == "blik" else None,
            "adyen_iban": sample_iban,
            "adyen_account_holder": "Mukesh Swami"
        }
        res = client.post("/api/billing/checkout/initiate", json=payload)
        assert res.status_code in (200, 201), f"Checkout failed for {rail_name}: {res.text}"
        tx_data = res.json()
        assert tx_data.get("gateway") == "adyen", f"Wrong gateway recorded: {tx_data}"
        assert "transaction_id" in tx_data, f"Transaction ID missing: {tx_data}"
        print(f"  -> SUCCESS! Transaction ID: {tx_data.get('transaction_id')}")
        print(f"  -> Order ID: {tx_data.get('gateway_order_id')}")
        print(f"  -> Currency: {tx_data.get('currency')} | Amount: {tx_data.get('amount_local')} EUR")
        print(f"  -> Payment Rail Verified: {rail_name}")

    print("\n" + "=" * 80)
    print("ALL 6 EUROPEAN DIRECT BANKING RAILS FULLY VERIFIED WITH BACKEND & SUPER ADMIN!")
    print("=" * 80)

if __name__ == "__main__":
    verify_adyen_european_rails()
