"""
Purchase Order Router
CRUD operations and HTML upload/scraping
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.db import get_db
from app.models import POListItem, PODetail, POHeader, POItem
from typing import List
import sqlite3
from bs4 import BeautifulSoup
from app.services.po_scraper import extract_po_header, extract_items
from app.services.ingest_po import POIngestionService

router = APIRouter()

@router.get("/", response_model=List[POListItem])
def list_pos(db: sqlite3.Connection = Depends(get_db)):
    """List all Purchase Orders"""
    rows = db.execute("""
        SELECT po_number, po_date, supplier_name, po_value, amend_no, created_at
        FROM purchase_orders
        ORDER BY created_at DESC
    """).fetchall()
    
    return [
        POListItem(
            po_number=row["po_number"],
            po_date=row["po_date"],
            supplier_name=row["supplier_name"],
            po_value=row["po_value"],
            amend_no=row["amend_no"],
            created_at=row["created_at"]
        )
        for row in rows
    ]

@router.get("/{po_number}", response_model=PODetail)
def get_po_detail(po_number: int, db: sqlite3.Connection = Depends(get_db)):
    """Get Purchase Order detail with items"""
    
    # Get header
    header_row = db.execute("""
        SELECT * FROM purchase_orders WHERE po_number = ?
    """, (po_number,)).fetchone()
    
    if not header_row:
        raise HTTPException(status_code=404, detail="PO not found")
    
    header = POHeader(**dict(header_row))
    
    # Get items
    item_rows = db.execute("""
        SELECT po_item_no, material_code, material_description, drg_no, mtrl_cat,
               unit, po_rate, ord_qty, rcd_qty, item_value, hsn_code
        FROM purchase_order_items
        WHERE po_number = ?
        ORDER BY po_item_no
    """, (po_number,)).fetchall()
    
    items = [POItem(**dict(row)) for row in item_rows]
    
    return PODetail(header=header, items=items)

@router.post("/upload")
async def upload_po_html(file: UploadFile = File(...), db: sqlite3.Connection = Depends(get_db)):
    """Upload and parse PO HTML file"""
    
    if not file.filename.endswith('.html'):
        raise HTTPException(status_code=400, detail="Only HTML files are supported")
    
    # Read and parse HTML
    content = await file.read()
    soup = BeautifulSoup(content, "lxml")
    
    # Extract data using existing scraper logic
    po_header = extract_po_header(soup)
    po_items = extract_items(soup)
    
    if not po_header.get("PURCHASE ORDER"):
        raise HTTPException(status_code=400, detail="Could not extract PO number from HTML")
    
    # Ingest into database
    ingestion_service = POIngestionService()
    try:
        success, warnings = ingestion_service.ingest_po(po_header, po_items)
        return {
            "success": success,
            "po_number": po_header.get("PURCHASE ORDER"),
            "warnings": warnings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
