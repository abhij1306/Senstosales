import sqlite3
import sys
import os

# Add backend to path to find app modules if needed, but we can just use raw sqlite here
DB_PATH = "backend/senstosales.db"

def debug_dc(dc_number):
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print(f"--- Debugging DC: {dc_number} ---")

    # 1. Check Header
    header = cursor.execute("SELECT * FROM delivery_challans WHERE dc_number = ?", (dc_number,)).fetchone()
    if not header:
        print("DC Header: NOT FOUND")
        conn.close()
        return
    else:
        print("DC Header: FOUND")
        print(dict(header))

    # 2. Check Raw Items (no joins)
    raw_items = cursor.execute("SELECT * FROM delivery_challan_items WHERE dc_number = ?", (dc_number,)).fetchall()
    print(f"\nRaw Items Found: {len(raw_items)}")
    for item in raw_items:
        print(dict(item))

    # 3. Check Joined Query (what the API uses)
    query = """
        SELECT 
            dci.id,
            dci.dispatch_qty,
            poi.id as poi_id,
            poi.po_item_no
        FROM delivery_challan_items dci
        LEFT JOIN purchase_order_items poi ON dci.po_item_id = poi.id
        WHERE dci.dc_number = ?
    """
    joined_items = cursor.execute(query, (dc_number,)).fetchall()
    print(f"\nJoined Items Check: {len(joined_items)}")
    
    for item in joined_items:
        status = "OK" if item['poi_id'] else "ORPHANED (No matching PO Item)"
        print(f"Item ID: {item['id']}, PO Item ID: {item['poi_id']}, Status: {status}")

    conn.close()

if __name__ == "__main__":
    debug_dc("DC003")
