import sqlite3
import os
import sys

sys.path.insert(0, os.path.abspath("."))
from backend.core.config import settings

db_path = settings.DATABASE_URL.replace("sqlite:///", "")
print(f"Connecting to database at: {db_path}")

if not os.path.exists(db_path):
    print("Database file does not exist!")
    sys.exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
print(f"Total tables: {len(tables)}\n")
for t in sorted(tables):
    name = t[0]
    cols = cursor.execute(f"PRAGMA table_info({name});").fetchall()
    col_names = [c[1] for c in cols]
    print(f"Table: {name}")
    print(f"  Columns: {col_names}")
