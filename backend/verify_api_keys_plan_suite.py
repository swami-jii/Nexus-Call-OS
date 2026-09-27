"""
Comprehensive Verification Suite for API Key Plan Quotas & Super Admin Governance
"""
import os
import sys
import datetime

# Add current dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.session import SessionLocal
from models import User, Organization, ApiKey, SubscriptionPlanConfig, TenantPlanOverride, AuditLog
from services.payment_service import ensure_default_plans_seeded
from routers.api_keys import _resolve_tenant_api_entitlements

def run_tests():
    db = SessionLocal()
    print("=" * 60)
    print("STARTING API KEY PLAN & GOVERNANCE TEST SUITE")
    print("=" * 60)

    try:
        # 1. Ensure seed plans exist
        ensure_default_plans_seeded(db)
        plans = db.query(SubscriptionPlanConfig).all()
        print(f"[TEST 1] Found {len(plans)} subscription plans in DB:")
        for p in plans:
            print(f"  - Plan: {p.name} ({p.plan_key}): max_api_keys={getattr(p, 'max_api_keys', None)}, webhook_api_enabled={p.webhook_api_enabled}, rate_limit={getattr(p, 'api_rate_limit_per_min', None)}rpm")

        assert len(plans) >= 4, "Expected at least 4 default plans (starter, pro, business, enterprise)"

        # 2. Test Super Admin user entitlements
        super_admin = db.query(User).filter(User.role == "super_admin").first()
        if not super_admin:
            super_admin = User(
                email="admin@createcall.ai",
                full_name="Mukesh Swami",
                role="super_admin",
                is_active=True,
                is_verified=True
            )
            db.add(super_admin)
            db.commit()
            db.refresh(super_admin)

        sa_entitlements = _resolve_tenant_api_entitlements(db, super_admin, None)
        print("\n[TEST 2] Super Admin Entitlements:")
        print(f"  - is_super_admin: {sa_entitlements['is_super_admin']}")
        print(f"  - max_api_keys: {sa_entitlements['max_api_keys']} (Expected: 999999)")
        print(f"  - webhook_api_enabled: {sa_entitlements['webhook_api_enabled']}")
        print(f"  - plan_name: {sa_entitlements['plan_name']}")
        assert sa_entitlements['is_super_admin'] is True
        assert sa_entitlements['max_api_keys'] >= 99999
        assert sa_entitlements['webhook_api_enabled'] is True

        # 3. Test Standard Tenant on Starter plan (should have webhook_api_enabled=False or max_api_keys=1)
        test_org = db.query(Organization).filter(Organization.slug == "test-starter-org").first()
        if not test_org:
            test_org = Organization(
                name="Starter Test Org",
                slug="test-starter-org",
                plan="starter"
            )
            db.add(test_org)
            db.commit()
            db.refresh(test_org)
        else:
            test_org.plan = "starter"
            db.commit()

        test_user = db.query(User).filter(User.email == "test_starter_user@example.com").first()
        if not test_user:
            test_user = User(
                email="test_starter_user@example.com",
                hashed_password="mock_hash_for_test",
                full_name="Test Starter User",
                role="user",
                organization_id=test_org.id,
                is_active=True,
                is_verified=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)

        # Clear any existing overrides for this test org
        db.query(TenantPlanOverride).filter(TenantPlanOverride.organization_id == test_org.id).delete()
        db.commit()

        starter_entitlements = _resolve_tenant_api_entitlements(db, test_user, test_org.id)
        print("\n[TEST 3] Starter Plan Entitlements for Standard User:")
        print(f"  - plan_key: {starter_entitlements['plan_key']}")
        print(f"  - webhook_api_enabled: {starter_entitlements['webhook_api_enabled']}")
        print(f"  - max_api_keys: {starter_entitlements['max_api_keys']}")
        print(f"  - api_rate_limit_per_min: {starter_entitlements['api_rate_limit_per_min']}")
        assert starter_entitlements['is_super_admin'] is False
        assert starter_entitlements['plan_key'] == "starter"

        # 4. Test Pro Plan Entitlements
        test_org.plan = "pro"
        db.commit()
        pro_entitlements = _resolve_tenant_api_entitlements(db, test_user, test_org.id)
        print("\n[TEST 4] Pro Plan Entitlements:")
        print(f"  - plan_key: {pro_entitlements['plan_key']}")
        print(f"  - webhook_api_enabled: {pro_entitlements['webhook_api_enabled']}")
        print(f"  - max_api_keys: {pro_entitlements['max_api_keys']} (Expected: 5)")
        print(f"  - api_rate_limit_per_min: {pro_entitlements['api_rate_limit_per_min']} (Expected: 300)")
        assert pro_entitlements['webhook_api_enabled'] is True
        assert pro_entitlements['max_api_keys'] == 5
        assert pro_entitlements['api_rate_limit_per_min'] == 300

        # 5. Test Custom Tenant Plan Override
        custom_override = TenantPlanOverride(
            organization_id=test_org.id,
            user_id=test_user.id,
            custom_plan_name="VIP Enterprise Custom",
            allocated_minutes=25000,
            allocated_concurrency=50,
            allocated_rag_storage_mb=5000,
            is_custom_override=True,
            notes="Custom API Limits: max_api_keys=20, rate_limit=1200rpm, daily_quota=100000req",
            granted_by_admin_id=super_admin.id
        )
        db.add(custom_override)
        db.commit()

        override_entitlements = _resolve_tenant_api_entitlements(db, test_user, test_org.id)
        print("\n[TEST 5] Custom Tenant Override Entitlements:")
        print(f"  - plan_name: {override_entitlements['plan_name']}")
        print(f"  - max_api_keys: {override_entitlements['max_api_keys']} (Expected: 20)")
        print(f"  - api_rate_limit_per_min: {override_entitlements['api_rate_limit_per_min']} (Expected: 1200)")
        print(f"  - api_daily_quota: {override_entitlements['api_daily_quota']} (Expected: 100000)")
        assert override_entitlements['max_api_keys'] == 20
        assert override_entitlements['api_rate_limit_per_min'] == 1200
        assert override_entitlements['api_daily_quota'] == 100000

        # Clean up test data
        db.query(TenantPlanOverride).filter(TenantPlanOverride.organization_id == test_org.id).delete()
        db.commit()

        print("\n" + "=" * 60)
        print("ALL API KEY PLAN & GOVERNANCE TESTS PASSED (5/5) SUCCESS!")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
