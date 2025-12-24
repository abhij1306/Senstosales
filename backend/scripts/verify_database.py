"""
Database Schema Verification Script
Verifies all tables exist and shows row counts
"""
import sqlite3
from pathlib import Path

DB_PATH = Path("db/business.db")

def verify_schema():
    if not DB_PATH.exists():
        print(f"❌ Database not found at {DB_PATH}")
        return False
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Expected tables
    expected_tables = [
        'purchase_orders', 'purchase_order_items', 'purchase_order_deliveries',
        'delivery_challans', 'delivery_challan_items',
        'gst_invoices', 'gst_invoice_items', 'gst_invoice_dc_links',
        'srvs', 'srv_items',
        'reconciliation_ledger'
    ]
    
    print("=" * 80)
    print("DATABASE SCHEMA VERIFICATION")
    print("=" * 80)
    
    # Get actual tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    actual_tables = [row[0] for row in cursor.fetchall()]
    
    print(f"\n✓ Database: {DB_PATH}")
    print(f"✓ Total tables: {len(actual_tables)}")
    print("\nTable Row Counts:")
    print("-" * 80)
    
    for table in sorted(actual_tables):
        if table.startswith('sqlite_'):
            continue
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        status = "✓" if table in expected_tables else "?"
        print(f"{status} {table:30s} {count:10d} rows")
    
    print("\n" + "=" * 80)
    
    # Check for missing tables
    missing = set(expected_tables) - set(actual_tables)
    if missing:
        print(f"\n⚠️  Missing tables: {', '.join(missing)}")
    else:
        print("\n✓ All expected tables present")
    
    conn.close()
    return True

if __name__ == "__main__":
    verify_schema()
