import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / "database" / "business.db"
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Check invoice dates
print("Sample Invoices:")
rows = cursor.execute("SELECT invoice_number, invoice_date FROM gst_invoices LIMIT 5").fetchall()
for row in rows:
    print(f"  Invoice: {row[0]}, Date: {row[1]}")

conn.close()
