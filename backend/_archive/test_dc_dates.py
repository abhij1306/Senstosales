import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / "database" / "business.db"
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Check sample DC data
print("Sample Delivery Challans:")
rows = cursor.execute("SELECT dc_number, dc_date, po_number FROM delivery_challans LIMIT 5").fetchall()
for row in rows:
    print(f"  DC: {row[0]}, Date: {row[1]}, PO: {row[2]}")

# Test the date conversion query
print("\nTesting date filter query:")
query = """
SELECT dc_number, dc_date, po_number
FROM delivery_challans
WHERE date(substr(dc_date, 7, 4) || '-' || substr(dc_date, 4, 2) || '-' || substr(dc_date, 1, 2)) 
      BETWEEN date('2022-01-01') AND date('2024-12-31')
"""
rows = cursor.execute(query).fetchall()
print(f"Rows found: {len(rows)}")
for row in rows:
    print(f"  DC: {row[0]}, Date: {row[1]}, PO: {row[2]}")

conn.close()
