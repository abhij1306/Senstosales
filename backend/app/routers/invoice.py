"""
Invoice Router
"""
from fastapi import APIRouter, Depends, HTTPException
from app.db import get_db
from app.models import InvoiceListItem, InvoiceCreate
from typing import List, Optional
import sqlite3
import uuid

router = APIRouter()

@router.get("/", response_model=List[InvoiceListItem])
def list_invoices(po: Optional[int] = None, dc: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    """List all Invoices, optionally filtered by PO or DC"""
    
    if po:
        rows = db.execute("""
            SELECT invoice_number, invoice_date, po_numbers, total_invoice_value, created_at
            FROM gst_invoices
            WHERE po_numbers LIKE ?
            ORDER BY created_at DESC
        """, (f"%{po}%",)).fetchall()
    elif dc:
        rows = db.execute("""
            SELECT invoice_number, invoice_date, po_numbers, total_invoice_value, created_at
            FROM gst_invoices
            WHERE linked_dc_numbers LIKE ?
            ORDER BY created_at DESC
        """, (f"%{dc}%",)).fetchall()
    else:
        rows = db.execute("""
            SELECT invoice_number, invoice_date, po_numbers, total_invoice_value, created_at
            FROM gst_invoices
            ORDER BY created_at DESC
        """).fetchall()
    
    return [InvoiceListItem(**dict(row)) for row in rows]

@router.get("/{invoice_number}")
def get_invoice_detail(invoice_number: str, db: sqlite3.Connection = Depends(get_db)):
    """Get Invoice detail with linked DCs"""
    
    invoice_row = db.execute("""
        SELECT * FROM gst_invoices WHERE invoice_number = ?
    """, (invoice_number,)).fetchone()
    
    if not invoice_row:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get linked DCs
    dc_links = db.execute("""
        SELECT dc.* 
        FROM gst_invoice_dc_links link
        JOIN delivery_challans dc ON link.dc_number = dc.dc_number
        WHERE link.invoice_number = ?
    """, (invoice_number,)).fetchall()
    
    return {
        "header": dict(invoice_row),
        "linked_dcs": [dict(dc) for dc in dc_links]
    }

@router.post("/")
def create_invoice(invoice: InvoiceCreate, dc_numbers: List[str], db: sqlite3.Connection = Depends(get_db)):
    """
    Create new Invoice and link to DCs
    dc_numbers: List of DC numbers to link to this invoice
    """
    
    try:
        # Insert invoice
        db.execute("""
            INSERT INTO gst_invoices
            (invoice_number, invoice_date, linked_dc_numbers, po_numbers, customer_gstin,
             place_of_supply, taxable_value, cgst, sgst, igst, total_invoice_value, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            invoice.invoice_number, invoice.invoice_date, invoice.linked_dc_numbers,
            invoice.po_numbers, invoice.customer_gstin, invoice.place_of_supply,
            invoice.taxable_value, invoice.cgst, invoice.sgst, invoice.igst,
            invoice.total_invoice_value, invoice.remarks
        ))
        
        # Create DC links
        for dc_num in dc_numbers:
            link_id = str(uuid.uuid4())
            db.execute("""
                INSERT INTO gst_invoice_dc_links (id, invoice_number, dc_number)
                VALUES (?, ?, ?)
            """, (link_id, invoice.invoice_number, dc_num))
        
        db.commit()
        return {"success": True, "invoice_number": invoice.invoice_number}
    except sqlite3.IntegrityError as e:
        raise HTTPException(status_code=400, detail=f"Invoice creation failed: {str(e)}")

