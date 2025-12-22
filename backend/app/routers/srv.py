"""
SRV API Router
Handles SRV upload, listing, and detail retrieval.
"""
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
import sqlite3
from typing import List
from datetime import datetime

from app.db import get_db
from app.models import SRVDetail, SRVListItem, SRVStats, SRVHeader, SRVItem
from app.services.srv_scraper import scrape_srv_html
from app.services.srv_ingestion import validate_srv_data, ingest_srv_to_db

router = APIRouter()


@router.post("/upload/batch")
async def upload_batch_srvs(
    files: List[UploadFile] = File(...),
    db: sqlite3.Connection = Depends(get_db)
):
    """
    Upload multiple SRV HTML files in batch.
    Parses, validates, and inserts into database.
    """
    results = []
    
    for file in files:
        try:
            # Validate file type
            if not file.filename.endswith('.html'):
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "message": "Invalid file type. Must be .html"
                })
                continue
            
            # Read file content
            content = await file.read()
            html_content = content.decode('utf-8')
            
            # Parse SRV HTML
            srv_data = scrape_srv_html(html_content)
            
            # Validate extracted data
            is_valid, validation_message = validate_srv_data(srv_data, db)
            if not is_valid:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "message": validation_message
                })
                continue
            
            # Insert into database
            ingest_srv_to_db(srv_data, db)
            
            results.append({
                "filename": file.filename,
                "success": True,
                "srv_number": srv_data['header']['srv_number'],
                "po_number": srv_data['header']['po_number'],
                "message": f"Successfully uploaded SRV {srv_data['header']['srv_number']}"
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "message": f"Error processing file: {str(e)}"
            })
    
    successful = sum(1 for r in results if r["success"])
    failed = len(results) - successful
    
    return {
        "total": len(files),
        "successful": successful,
        "failed": failed,
        "results": results
    }


@router.get("", response_model=List[SRVListItem])
def get_srv_list(
    po_number: str = None,
    skip: int = 0,
    limit: int = 100,
    db: sqlite3.Connection = Depends(get_db)
):
    """
    Get list of all SRVs with optional PO number filter.
    """
    query = """
        SELECT 
            s.srv_number,
            s.srv_date,
            s.po_number,
            COALESCE(SUM(si.received_qty), 0) as total_received_qty,
            COALESCE(SUM(si.rejected_qty), 0) as total_rejected_qty,
            s.created_at
        FROM srvs s
        LEFT JOIN srv_items si ON s.srv_number = si.srv_number
    """
    
    params = {}
    if po_number:
        query += " WHERE s.po_number = :po_number"
        params["po_number"] = po_number
    
    query += """
        GROUP BY s.srv_number, s.srv_date, s.po_number, s.created_at
        ORDER BY s.srv_date DESC, s.srv_number DESC
        LIMIT :limit OFFSET :skip
    """
    
    params["skip"] = skip
    params["limit"] = limit
    
    result = db.execute(query, params).fetchall()
    
    srvs = []
    for row in result:
        srvs.append({
            "srv_number": row['srv_number'],
            "srv_date": row['srv_date'],
            "po_number": row['po_number'],
            "total_received_qty": float(row['total_received_qty']),
            "total_rejected_qty": float(row['total_rejected_qty']),
            "created_at": row['created_at']
        })
    
    return srvs


@router.get("/stats", response_model=SRVStats)
def get_srv_stats(db: sqlite3.Connection = Depends(get_db)):
    """
    Get SRV statistics for dashboard KPIs.
    """
    result = db.execute("""
        SELECT 
            COUNT(DISTINCT s.srv_number) as total_srvs,
            COALESCE(SUM(si.received_qty), 0) as total_received,
            COALESCE(SUM(si.rejected_qty), 0) as total_rejected
        FROM srvs s
        LEFT JOIN srv_items si ON s.srv_number = si.srv_number
    """).fetchone()
    
    total_received = float(result['total_received'] or 0)
    total_rejected = float(result['total_rejected'] or 0)
    
    # Calculate rejection rate
    total_qty = total_received + total_rejected
    rejection_rate = (total_rejected / total_qty * 100) if total_qty > 0 else 0.0
    
    return {
        "total_srvs": result['total_srvs'] or 0,
        "total_received_qty": total_received,
        "total_rejected_qty": total_rejected,
        "rejection_rate": round(rejection_rate, 2)
    }


@router.get("/{srv_number}", response_model=SRVDetail)
def get_srv_detail(srv_number: str, db: sqlite3.Connection = Depends(get_db)):
    """
    Get detailed SRV information with all items.
    """
    # Get SRV header
    header_result = db.execute(
        "SELECT * FROM srvs WHERE srv_number = ?",
        (srv_number,)
    ).fetchone()
    
    if not header_result:
        raise HTTPException(status_code=404, detail=f"SRV {srv_number} not found")
    
    # Get SRV items
    items_result = db.execute("""
            SELECT 
                id, po_item_no, lot_no, received_qty, rejected_qty,
                challan_no, invoice_no, remarks
            FROM srv_items
            WHERE srv_number = ?
            ORDER BY po_item_no, lot_no
        """,
        (srv_number,)
    ).fetchall()
    
    # Build response
    header = SRVHeader(
        srv_number=header_result['srv_number'],
        srv_date=header_result['srv_date'],
        po_number=header_result['po_number'],
        srv_status=header_result['srv_status'],
        created_at=header_result['created_at']
    )
    
    items = []
    for row in items_result:
        items.append(SRVItem(
            id=row['id'],
            po_item_no=row['po_item_no'],
            lot_no=row['lot_no'],
            received_qty=float(row['received_qty']),
            rejected_qty=float(row['rejected_qty']),
            challan_no=row['challan_no'],
            invoice_no=row['invoice_no'],
            remarks=row['remarks']
        ))
    
    return SRVDetail(header=header, items=items)


@router.get("/po/{po_number}/srvs")
def get_srvs_for_po(po_number: str, db: sqlite3.Connection = Depends(get_db)):
    """
    Get all SRVs linked to a specific PO.
    Used in PO detail page to show SRV history.
    """
    result = db.execute("""
            SELECT 
                srv_number, srv_date, srv_status, created_at
            FROM srvs
            WHERE po_number = ?
            ORDER BY srv_date DESC
        """,
        (po_number,)
    ).fetchall()
    
    srvs = []
    for row in result:
        srvs.append({
            "srv_number": row['srv_number'],
            "srv_date": row['srv_date'],
            "srv_status": row['srv_status'],
            "created_at": row['created_at']
        })
    
    return srvs
