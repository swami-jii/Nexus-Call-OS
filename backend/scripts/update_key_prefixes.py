from backend.database.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    res1 = db.execute(text("UPDATE api_keys SET key_prefix = REPLACE(key_prefix, 'nx_', 'create_call_os_') WHERE key_prefix LIKE 'nx_%'"))
    res2 = db.execute(text("UPDATE api_keys SET key_prefix = REPLACE(key_prefix, 'cc_', 'create_call_os_') WHERE key_prefix LIKE 'cc_%'"))
    db.commit()
    print(f"Updated keys in DB to create_call_os_ prefix successfully.")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
