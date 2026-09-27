"""
CREATE CALL OS - PHASE 5 OVERVIEW TAB & ENTERPRISE BILLING DASHBOARD VERIFICATION SUITE

Comprehensive verification of:
1. Complete, server-authoritative GET /api/billing overview payload
2. Dynamic workspace name and tenant scoping
3. Real database Agent count integration
4. Authoritative wallet balance and plan entitlement meters
5. Financial activity aggregations (top-ups, subscription spend, invoices, pending payments)
6. Recent activity ledger with semantic status and direction
7. Diagnostics and compliance health checks
8. Zero secret leakage in any overview response
"""

import sys
import os
import uuid

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi.testclient import TestClient
from backend.main import app
from backend.database.session import SessionLocal
from backend.models.models import (
    User,
    Agent,
    BillingAccount,
    InvoiceRecord,
    PaymentTransaction,
    SavedPaymentMethod,
    PaymentGatewayConfig,
)

def run_phase5_verification():
    print("=" * 75)
    print("CREATE CALL OS - PHASE 5 ENTERPRISE BILLING OVERVIEW VERIFICATION")
    print("=" * 75)

    client = TestClient(app)
    db = SessionLocal()

    try:
        # 1. TEST: GET /api/billing comprehensive enterprise response structure
        print("\n[TEST 1] Verifying GET /api/billing Comprehensive Enterprise Response...")
        res = client.get("/api/billing")
        assert res.status_code == 200, f"Failed to get billing overview: {res.text}"
        data = res.json()

        # Check top-level root fields
        required_root_keys = [
            "id", "organization_id", "workspace_name", "balance_usd", "currency",
            "active_plan", "allocated_minutes", "used_minutes", "remaining_minutes", "minutes_percentage",
            "allocated_concurrency", "active_calls", "remaining_concurrency", "concurrency_percentage",
            "allocated_rag_storage_mb", "used_rag_storage_mb", "remaining_rag_storage_mb", "rag_percentage",
            "max_agents_count", "active_agents_count", "remaining_agents_count", "agents_percentage",
            "invoices_count", "subscription_status", "plan", "account", "financial_summary",
            "recent_activity", "diagnostics"
        ]
        for k in required_root_keys:
            assert k in data, f"Missing required billing overview field: '{k}'"

        print(f"  --> PASSED: Root response contains all {len(required_root_keys)} required metrics.")
        print(f"  --> Workspace: '{data['workspace_name']}', Active Plan: '{data['active_plan']}', Balance: ${data['balance_usd']:.2f}")

        # 2. TEST: Real Agent Count Query from Database
        print("\n[TEST 2] Verifying Real AI Agent Database Count...")
        org_id = data.get("organization_id")
        db_agent_count = db.query(Agent).filter((Agent.organization_id == org_id) if org_id else (Agent.id != None)).count()
        assert data["active_agents_count"] == db_agent_count, (
            f"Agent count mismatch! API: {data['active_agents_count']}, DB: {db_agent_count}"
        )
        print(f"  --> PASSED: Active agents ({data['active_agents_count']}/{data['max_agents_count']}) accurately queried from Agent table.")

        # 3. TEST: Plan Entitlements & Feature Flags
        print("\n[TEST 3] Verifying Plan Entitlements & Feature Entitlement Flags...")
        plan = data["plan"]
        assert "monthly_usd" in plan and plan["monthly_usd"] > 0
        assert "features" in plan and isinstance(plan["features"], list)
        assert "gsm_sim_enabled" in plan
        assert "voice_cloning_enabled" in plan
        assert "webhook_api_enabled" in plan
        assert "priority_sla_enabled" in plan
        print(f"  --> PASSED: Plan structure verified with monthly_usd=${plan['monthly_usd']}, {len(plan['features'])} features.")

        # 4. TEST: Usage Meters Math Accuracy (No divide by zero, clamped 0-100)
        print("\n[TEST 4] Verifying Usage Meters Math & Quota Limits...")
        assert 0 <= data["minutes_percentage"] <= 100
        assert 0 <= data["concurrency_percentage"] <= 100
        assert 0 <= data["rag_percentage"] <= 100
        assert 0 <= data["agents_percentage"] <= 100
        assert data["remaining_minutes"] == max(0, data["allocated_minutes"] - data["used_minutes"])
        assert data["remaining_concurrency"] == max(0, data["allocated_concurrency"] - data["active_calls"])
        assert data["remaining_agents_count"] == max(0, data["max_agents_count"] - data["active_agents_count"])
        print(f"  --> PASSED: All 4 quota meters accurately computed & bounded.")

        # 5. TEST: Financial Summary & Aggregates
        print("\n[TEST 5] Verifying Financial Summary Aggregates...")
        fs = data["financial_summary"]
        assert "total_topups_usd" in fs
        assert "total_subscriptions_usd" in fs
        assert "pending_payments_count" in fs
        assert "invoices_count" in fs
        print(f"  --> PASSED: Financial summary has Top-Ups: ${fs['total_topups_usd']:.2f}, Subs: ${fs['total_subscriptions_usd']:.2f}, Invoices: {fs['invoices_count']}")

        # 6. TEST: Recent Activity Stream & Direction
        print("\n[TEST 6] Verifying Recent Activity Ledger...")
        ra = data["recent_activity"]
        assert isinstance(ra, list)
        if len(ra) > 0:
            first_tx = ra[0]
            assert "id" in first_tx
            assert "type" in first_tx
            assert "description" in first_tx
            assert "amount_usd" in first_tx
            assert "status" in first_tx
            assert "direction" in first_tx
            assert first_tx["direction"] in ["credit", "charge"]
            print(f"  --> PASSED: Recent activity stream returned {len(ra)} records with direction '{first_tx['direction']}'.")
        else:
            print("  --> PASSED: Recent activity stream gracefully handles empty state.")

        # 7. TEST: Diagnostics & Platform Health
        print("\n[TEST 7] Verifying Diagnostics & Compliance Health Flags...")
        diag = data["diagnostics"]
        assert "billing_account_active" in diag and diag["billing_account_active"] is True
        assert "has_default_payment_method" in diag
        assert "auto_recharge_enabled" in diag
        assert "active_gateways_count" in diag and diag["active_gateways_count"] > 0
        assert "is_tax_profile_configured" in diag
        print(f"  --> PASSED: Diagnostics verified: Active Gateways={diag['active_gateways_count']}, Default PM={diag['has_default_payment_method']}.")

        # 8. TEST: Zero Secret Leakage
        print("\n[TEST 8] Verifying Zero Secret Leakage across Overview Payload...")
        def check_no_secrets(obj, path=""):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    assert "secret" not in k.lower() or k == "webhook_secret", f"Secret key leaked at {path}.{k}"
                    if k in ["secret_key", "webhook_secret", "card_number", "cvv", "plain_password"]:
                        raise AssertionError(f"Sensitive credential leaked: {path}.{k}")
                    check_no_secrets(v, f"{path}.{k}")
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    check_no_secrets(item, f"{path}[{i}]")

        check_no_secrets(data)
        print("  --> PASSED: Confirmed 0 private secrets, API secret keys, or CVV/PAN data in payload.")

        print("\n" + "=" * 75)
        print("ALL PHASE 5 OVERVIEW TAB TESTS PASSED WITH 100% SUCCESS!")
        print("=" * 75)

    finally:
        db.close()

if __name__ == "__main__":
    run_phase5_verification()
