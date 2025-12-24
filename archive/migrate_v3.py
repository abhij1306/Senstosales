import sqlite3
import sys

from pathlib import Path

# Path from backend/migrate_v3.py to backend/database/business.db
DB_PATH = Path(__file__).parent / "database" / "business.db"

def migrate():
    print(f"Migrating {DB_PATH}...")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check current columns
        cursor.execute("PRAGMA table_info(delivery_challan_items)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Current columns: {columns}")
        
        if 'lot_no' not in columns:
            print("Adding lot_no column...")
            cursor.execute("ALTER TABLE delivery_challan_items ADD COLUMN lot_no INTEGER;")
            conn.commit()
            print("Migration successful: lot_no added.")
        else:
            print("Migration skipped: lot_no already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate()
