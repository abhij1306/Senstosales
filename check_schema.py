import sqlite3

db_path = "backend/database/business.db"
try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("Tables:", tables)
    
    if ('gst_invoices',) in tables:
        print("\n--- gst_invoices Schema ---")
        cursor.execute("PRAGMA table_info(gst_invoices)")
        for col in cursor.fetchall():
            print(col)
            
    # Check for items table
    item_tables = [t[0] for t in tables if 'item' in t[0]]
    print("\nItem Tables:", item_tables)
    
    for t in item_tables:
        print(f"\n--- {t} Schema ---")
        cursor.execute(f"PRAGMA table_info({t})")
        for col in cursor.fetchall():
            print(col)

except Exception as e:
    print(e)
finally:
    if 'conn' in locals():
        conn.close()
