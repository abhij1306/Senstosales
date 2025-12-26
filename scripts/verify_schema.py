import sqlite3
import os

# Try to find the DB in common locations
possible_paths = [
    r"c:\Users\abhij\.gemini\antigravity\scratch\SenstoSales\db\business.db",
    r"backend\db\business.db"
]

db_path = None
for p in possible_paths:
    if os.path.exists(p):
        db_path = p
        break

if not db_path:
    print("Could not find database file")
    exit(1)

print(f"Inspecting DB at: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(gst_invoices)")
    columns = [row[1] for row in cursor.fetchall()]
    
    print(f"Columns in gst_invoices: {columns}")
    
    if "gemc_date" in columns:
        print("SUCCESS: gemc_date found")
    else:
        print("FAILURE: gemc_date NOT found")
        
    conn.close()

except Exception as e:
    print(f"Error: {e}")
