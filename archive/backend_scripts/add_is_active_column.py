import sqlite3
import os

DB_PATH = "backend/database/business.db"

def add_column():
    print(f"Connecting to {DB_PATH}...")
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    try:
        # Add is_active column if it doesn't exist
        # 1 = Active, 0 = Inactive (Deleted)
        print("Adding 'is_active' column to srvs table...")
        conn.execute("ALTER TABLE srvs ADD COLUMN is_active INTEGER DEFAULT 1")
        print("Success.")
        conn.commit()
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column 'is_active' already exists.")
        else:
            print(f"Error adding column: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_column()
