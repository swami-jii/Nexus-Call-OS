"""
Clean Database Tenants & De-duplicate Data Script
Preserves:
- Super Admin: admin@createcall.ai (role: super_admin)
- Real Users: mukeshswami7827@gmail.com, mukeshgod7827@gmail.com (role: user)
- Real Workspace items belonging to admin and real users
Purges:
- Test junk accounts: user_a_*, user_b_*, tester.qa@*
- Test organizations: User A Logistics Corp, User B Healthcare Clinic, QA Tester's Workspace
- Test dummy agents and contacts associated with test orgs
- Duplicate/spam audit log rows
"""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from datetime import datetime, timezone
from backend.database.session import SessionLocal
from backend.models.models import (
    User,
    Organization,
    Agent,
    Contact,
    Campaign,
    CallLog,
    Workflow,
    AuditLog,
    Notification,
    ApiKey,
    DeviceSession,
    KnowledgeDocument,
    PhoneNumber,
)


def run_cleanup():
    db = SessionLocal()
    try:
        print("--- Starting Database Cleanup ---")

        # 1. Identify users to keep vs users to purge
        all_users = db.query(User).all()
        preserved_emails = {
            "admin@createcall.ai",
            "mukeshswami7827@gmail.com",
            "mukeshgod7827@gmail.com",
        }

        users_to_keep = []
        users_to_delete = []

        for u in all_users:
            email = (u.email or "").strip().lower()
            if email in preserved_emails or (
                not email.startswith("user_a_")
                and not email.startswith("user_b_")
                and not email.startswith("tester.qa")
                and "@test.com" not in email
                and "@example.com" not in email
            ):
                users_to_keep.append(u)
            else:
                users_to_delete.append(u)

        print(f"Users to keep ({len(users_to_keep)}): {[u.email for u in users_to_keep]}")
        print(f"Users to delete ({len(users_to_delete)}): {[u.email for u in users_to_delete]}")

        # Delete device sessions and audit logs for deleted users
        deleted_user_ids = [u.id for u in users_to_delete]
        if deleted_user_ids:
            db.query(DeviceSession).filter(DeviceSession.user_id.in_(deleted_user_ids)).delete(synchronize_session=False)
            db.query(Notification).filter(Notification.user_id.in_(deleted_user_ids)).delete(synchronize_session=False)
            db.query(ApiKey).filter(ApiKey.user_id.in_(deleted_user_ids)).delete(synchronize_session=False)
            db.query(AuditLog).filter(AuditLog.user_id.in_(deleted_user_ids)).delete(synchronize_session=False)
            for u in users_to_delete:
                db.delete(u)
            db.commit()
            print(f"Deleted {len(users_to_delete)} test users.")

        # 2. Normalize roles of kept users
        for u in users_to_keep:
            if u.email == "admin@createcall.ai":
                u.role = "super_admin"
                u.is_verified = True
                u.is_active = True
            else:
                u.role = "user"
                u.is_verified = True
                u.is_active = True
        db.commit()
        print("Normalized user roles: admin is 'super_admin', all other users are 'user'.")

        # 3. Clean up test organizations
        valid_org_ids = set([u.organization_id for u in users_to_keep if u.organization_id])
        all_orgs = db.query(Organization).all()
        for org in all_orgs:
            if org.id not in valid_org_ids:
                # Delete items in this test org
                db.query(Agent).filter(Agent.organization_id == org.id).delete(synchronize_session=False)
                db.query(Contact).filter(Contact.organization_id == org.id).delete(synchronize_session=False)
                db.query(Campaign).filter(Campaign.organization_id == org.id).delete(synchronize_session=False)
                db.query(CallLog).filter(CallLog.organization_id == org.id).delete(synchronize_session=False)
                db.query(Workflow).filter(Workflow.organization_id == org.id).delete(synchronize_session=False)
                db.query(PhoneNumber).filter(PhoneNumber.organization_id == org.id).delete(synchronize_session=False)
                db.query(KnowledgeDocument).filter(KnowledgeDocument.organization_id == org.id).delete(synchronize_session=False)
                db.query(Notification).filter(Notification.organization_id == org.id).delete(synchronize_session=False)
                db.query(AuditLog).filter(AuditLog.organization_id == org.id).delete(synchronize_session=False)
                db.delete(org)
                print(f"Deleted test organization: '{org.name}' ({org.id})")
        db.commit()

        # 4. Clean up any dummy test agents & contacts not belonging to valid orgs
        if valid_org_ids:
            db.query(Agent).filter(~Agent.organization_id.in_(valid_org_ids)).delete(synchronize_session=False)
            db.query(Contact).filter(~Contact.organization_id.in_(valid_org_ids)).delete(synchronize_session=False)
            # Remove any dummy named contacts or agents if present
            db.query(Agent).filter(Agent.name.ilike("%Freight Agent%")).delete(synchronize_session=False)
            db.query(Agent).filter(Agent.name.ilike("%Clinic Triage%")).delete(synchronize_session=False)
            db.query(Contact).filter(Contact.name.ilike("%Alice UserA%")).delete(synchronize_session=False)
            db.commit()

        # 5. De-duplicate repeated spam audit logs
        all_audit_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()
        seen_events = set()
        duplicate_log_ids = []

        for log in all_audit_logs:
            # Group by user_id, action, resource, and timestamp minute
            dt_minute = log.created_at.strftime("%Y-%m-%d %H:%M") if log.created_at else "none"
            key = (str(log.user_id), str(log.action), str(log.resource), dt_minute)
            if key in seen_events:
                duplicate_log_ids.append(log.id)
            else:
                seen_events.add(key)

        if duplicate_log_ids:
            db.query(AuditLog).filter(AuditLog.id.in_(duplicate_log_ids)).delete(synchronize_session=False)
            db.commit()
            print(f"Removed {len(duplicate_log_ids)} duplicate/spam audit log rows.")

        print("--- Database Cleanup Complete Successfully ---")
    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_cleanup()
