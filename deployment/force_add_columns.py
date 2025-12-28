import sqlite3
import os

db_path = r"c:\Users\abhij\.gemini\antigravity\scratch\SenstoSales\db\business.db"

if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

print(f"Connecting to: {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check first
cursor.execute("PRAGMA table_info(gst_invoices)")
columns = [r[1] for r in cursor.fetchall()]

new_columns = [
    ("gemc_number", "TEXT"),
    ("gemc_date", "TEXT"),
    ("srv_no", "TEXT"),
    ("srv_date", "TEXT"),
    ("despatch_doc_no", "TEXT"),
    ("mode_of_payment", "TEXT"),
    ("payment_terms", "TEXT DEFAULT '45 Days'")
]

try:
    for col_name, col_def in new_columns:
        if col_name not in columns:
            print(f"Adding column: {col_name}")
            cursor.execute(f"ALTER TABLE gst_invoices ADD COLUMN {col_name} {col_def}")
        else:
            print(f"Column exists: {col_name}")

    conn.commit()
    print("Schema update committed successfully.")

except Exception as e:
    print(f"Error updating schema: {e}")
    conn.rollback()
finally:
    conn.close()
