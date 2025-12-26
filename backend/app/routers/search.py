from fastapi import APIRouter, Depends, Query
from typing import List, Optional, Union
from pydantic import BaseModel
import sqlite3
from app.db import get_db

router = APIRouter()

class SearchResult(BaseModel):
    type: str
    id: Union[str, int]
    number: str
    party: str
    amount: Optional[float] = None
    status: Optional[str] = None
    date: Optional[str] = None
    type_label: str

class SearchResponse(BaseModel):
    results: List[SearchResult]

# Setup logger
import logging
logger = logging.getLogger(__name__)

@router.get("/", response_model=SearchResponse)
def search_global(
    q: str = Query(..., min_length=1),
    db: sqlite3.Connection = Depends(get_db)
):
    query_str = f"%{q}%"
    results = []
    logger.info(f"Global search for: {q}")

    # 1. Search Purchase Orders
    try:
        po_rows = db.execute("""
            SELECT rowid as id, po_number, supplier_name, po_value, po_status, po_date
            FROM purchase_orders
            WHERE po_number LIKE ? OR supplier_name LIKE ?
            ORDER BY po_date DESC LIMIT 5
        """, (query_str, query_str)).fetchall()

        for row in po_rows:
            results.append(SearchResult(
                type="PO",
                id=row["id"],
                number=str(row["po_number"]),
                party=row["supplier_name"],
                amount=row["po_value"] if row["po_value"] else 0.0,
                status=row["po_status"],
                date=str(row["po_date"]) if row["po_date"] else None,
                type_label="Purchase Order"
            ))
    except Exception as e:
        logger.error(f"Error searching POs: {e}", exc_info=True)

    # 2. Search Delivery Challans
    try:
        dc_rows = db.execute("""
            SELECT rowid as id, dc_number, po_number, dc_status, dc_date
            FROM delivery_challans
            WHERE dc_number LIKE ? OR po_number LIKE ?
            ORDER BY dc_date DESC LIMIT 5
        """, (query_str, query_str)).fetchall()

        for row in dc_rows:
            results.append(SearchResult(
                type="DC",
                id=row["id"],
                number=str(row["dc_number"]),
                party=str(row["po_number"]) if row["po_number"] else "Unknown", # Use PO Number as proxy for party
                amount=None,
                status=row["dc_status"],
                date=str(row["dc_date"]) if row["dc_date"] else None,
                type_label="Delivery Challan"
            ))
    except Exception as e:
        logger.error(f"Error searching DCs: {e}", exc_info=True)

    # 3. Search Invoices
    try:
        # Table is gst_invoices. Columns: invoice_number, customer_gstin, total_invoice_value, invoice_date
        inv_rows = db.execute("""
            SELECT rowid as id, invoice_number, customer_gstin, total_invoice_value, invoice_date
            FROM gst_invoices
            WHERE invoice_number LIKE ? OR customer_gstin LIKE ?
            ORDER BY invoice_date DESC LIMIT 5
        """, (query_str, query_str)).fetchall()

        for row in inv_rows:
            results.append(SearchResult(
                type="Invoice",
                id=row["id"],
                number=str(row["invoice_number"]),
                party=row["customer_gstin"] if row["customer_gstin"] else "BHEL", # Use GSTIN or default
                amount=row["total_invoice_value"] if row["total_invoice_value"] else 0.0,
                status="Generated", # Invoice status column not consistent, defaulting
                date=str(row["invoice_date"]) if row["invoice_date"] else None,
                type_label="Invoice"
            ))
    except Exception as e:
        logger.error(f"Error searching Invoices: {e}", exc_info=True)

    # 4. Search SRVs
    try:
        # Using rowid as id since srv table might not have explicit id column (srv_number is PK)
        srv_rows = db.execute("""
            SELECT rowid as id, srv_number, created_at
            FROM srvs
            WHERE srv_number LIKE ?
            ORDER BY created_at DESC LIMIT 5
        """, (query_str,)).fetchall()

        for row in srv_rows:
            # Handle potential missing CreatedAt
            date_str = None
            if row["created_at"]:
                date_str = str(row["created_at"])[:10]

            results.append(SearchResult(
                type="SRV",
                id=row["id"],
                number=str(row["srv_number"]),
                party="Unknown", # SRV doesn't map easily to party without joins, keeping simple
                amount=None,
                status="Processed",
                date=date_str,
                type_label="Store Receipt"
            ))
    except Exception as e:
        logger.error(f"Error searching SRVs: {e}", exc_info=True)
    
    for row in srv_rows:
        # created_at is likely a timestamp string. We slice first 10 chars safely.
        date_str = None
        if row["created_at"]:
            date_str = str(row["created_at"])[:10]
            
        results.append(SearchResult(
            type="SRV",
            id=row["id"],
            number=str(row["srv_number"]),
            party="Unknown", 
            amount=None,
            status="Processed",
            date=date_str,
            type_label="Store Receipt"
        ))

    return {"results": results}
