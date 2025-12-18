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
    """Get Purchase Order detail with items and deliveries"""
    
    # Get header
    header_row = db.execute("""
        SELECT * FROM purchase_orders WHERE po_number = ?
    """, (po_number,)).fetchone()
    
    if not header_row:
        raise HTTPException(status_code=404, detail="PO not found")
    
    header = POHeader(**dict(header_row))
    
    # Get items
    item_rows = db.execute("""
        SELECT id, po_item_no, material_code, material_description, drg_no, mtrl_cat,
               unit, po_rate, ord_qty, rcd_qty, item_value, hsn_code
        FROM purchase_order_items
        WHERE po_number = ?
        ORDER BY po_item_no
    """, (po_number,)).fetchall()
    
    # For each item, get deliveries
    items_with_deliveries = []
    for item_row in item_rows:
        item_dict = dict(item_row)
        item_id = item_dict['id']
        
        # Get deliveries for this item
        delivery_rows = db.execute("""
            SELECT id, lot_no, dely_qty, dely_date, entry_allow_date, dest_code
            FROM purchase_order_deliveries
            WHERE po_item_id = ?
            ORDER BY lot_no
        """, (item_id,)).fetchall()
        
        deliveries = [dict(d) for d in delivery_rows]
        
        # Create POItem with deliveries
        item_with_deliveries = {**item_dict, 'deliveries': deliveries}
        items_with_deliveries.append(POItem(**item_with_deliveries))
    
    return PODetail(header=header, items=items_with_deliveries)


@router.get("/{po_number}/dc")
def check_po_has_dc(po_number: int, db: sqlite3.Connection = Depends(get_db)):
    """Check if PO has an associated Delivery Challan"""
    try:
        dc_row = db.execute("""
            SELECT id, dc_number FROM delivery_challans 
            WHERE po_number = ? 
            LIMIT 1
        """, (po_number,)).fetchone()
        
        if dc_row:
            return {
                "has_dc": True,
                "dc_id": dc_row["id"],
                "dc_number": dc_row["dc_number"]
            }
        else:
            return {"has_dc": False}
    except Exception as e:
        # Table might not exist yet
        return {"has_dc": False}

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

@router.post("/upload/batch")
async def upload_po_batch(files: List[UploadFile] = File(...), db: sqlite3.Connection = Depends(get_db)):
    """Upload and parse multiple PO HTML files"""
    
    results = []
    successful = 0
    failed = 0
    
    ingestion_service = POIngestionService()
    
    for file in files:
        result = {
            "filename": file.filename,
            "success": False,
            "po_number": None,
            "message": ""
        }
        
        try:
            # Validate file type
            if not file.filename.endswith('.html'):
                result["message"] = "Only HTML files are supported"
                failed += 1
                results.append(result)
                continue
            
            # Read and parse HTML
            content = await file.read()
            soup = BeautifulSoup(content, "lxml")
            
            # Extract data
            po_header = extract_po_header(soup)
            po_items = extract_items(soup)
            
            if not po_header.get("PURCHASE ORDER"):
                result["message"] = "Could not extract PO number from HTML"
                failed += 1
                results.append(result)
                continue
            
            # Ingest into database
            success, warnings = ingestion_service.ingest_po(po_header, po_items)
            
            if success:
                result["success"] = True
                result["po_number"] = po_header.get("PURCHASE ORDER")
                result["message"] = warnings[0] if warnings else f"Successfully ingested PO {po_header.get('PURCHASE ORDER')}"
                successful += 1
            else:
                result["message"] = "Failed to ingest PO"
                failed += 1
                
        except Exception as e:
            result["message"] = f"Error: {str(e)}"
            failed += 1
        
        results.append(result)
    
    return {
        "total": len(files),
        "successful": successful,
        "failed": failed,
        "results": results
    }
