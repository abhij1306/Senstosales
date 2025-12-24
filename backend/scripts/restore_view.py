import sqlite3
import os

DB_PATH = "backend/database/business.db"

def restore_view():
    print(f"Connecting to {DB_PATH}...")
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    
    # Drop if exists to ensure clean state
    conn.execute("DROP VIEW IF EXISTS reconciliation_ledger")
    
    # Create View using Subqueries to avoid Cartesian products
    sql = """
    CREATE VIEW reconciliation_ledger AS
    SELECT 
        poi.id as po_item_id,
        poi.po_number,
        poi.po_item_no,
        poi.material_code,
        poi.material_description,
        poi.item_value,
        poi.ord_qty as ordered_quantity,
        
        -- Calculated Fields via Subqueries
        
        -- Total Delivered (from DC Items)
        COALESCE((
            SELECT SUM(dci.dispatch_qty)
            FROM delivery_challan_items dci
            WHERE dci.po_item_id = poi.id
        ), 0) as total_delivered_qty,
        
        -- Total Received (from SRV Items, Active SRVs only)
        COALESCE((
            SELECT SUM(si.accepted_qty + si.rejected_qty)
            FROM srv_items si
            JOIN srvs s ON si.srv_number = s.srv_number
            WHERE si.po_number = poi.po_number 
              AND si.po_item_no = poi.po_item_no
              AND s.is_active = 1
        ), 0) as total_received_qty,
        
        -- Total Accepted
        COALESCE((
            SELECT SUM(si.accepted_qty)
            FROM srv_items si
            JOIN srvs s ON si.srv_number = s.srv_number
            WHERE si.po_number = poi.po_number 
              AND si.po_item_no = poi.po_item_no
              AND s.is_active = 1
        ), 0) as total_accepted_qty,
        
        -- Total Rejected
        COALESCE((
            SELECT SUM(si.rejected_qty)
            FROM srv_items si
            JOIN srvs s ON si.srv_number = s.srv_number
            WHERE si.po_number = poi.po_number 
              AND si.po_item_no = poi.po_item_no
              AND s.is_active = 1
        ), 0) as total_rejected_qty

    FROM purchase_order_items poi;
    """
    
    try:
        conn.execute(sql)
        print("Successfully created view 'reconciliation_ledger'")
        conn.commit()
    except Exception as e:
        print(f"Error creating view: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    restore_view()
