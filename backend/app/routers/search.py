"""
Search Router - Smart Global Search
"""
from fastapi import APIRouter, Depends, Query
from app.db import get_db
from typing import List, Optional
import sqlite3

router = APIRouter()

@router.get("/")
def global_search(
    q: str = Query(..., min_length=1),
    type_filter: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """
    Global search across PO, DC, and Invoice
    Supports filters: type:po, type:dc, type:invoice
    """
    
    results = []
    query = f"%{q}%"
    
    # Search POs (if not filtered or filtered to PO)
    if not type_filter or type_filter == "po":
        po_rows = db.execute("""
            SELECT 
                po_number as id,
                'PO' as type,
                po_number as number,
                po_date as date,
                supplier_name as party,
                po_value as value,
                'Purchase Order' as type_label
            FROM purchase_orders
            WHERE 
                CAST(po_number AS TEXT) LIKE ?
                OR supplier_name LIKE ?
                OR supplier_code LIKE ?
            LIMIT 10
        """, (query, query, query)).fetchall()
        results.extend([dict(row) for row in po_rows])
    
    # Search DCs
    if not type_filter or type_filter == "dc":
        dc_rows = db.execute("""
            SELECT 
                dc_number as id,
                'DC' as type,
                dc_number as number,
                dc_date as date,
                consignee_name as party,
                NULL as value,
                'Delivery Challan' as type_label
            FROM delivery_challans
            WHERE 
                dc_number LIKE ?
                OR consignee_name LIKE ?
                OR CAST(po_number AS TEXT) LIKE ?
            LIMIT 10
        """, (query, query, query)).fetchall()
        results.extend([dict(row) for row in dc_rows])
    
    # Search Invoices
    if not type_filter or type_filter == "invoice":
        inv_rows = db.execute("""
            SELECT 
                invoice_number as id,
                'INVOICE' as type,
                invoice_number as number,
                invoice_date as date,
                customer_gstin as party,
                total_invoice_value as value,
                'GST Invoice' as type_label
            FROM gst_invoices
            WHERE 
                invoice_number LIKE ?
                OR po_numbers LIKE ?
                OR linked_dc_numbers LIKE ?
            LIMIT 10
        """, (query, query, query)).fetchall()
        results.extend([dict(row) for row in inv_rows])
    
    return {
        "query": q,
        "total_results": len(results),
        "results": results[:20]  # Limit to top 20
    }

@router.get("/suggestions/po-for-dc")
def suggest_po_for_dc(
    consignee: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """Suggest POs when creating a DC based on consignee"""
    
    if consignee:
        rows = db.execute("""
            SELECT DISTINCT
                po.po_number,
                po.supplier_name,
                po.po_date,
                po.po_value
            FROM purchase_orders po
            WHERE po.supplier_name LIKE ?
            ORDER BY po.po_date DESC
            LIMIT 5
        """, (f"%{consignee}%",)).fetchall()
    else:
        rows = db.execute("""
            SELECT po_number, supplier_name, po_date, po_value
            FROM purchase_orders
            ORDER BY po_date DESC
            LIMIT 10
        """).fetchall()
    
    return [dict(row) for row in rows]

@router.get("/suggestions/dc-for-invoice")
def suggest_dc_for_invoice(
    po_number: Optional[int] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """Suggest DCs when creating an Invoice based on PO"""
    
    if po_number:
        rows = db.execute("""
            SELECT 
                dc.dc_number,
                dc.dc_date,
                dc.consignee_name,
                dc.po_number
            FROM delivery_challans dc
            LEFT JOIN gst_invoice_dc_links link ON dc.dc_number = link.dc_number
            WHERE dc.po_number = ? AND link.id IS NULL
            ORDER BY dc.dc_date DESC
        """, (po_number,)).fetchall()
    else:
        rows = db.execute("""
            SELECT 
                dc.dc_number,
                dc.dc_date,
                dc.consignee_name,
                dc.po_number
            FROM delivery_challans dc
            LEFT JOIN gst_invoice_dc_links link ON dc.dc_number = link.dc_number
            WHERE link.id IS NULL
            ORDER BY dc.dc_date DESC
            LIMIT 10
        """).fetchall()
    
    return [dict(row) for row in rows]
