import sqlite3
import os

db_path = "backend/database/business.db"
# verify path
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("--- PO Format ---")
    cursor.execute("SELECT po_date FROM purchase_orders LIMIT 1")
    print(cursor.fetchone())

    print("\n--- DC Format ---")
    cursor.execute("SELECT dc_date FROM delivery_challans LIMIT 1")
    print(cursor.fetchone())

    print("\n--- Invoice Format ---")
    cursor.execute("SELECT invoice_date FROM gst_invoices LIMIT 1")
    print(cursor.fetchone())
except Exception as e:
    print(e)
finally:
    conn.close()
