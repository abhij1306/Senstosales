import sqlite3
import os

# Connect to DB
db_path = r"c:\Users\abhij\.gemini\antigravity\scratch\SenstoSales\db\business.db"
print(f"Connecting to {db_path}...")

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    query_str = "%PO%"

    # Test 1: PO
    print("\n--- Testing PO Query ---")
    try:
        conn.execute("""
            SELECT rowid as id, po_number, supplier_name, po_value, po_status, po_date
            FROM purchase_orders
            WHERE po_number LIKE ? OR supplier_name LIKE ?
            ORDER BY po_date DESC LIMIT 5
        """, (query_str, query_str)).fetchall()
        print("✅ PO Query Success")
    except Exception as e:
        print(f"❌ PO Query Failed: {e}")

    # Test 2: DC
    print("\n--- Testing DC Query ---")
    try:
        conn.execute("""
            SELECT rowid as id, dc_number, supplier_name, dc_status, dc_date
            FROM delivery_challans
            WHERE dc_number LIKE ? OR supplier_name LIKE ?
            ORDER BY dc_date DESC LIMIT 5
        """, (query_str, query_str)).fetchall()
        print("✅ DC Query Success")
    except Exception as e:
        print(f"❌ DC Query Failed: {e}")

    # Test 3: Invoice
    print("\n--- Testing Invoice Query ---")
    try:
        conn.execute("""
            SELECT rowid as id, invoice_number, buyer_name, total_invoice_value, invoice_date
            FROM gst_invoices
            WHERE invoice_number LIKE ? OR buyer_name LIKE ?
            ORDER BY invoice_date DESC LIMIT 5
        """, (query_str, query_str)).fetchall()
        print("✅ Invoice Query Success")
    except Exception as e:
        print(f"❌ Invoice Query Failed: {e}")

    # Test 4: SRV
    print("\n--- Testing SRV Query ---")
    try:
        conn.execute("""
            SELECT rowid as id, srv_number, created_at
            FROM srvs
            WHERE srv_number LIKE ?
            ORDER BY created_at DESC LIMIT 5
        """, (query_str,)).fetchall()
        print("✅ SRV Query Success")
    except Exception as e:
        print(f"❌ SRV Query Failed: {e}")

except Exception as e:
    print(f"Global Error: {e}")
finally:
    if 'conn' in locals(): conn.close()
