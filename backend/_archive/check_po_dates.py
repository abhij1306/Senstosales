import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / "database" / "business.db"
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Check PO dates
print("Sample PO dates:")
rows = cursor.execute("SELECT po_number, po_date FROM purchase_orders LIMIT 10").fetchall()
for row in rows:
    print(f"  PO: {row[0]}, Date: {row[1]}")

conn.close()
