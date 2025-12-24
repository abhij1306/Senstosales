import sqlite3
conn = sqlite3.connect('sales_manager.db')
cursor = conn.cursor()
tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print('Tables:', [t[0] for t in tables])
conn.close()
