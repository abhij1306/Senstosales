"""
Reports Router
Provides various business reports
"""
from fastapi import APIRouter, Depends, Query
from app.db import get_db
from typing import Optional
import sqlite3
from datetime import datetime

router = APIRouter()

@router.get("/po-dc-invoice-reconciliation")
def po_dc_invoice_reconciliation(
    po_number: Optional[int] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """
    PO-DC-Invoice Reconciliation Report
    Shows ordered vs dispatched vs invoiced quantities
    """
    
    query = """
        SELECT 
            po.po_number,
            po.po_date,
            po.supplier_name,
            poi.po_item_no,
            poi.material_code,
            poi.material_description,
            poi.ord_qty,
            COALESCE(SUM(dci.dispatch_qty), 0) as dispatched_qty,
            poi.ord_qty - COALESCE(SUM(dci.dispatch_qty), 0) as pending_qty
        FROM purchase_orders po
        JOIN purchase_order_items poi ON po.po_number = poi.po_number
        LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
    """
    
    if po_number:
        query += " WHERE po.po_number = ?"
        params = (po_number,)
    else:
        params = ()
    
    query += """
        GROUP BY po.po_number, poi.po_item_no
        ORDER BY po.po_date DESC, poi.po_item_no
    """
    
    rows = db.execute(query, params).fetchall()
    return [dict(row) for row in rows]

@router.get("/dc-without-invoice")
def dc_without_invoice(db: sqlite3.Connection = Depends(get_db)):
    """DCs that haven't been invoiced yet"""
    
    rows = db.execute("""
        SELECT 
            dc.dc_number,
            dc.dc_date,
            dc.po_number,
            dc.consignee_name,
            dc.created_at
        FROM delivery_challans dc
        LEFT JOIN gst_invoice_dc_links link ON dc.dc_number = link.dc_number
        WHERE link.id IS NULL
        ORDER BY dc.dc_date DESC
    """).fetchall()
    
    return [dict(row) for row in rows]

@router.get("/invoice-summary")
def invoice_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """Invoice Summary Report with GST breakdown"""
    
    query = """
        SELECT 
            invoice_number,
            invoice_date,
            customer_gstin,
            place_of_supply,
            taxable_value,
            cgst,
            sgst,
            igst,
            total_invoice_value,
            created_at
        FROM gst_invoices
    """
    
    conditions = []
    params = []
    
    if start_date:
        conditions.append("invoice_date >= ?")
        params.append(start_date)
    
    if end_date:
        conditions.append("invoice_date <= ?")
        params.append(end_date)
    
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    
    query += " ORDER BY invoice_date DESC"
    
    rows = db.execute(query, tuple(params)).fetchall()
    invoices = [dict(row) for row in rows]
    
    # Calculate totals
    total_taxable = sum(inv.get("taxable_value") or 0 for inv in invoices)
    total_cgst = sum(inv.get("cgst") or 0 for inv in invoices)
    total_sgst = sum(inv.get("sgst") or 0 for inv in invoices)
    total_igst = sum(inv.get("igst") or 0 for inv in invoices)
    total_invoice = sum(inv.get("total_invoice_value") or 0 for inv in invoices)
    
    return {
        "invoices": invoices,
        "summary": {
            "total_taxable_value": total_taxable,
            "total_cgst": total_cgst,
            "total_sgst": total_sgst,
            "total_igst": total_igst,
            "total_invoice_value": total_invoice,
            "invoice_count": len(invoices)
        }
    }

@router.get("/supplier-summary")
def supplier_summary(db: sqlite3.Connection = Depends(get_db)):
    """Supplier-wise PO summary"""
    
    rows = db.execute("""
        SELECT 
            supplier_name,
            COUNT(po_number) as po_count,
            SUM(po_value) as total_po_value,
            MAX(po_date) as last_po_date
        FROM purchase_orders
        WHERE supplier_name IS NOT NULL
        GROUP BY supplier_name
        ORDER BY total_po_value DESC
    """).fetchall()
    
    return [dict(row) for row in rows]

@router.get("/monthly-summary")
def monthly_summary(
    year: int = Query(default=datetime.now().year),
    db: sqlite3.Connection = Depends(get_db)
):
    """Monthly summary of POs, DCs, and Invoices"""
    
    # POs by month
    pos = db.execute("""
        SELECT 
            strftime('%m', po_date) as month,
            COUNT(*) as count,
            SUM(po_value) as total_value
        FROM purchase_orders
        WHERE strftime('%Y', po_date) = ?
        GROUP BY month
        ORDER BY month
    """, (str(year),)).fetchall()
    
    # DCs by month
    dcs = db.execute("""
        SELECT 
            strftime('%m', dc_date) as month,
            COUNT(*) as count
        FROM delivery_challans
        WHERE strftime('%Y', dc_date) = ?
        GROUP BY month
        ORDER BY month
    """, (str(year),)).fetchall()
    
    # Invoices by month
    invoices = db.execute("""
        SELECT 
            strftime('%m', invoice_date) as month,
            COUNT(*) as count,
            SUM(total_invoice_value) as total_value
        FROM gst_invoices
        WHERE strftime('%Y', invoice_date) = ?
        GROUP BY month
        ORDER BY month
    """, (str(year),)).fetchall()
    
    return {
        "year": year,
        "purchase_orders": [dict(row) for row in pos],
        "delivery_challans": [dict(row) for row in dcs],
        "invoices": [dict(row) for row in invoices]
    }
