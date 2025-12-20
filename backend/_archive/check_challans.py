import sqlite3

conn = sqlite3.connect('sales_manager.db')
cursor = conn.cursor()

# Check total challans
total = cursor.execute('SELECT COUNT(*) FROM delivery_challans').fetchone()[0]
print(f'Total Challans: {total}')

# Check sample data
rows = cursor.execute('SELECT dc_number, dc_date, po_number FROM delivery_challans LIMIT 5').fetchall()
print(f'\nSample Challans:')
for row in rows:
    print(f'  DC: {row[0]}, Date: {row[1]}, PO: {row[2]}')

# Test the date conversion query
print('\nTesting date conversion query:')
query = """
SELECT 
    dc.dc_number,
    dc.dc_date,
    dc.po_number
FROM delivery_challans dc
WHERE date(substr(dc.dc_date, 7, 4) || '-' || substr(dc.dc_date, 4, 2) || '-' || substr(dc.dc_date, 1, 2)) 
      BETWEEN date('2022-01-01') AND date('2024-12-31')
LIMIT 5
"""
rows = cursor.execute(query).fetchall()
print(f'Rows with date filter: {len(rows)}')
for row in rows:
    print(f'  DC: {row[0]}, Date: {row[1]}, PO: {row[2]}')

conn.close()
