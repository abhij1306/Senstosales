import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / "database" / "business.db"
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# List all tables
tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print('Tables:', [t[0] for t in tables])

# Check for challan-related tables
for table in tables:
    if 'challan' in table[0].lower() or 'dc' in table[0].lower():
        print(f'\nTable: {table[0]}')
        columns = cursor.execute(f"PRAGMA table_info({table[0]})").fetchall()
        print('Columns:', [(c[1], c[2]) for c in columns])
        count = cursor.execute(f"SELECT COUNT(*) FROM {table[0]}").fetchone()[0]
        print(f'Row count: {count}')

conn.close()
