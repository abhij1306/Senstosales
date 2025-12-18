"""
Reconciliation Router - Quantity Tracking
"""
from fastapi import APIRouter, Depends
from app.db import get_db
from typing import Optional
import sqlite3

router = APIRouter()

@router.get("/po/{po_number}")
def reconcile_po(po_number: int, db: sqlite3.Connection = Depends(get_db)):
    """
    Get reconciliation data for a PO
    Shows ordered vs dispatched vs pending for each item
    """
    
    items = db.execute("""
        SELECT 
            poi.id,
            poi.po_item_no,
            poi.material_code,
            poi.material_description,
            poi.unit,
            poi.ord_qty,
            COALESCE(SUM(dci.dispatch_qty), 0) as dispatched_qty,
            poi.ord_qty - COALESCE(SUM(dci.dispatch_qty), 0) as pending_qty,
            CASE
                WHEN COALESCE(SUM(dci.dispatch_qty), 0) = 0 THEN 'not_started'
                WHEN COALESCE(SUM(dci.dispatch_qty), 0) < poi.ord_qty THEN 'partial'
                WHEN COALESCE(SUM(dci.dispatch_qty), 0) = poi.ord_qty THEN 'complete'
                WHEN COALESCE(SUM(dci.dispatch_qty), 0) > poi.ord_qty THEN 'over_dispatched'
            END as status
        FROM purchase_order_items poi
        LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
        WHERE poi.po_number = ?
        GROUP BY poi.id
        ORDER BY poi.po_item_no
    """, (po_number,)).fetchall()
    
    # Calculate overall fulfillment
    total_ordered = sum(item["ord_qty"] for item in items)
    total_dispatched = sum(item["dispatched_qty"] for item in items)
    fulfillment_rate = (total_dispatched / total_ordered * 100) if total_ordered > 0 else 0
    
    return {
        "po_number": po_number,
        "fulfillment_rate": round(fulfillment_rate, 2),
        "total_ordered": total_ordered,
        "total_dispatched": total_dispatched,
        "total_pending": total_ordered - total_dispatched,
        "items": [dict(item) for item in items]
    }

@router.get("/item/{po_item_id}")
def reconcile_item(po_item_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Get detailed reconciliation for a specific PO item"""
    
    item = db.execute("""
        SELECT 
            poi.*,
            po.po_number,
            po.supplier_name
        FROM purchase_order_items poi
        JOIN purchase_orders po ON poi.po_number = po.po_number
        WHERE poi.id = ?
    """, (po_item_id,)).fetchone()
    
    if not item:
        return {"error": "Item not found"}
    
    # Get dispatch history
    dispatches = db.execute("""
        SELECT 
            dc.dc_number,
            dc.dc_date,
            dci.dispatch_qty
        FROM delivery_challan_items dci
        JOIN delivery_challans dc ON dci.dc_number = dc.dc_number
        WHERE dci.po_item_id = ?
        ORDER BY dc.dc_date
    """, (po_item_id,)).fetchall()
    
    total_dispatched = sum(d["dispatch_qty"] for d in dispatches)
    
    return {
        "item": dict(item),
        "ordered_qty": item["ord_qty"],
        "dispatched_qty": total_dispatched,
        "pending_qty": item["ord_qty"] - total_dispatched,
        "dispatch_history": [dict(d) for d in dispatches]
    }
