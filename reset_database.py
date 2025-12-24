"""
Complete database reset with ALL migrations in correct order
"""
import sqlite3
from pathlib import Path

DB_PATH = Path("db/business.db")

# Ensure DB exists
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
if DB_PATH.exists():
    DB_PATH.unlink()
    print("✓ Deleted old database")

conn = sqlite3.connect(str(DB_PATH))
print(f"✓ Created new database: {DB_PATH}\n")

# Migrations in CORRECT dependency order
migrations = [
    "migrations/v1_initial.sql",                      # Base schema
    "migrations/v4_add_srv_tables.sql",               # SRV tables  
    "migrations/002_add_alerts.sql",                  # Alerts
    "migrations/003_add_drawing_number_and_po_notes.sql",  # PO Notes
    "migrations/005_add_srv_po_found.sql",            # SRV po_found column
    "migrations/006_fix_srv_schema.sql",              # SRV schema rebuild
    "migrations/007_add_missing_srv_fields.sql",      # SRV item fields
    "migrations/008_add_extended_srv_fields.sql",     # More SRV fields
    "migrations/009_add_lot_no_to_dc_items.sql",      # DC lot_no
    "migrations/010_reconciliation_hardening.sql",    # Adds is_active!!
    "migrations/011_fix_recon_view.sql",              # Uses is_active
    "migrations/012_add_rejected_qty_to_poi.sql",     # PO Item rejected_qty
]

success = 0
failed = 0

for migration_file in migrations:
    migration_path = Path(migration_file)
    if not migration_path.exists():
        print(f"⚠  SKIP: {migration_path.name} (not found)")
        continue
    
    print(f"Applying: {migration_path.name}...", end=" ")
    
    try:
        with open(migration_path, 'r') as f:
            sql = f.read()
        conn.executescript(sql)
        conn.commit()
        print("✓")
        success += 1
    except Exception as e:
        print(f"✗ ERROR: {e}")
        failed += 1

# Verify final schema
tables = [row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()]
print(f"\n{'='*60}")
print(f"Migration Complete: {success} success, {failed} failed")
print(f"{'='*60}")
print(f"\nTotal tables: {len(tables)}")
print("\nKey tables:")
for t in ["purchase_orders", "gst_invoices", "delivery_challans", "srvs", "alerts", "po_notes_templates"]:
    exists = t in tables
    print(f"  {t}: {'✓' if exists else '✗ MISSING'}")

# Check is_active column in srvs
print("\nSRV table check:")
srv_columns = [row[1] for row in conn.execute("PRAGMA table_info(srvs)").fetchall()]
has_is_active = 'is_active' in srv_columns
print(f"  is_active column: {'✓ EXISTS' if has_is_active else '✗ MISSING'}")

conn.close()
print(f"\n✓ Database ready!")
