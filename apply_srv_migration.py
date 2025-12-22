"""
Apply SRV tables migration to the database.
"""
import sqlite3
import sys
from pathlib import Path

# Get database path
db_path = Path(__file__).parent / "backend" / "database" / "business.db"
migration_path = Path(__file__).parent / "migrations" / "v4_add_srv_tables.sql"

if not db_path.exists():
    print(f"❌ Database not found at {db_path}")
    sys.exit(1)

if not migration_path.exists():
    print(f"❌ Migration file not found at {migration_path}")
    sys.exit(1)

print(f"📊 Applying migration: {migration_path.name}")
print(f"📁 Database: {db_path}")

try:
    # Read migration SQL
    with open(migration_path, 'r') as f:
        migration_sql = f.read()
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Execute migration
    cursor.executescript(migration_sql)
    conn.commit()
    
    # Verify tables were created
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('srvs', 'srv_items')")
    tables = cursor.fetchall()
    
    if len(tables) == 2:
        print("✅ Migration successful!")
        print(f"   Created tables: {', '.join([t[0] for t in tables])}")
    else:
        print(f"⚠️  Migration completed but only {len(tables)} tables found")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Migration failed: {e}")
    sys.exit(1)
