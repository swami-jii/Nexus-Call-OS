import sqlite3
import os
import sys
from pathlib import Path

# Add project root directory to sys.path
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.core.config import settings

def update_database():
    db_path = settings.DATABASE_URL.replace('sqlite:///', '')
    print(f"Connecting to database at: {db_path}")
    if not os.path.exists(db_path):
        print("Database not found!")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Update organizations
    cur.execute("UPDATE organizations SET name = replace(name, 'Nexus', 'Create Call OS'), slug = replace(slug, 'nexus', 'create-call') WHERE name LIKE '%Nexus%' OR slug LIKE '%nexus%';")
    print(f"Updated organizations: {cur.rowcount} rows")

    # 2. Update workspace_settings
    cur.execute("UPDATE workspace_settings SET webhook_url = replace(webhook_url, 'nexus.ai', 'createcall.ai'), features = replace(replace(features, 'Nexus Europe Ltd.', 'Create Call OS Workspace'), 'nexus.ai', 'createcall.ai') WHERE features LIKE '%Nexus%' OR webhook_url LIKE '%nexus%';")
    print(f"Updated workspace_settings: {cur.rowcount} rows")

    # 3. Update users emails
    cur.execute("UPDATE users SET email = replace(email, '@nexus.ai', '@createcall.ai') WHERE email LIKE '%@nexus.ai%';")
    print(f"Updated users: {cur.rowcount} rows")

    # 4. Update provider_credentials
    cur.execute("UPDATE provider_credentials SET metadata_json = replace(metadata_json, 'Nexus', 'Create Call OS'), provider_name = replace(provider_name, 'Nexus', 'Create Call OS'), base_url = replace(base_url, 'nexuscall.io', 'createcall.ai') WHERE metadata_json LIKE '%Nexus%' OR provider_name LIKE '%Nexus%' OR base_url LIKE '%nexus%';")
    print(f"Updated provider_credentials: {cur.rowcount} rows")

    # 5. Update webhook_subscriptions
    cur.execute("UPDATE webhook_subscriptions SET custom_headers = replace(custom_headers, 'nexus', 'createcall') WHERE custom_headers LIKE '%nexus%';")
    print(f"Updated webhook_subscriptions: {cur.rowcount} rows")

    conn.commit()
    conn.close()
    print("Database branding update completed successfully!")

if __name__ == "__main__":
    update_database()
