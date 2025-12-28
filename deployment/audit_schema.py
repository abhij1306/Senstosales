import sqlite3
import os
import json

db_path = r"c:\Users\abhij\.gemini\antigravity\scratch\SenstoSales\db\business.db"

if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

tables = ["purchase_orders", "delivery_challans", "gst_invoices", "srvs", "buyers"]

schema_report = {}

for table in tables:
    try:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = cursor.fetchall()
        schema_report[table] = [col["name"] for col in columns]
    except Exception as e:
        schema_report[table] = f"Error: {e}"

print(json.dumps(schema_report, indent=2))

conn.close()
