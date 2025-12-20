import sqlite3
import os

db_path = 'senstosales.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(delivery_challan_items)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Columns in delivery_challan_items: {columns}")
    if 'lot_no' not in columns:
        print("MISSING: lot_no")
    else:
        print("PRESENT: lot_no")
except Exception as e:
    print(f"Error: {e}")
finally:
    if conn:
        conn.close()
