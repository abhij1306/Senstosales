"""
Helper function to update SRVs when a previously missing PO is uploaded.
"""
from sqlalchemy import text
from datetime import datetime


def update_srvs_on_po_upload(po_number: str, db) -> int:
    """
    Update SRVs that reference a PO that was previously missing.
    Call this after a new PO is uploaded to link existing SRVs.
    
    Args:
        po_number: The PO number that was just uploaded
        db: Database session
        
    Returns:
        int: Number of SRVs updated
    """
    try:
        # Find SRVs with this PO number where po_found = 0
        srvs_to_update = db.execute("""
            SELECT srv_number, po_number
            FROM srvs
            WHERE po_number = :po_number AND po_found = 0
        """, {"po_number": po_number}).fetchall()
        
        if not srvs_to_update:
            return 0
        
        # Update these SRVs to mark po_found = 1
        db.execute("""
            UPDATE srvs
            SET po_found = 1, updated_at = :updated_at
            WHERE po_number = :po_number AND po_found = 0
        """, {
            "po_number": po_number,
            "updated_at": datetime.now().isoformat()
        })
        
        # For each SRV, update the PO item quantities
        for srv in srvs_to_update:
            # Get all items for this SRV
            srv_items = db.execute("""
                SELECT po_item_no, SUM(received_qty) as total_received, SUM(rejected_qty) as total_rejected
                FROM srv_items
                WHERE srv_number = :srv_number
                GROUP BY po_item_no
            """, {"srv_number": srv['srv_number']}).fetchall()
            
            # Update each PO item
            for item in srv_items:
                # Get aggregated totals from all SRVs for this PO item
                srv_totals = db.execute("""
                    SELECT 
                        COALESCE(SUM(received_qty), 0) as total_received,
                        COALESCE(SUM(rejected_qty), 0) as total_rejected
                    FROM srv_items
                    WHERE po_number = :po_number AND po_item_no = :po_item_no
                """, {
                    "po_number": po_number,
                    "po_item_no": item['po_item_no']
                }).fetchone()
                
                # Update PO item
                db.execute("""
                    UPDATE purchase_order_items
                    SET 
                        rcd_qty = :received_qty,
                        rejected_qty = :rejected_qty,
                        updated_at = :updated_at
                    WHERE po_number = :po_number AND po_item_no = :po_item_no
                """, {
                    "received_qty": float(srv_totals['total_received']),
                    "rejected_qty": float(srv_totals['total_rejected']),
                    "updated_at": datetime.now().isoformat(),
                    "po_number": po_number,
                    "po_item_no": item['po_item_no']
                })
        
        db.commit()
        return len(srvs_to_update)
        
    except Exception as e:
        db.rollback()
        raise e
