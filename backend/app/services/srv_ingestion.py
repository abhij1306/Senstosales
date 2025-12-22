"""
SRV Ingestion Service
Validates and inserts SRV data into the database.
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Tuple
from datetime import datetime


def validate_srv_data(srv_data: Dict, db: Session) -> Tuple[bool, str]:
    """
    Validate SRV data before database insertion.
    
    Args:
        srv_data: Parsed SRV data from scraper
        db: Database session
        
    Returns:
        (is_valid: bool, message: str)
    """
    header = srv_data.get('header', {})
    items = srv_data.get('items', [])
    
    # Required header fields
    if not header.get('srv_number'):
        return False, "Missing required field: SRV number"
    
    if not header.get('po_number'):
        return False, "Missing required field: PO number"
    
    if not header.get('srv_date'):
        return False, "Missing required field: SRV date"
    
    # Check if SRV number already exists (prevent duplicates)
    existing_srv = db.execute(
        text("SELECT srv_number FROM srvs WHERE srv_number = :srv_number"),
        {"srv_number": header['srv_number']}
    ).fetchone()
    
    if existing_srv:
        return False, f"SRV number {header['srv_number']} already exists"
    
    # Check if PO exists
    po_exists = db.execute(
        text("SELECT po_number FROM purchase_orders WHERE po_number = :po_number"),
        {"po_number": header['po_number']}
    ).fetchone()
    
    if not po_exists:
        return False, f"PO {header['po_number']} not found in database"
    
    # Validate items
    if not items or len(items) == 0:
        return False, "SRV must have at least one item"
    
    # Validate each item
    for idx, item in enumerate(items):
        if not item.get('po_item_no'):
            return False, f"Item {idx + 1}: Missing PO item number"
        
        # Check if PO item exists
        po_item_exists = db.execute(
            text("""
                SELECT id FROM po_items 
                WHERE po_number = :po_number AND po_item_no = :po_item_no
            """),
            {
                "po_number": header['po_number'],
                "po_item_no": item['po_item_no']
            }
        ).fetchone()
        
        if not po_item_exists:
            return False, f"Item {idx + 1}: PO item number {item['po_item_no']} not found in PO {header['po_number']}"
        
        # Validate quantities
        received_qty = item.get('received_qty', 0)
        rejected_qty = item.get('rejected_qty', 0)
        
        if received_qty < 0:
            return False, f"Item {idx + 1}: Received quantity cannot be negative"
        
        if rejected_qty < 0:
            return False, f"Item {idx + 1}: Rejected quantity cannot be negative"
        
        # Optional: Validate received + rejected <= delivered
        # This is flexible - allows partial SRVs
        # We'll just log a warning if it exceeds, not block it
    
    return True, "Valid"


def ingest_srv_to_db(srv_data: Dict, db: Session) -> bool:
    """
    Insert SRV data into database with transaction safety.
    
    Args:
        srv_data: Validated SRV data
        db: Database session
        
    Returns:
        bool: Success status
        
    Raises:
        Exception: If database operation fails
    """
    header = srv_data['header']
    items = srv_data['items']
    
    try:
        # 1. Insert SRV header
        db.execute(
            text("""
                INSERT INTO srvs (srv_number, srv_date, po_number, srv_status, created_at, updated_at)
                VALUES (:srv_number, :srv_date, :po_number, :srv_status, :created_at, :updated_at)
            """),
            {
                "srv_number": header['srv_number'],
                "srv_date": header['srv_date'],
                "po_number": header['po_number'],
                "srv_status": "Received",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
        )
        
        # 2. Insert SRV items
        for item in items:
            db.execute(
                text("""
                    INSERT INTO srv_items 
                    (srv_number, po_number, po_item_no, lot_no, received_qty, rejected_qty, 
                     challan_no, invoice_no, remarks, created_at)
                    VALUES 
                    (:srv_number, :po_number, :po_item_no, :lot_no, :received_qty, :rejected_qty,
                     :challan_no, :invoice_no, :remarks, :created_at)
                """),
                {
                    "srv_number": header['srv_number'],
                    "po_number": header['po_number'],
                    "po_item_no": item['po_item_no'],
                    "lot_no": item.get('lot_no'),
                    "received_qty": item.get('received_qty', 0),
                    "rejected_qty": item.get('rejected_qty', 0),
                    "challan_no": item.get('challan_no'),
                    "invoice_no": item.get('invoice_no'),
                    "remarks": item.get('remarks'),
                    "created_at": datetime.now().isoformat()
                }
            )
        
        # 3. Commit transaction
        db.commit()
        return True
        
    except Exception as e:
        db.rollback()
        raise e


def get_srv_aggregated_quantities(po_number: str, db: Session) -> Dict:
    """
    Get aggregated received and rejected quantities per PO item from all SRVs.
    
    Args:
        po_number: PO number
        db: Database session
        
    Returns:
        dict: {po_item_no: {"received_qty": float, "rejected_qty": float}}
    """
    result = db.execute(
        text("""
            SELECT 
                po_item_no,
                SUM(received_qty) as total_received,
                SUM(rejected_qty) as total_rejected
            FROM srv_items
            WHERE po_number = :po_number
            GROUP BY po_item_no
        """),
        {"po_number": po_number}
    ).fetchall()
    
    aggregated = {}
    for row in result:
        aggregated[row.po_item_no] = {
            "received_qty": float(row.total_received or 0),
            "rejected_qty": float(row.total_rejected or 0)
        }
    
    return aggregated
