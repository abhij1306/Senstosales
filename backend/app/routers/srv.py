"""
SRV API Router
Handles SRV upload, listing, and detail retrieval.
"""
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
import sqlite3
import re
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
    Upload multiple SRV HTML files in batch using process_srv_file.
    """
    results = []
    from app.services.srv_ingestion import process_srv_file
    
    for file in files:
        try:
            if not file.filename.endswith('.html'):
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "message": "Invalid file type. Must be .html"
                })
                continue
            
            # Try to extract PO number from filename with various patterns
            # Priority 1: Explicit PO_ prefix
            po_match = re.search(r'PO_?(\d+)', file.filename, re.IGNORECASE)
            
            # Priority 2: SRV_ prefix (User legacy format)
            if not po_match:
                po_match = re.search(r'SRV_(\d+)', file.filename, re.IGNORECASE)
            
            # Priority 3: Just digits (User said "file name IS the po number")
            if not po_match:
                po_match = re.search(r'(\d+)', file.filename)
                
            if po_match:
                # Normalize to integer string to remove leading zeros (matches srv_scraper behavior)
                try:
                    po_from_filename = str(int(po_match.group(1)))
                except ValueError:
                    po_from_filename = po_match.group(1)
            else:
                po_from_filename = None
            
            content = await file.read()
            success, messages = process_srv_file(content, file.filename, db, po_from_filename)
            
            results.append({
                "filename": file.filename,
                "success": success,
                "message": "; ".join(messages),
                "messages": messages
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "message": f"Error: {str(e)}"
            })
    
    return {
        "total": len(files),
        "successful": sum(1 for r in results if r["success"]),
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
            COALESCE(s.po_found, 1) as po_found,
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
        GROUP BY s.srv_number, s.srv_date, s.po_number, s.po_found, s.created_at
        ORDER BY s.srv_date DESC, s.srv_number DESC
        LIMIT :limit OFFSET :skip
    """
    
    params["skip"] = skip
    params["limit"] = limit
    
    result = db.execute(query, params).fetchall()
    
    srvs = []
    for row in result:
        po_found = bool(row['po_found'])
        warning_msg = None if po_found else f"PO {row['po_number']} not found in database"
        
        srvs.append({
            "srv_number": row['srv_number'],
            "srv_date": row['srv_date'],
            "po_number": row['po_number'],
            "total_received_qty": float(row['total_received_qty']),
            "total_rejected_qty": float(row['total_rejected_qty']),
            "po_found": po_found,
            "warning_message": warning_msg,
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
            COALESCE(SUM(si.rejected_qty), 0) as total_rejected,
            COUNT(DISTINCT CASE WHEN s.po_found = 0 THEN s.srv_number END) as missing_po_count
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
        "rejection_rate": round(rejection_rate, 2),
        "missing_po_count": int(result['missing_po_count'] or 0)
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
                challan_no, invoice_no, remarks,
                order_qty, challan_qty, accepted_qty, unit,
                challan_date, invoice_date, div_code, pmir_no,
                finance_date, cnote_no, cnote_date
            FROM srv_items
            WHERE srv_number = ?
            ORDER BY po_item_no, lot_no
        """,
        (srv_number,)
    ).fetchall()
    
    # Build response using dict(row) to capture all columns automatically
    header = SRVHeader(**dict(header_result))
    
    items = []
    for row in items_result:
        items.append(SRVItem(**dict(row)))
    
    return SRVDetail(header=header, items=items)


@router.get("/po/{po_number}/srvs", response_model=List[SRVListItem])
def get_srvs_for_po(po_number: str, db: sqlite3.Connection = Depends(get_db)):
    """
    Get all SRVs linked to a specific PO with aggregated quantities.
    """
    result = db.execute("""
            SELECT 
                s.srv_number, s.srv_date, s.po_number, s.srv_status, s.created_at, s.po_found,
                COALESCE(SUM(si.received_qty), 0) as total_received_qty,
                COALESCE(SUM(si.rejected_qty), 0) as total_rejected_qty
            FROM srvs s
            LEFT JOIN srv_items si ON s.srv_number = si.srv_number
            WHERE s.po_number = ?
            GROUP BY s.srv_number
            ORDER BY s.srv_date DESC
        """,
        (po_number,)
    ).fetchall()
    
    srvs = []
    for row in result:
        srvs.append({
            "srv_number": row['srv_number'],
            "srv_date": row['srv_date'],
            "po_number": row['po_number'],
            "total_received_qty": float(row['total_received_qty']),
            "total_rejected_qty": float(row['total_rejected_qty']),
            "po_found": bool(row['po_found']),
            "created_at": row['created_at']
        })
    
    return srvs


@router.delete("/{srv_number}")
def delete_srv_endpoint(srv_number: str, db: sqlite3.Connection = Depends(get_db)):
    """
    Delete an SRV and rollback its quantities.
    """
    from app.services.srv_ingestion import delete_srv
    
    success, message = delete_srv(srv_number, db)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return {"message": message}
