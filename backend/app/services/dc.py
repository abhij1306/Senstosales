"""
Delivery Challan Service Layer
Centralizes all DC business logic and validation
HTTP-agnostic - can be called from routers or AI agents
"""
import sqlite3
import uuid
import logging
from typing import List, Dict, Optional
from app.core.result import ServiceResult
from app.core.exceptions import (
    ErrorCode,
    ValidationError,
    ResourceNotFoundError,
    ConflictError,
    BusinessRuleViolation
)
from app.models import DCCreate

logger = logging.getLogger(__name__)

def generate_dc_number(po_number: str, db: sqlite3.Connection) -> str:
    """
    Generate next DC number deterministically based on PO number
    Format: {po_number}-DC-{seq}
    Example: PO123-DC-01, PO123-DC-02
    """
    # Find last DC for this PO
    last_dc = db.execute("""
        SELECT dc_number FROM delivery_challans 
        WHERE po_number = ? 
        ORDER BY created_at DESC, dc_number DESC 
        LIMIT 1
    """, (po_number,)).fetchone()
    
    if not last_dc:
        return f"{po_number}-DC-01"
    
    last_val = last_dc[0]
    parts = last_val.split("-DC-")
    
    if len(parts) == 2 and parts[1].isdigit():
        seq = int(parts[1]) + 1
        return f"{po_number}-DC-{seq:02d}"
    
    # Fallback if format is weird
    return f"{po_number}-DC-{uuid.uuid4().hex[:4].upper()}"



def validate_dc_header(dc: DCCreate) -> None:
    """
    Validate DC header fields
    Raises ValidationError if validation fails
    """
    if not dc.dc_number or dc.dc_number.strip() == "":
        raise ValidationError("DC number is required")
    
    if not dc.dc_date or dc.dc_date.strip() == "":
        raise ValidationError("DC date is required")


def validate_dc_items(items: List[dict], db: sqlite3.Connection, exclude_dc: Optional[str] = None) -> None:
    """
    Validate DC items for dispatch quantity constraints
    
    Args:
        items: List of DC items to validate
        db: Database connection
        exclude_dc: DC number to exclude from dispatch calculations (for updates)
    
    Raises:
        ValidationError: If basic validation fails
        BusinessRuleViolation: If dispatch quantity exceeds remaining quantity
    """
    if not items or len(items) == 0:
        raise ValidationError("At least one item is required")
    
    for idx, item in enumerate(items):
        # Required fields
        if "po_item_id" not in item or not item["po_item_id"]:
            raise ValidationError(
                f"Item {idx + 1}: PO item ID is required",
                details={"item_index": idx}
            )
        
        if "dispatch_qty" not in item or item["dispatch_qty"] is None:
            raise ValidationError(
                f"Item {idx + 1}: Dispatch quantity is required",
                details={"item_index": idx}
            )
        
        dispatch_qty = float(item["dispatch_qty"])
        if dispatch_qty <= 0:
            raise ValidationError(
                f"Item {idx + 1}: Dispatch quantity must be positive",
                details={"item_index": idx, "dispatch_qty": dispatch_qty}
            )
        
        po_item_id = item["po_item_id"]
        lot_no = item.get("lot_no")
        
        # Get lot ordered quantity
        if lot_no:
            lot_row = db.execute("""
                SELECT dely_qty FROM purchase_order_deliveries
                WHERE po_item_id = ? AND lot_no = ?
            """, (po_item_id, lot_no)).fetchone()
            
            if not lot_row:
                raise ResourceNotFoundError("Lot", f"{lot_no} for PO item {po_item_id}")
            
            lot_ordered = lot_row[0]
            
            # Calculate already dispatched (excluding current DC if updating)
            if exclude_dc:
                already_dispatched = db.execute("""
                    SELECT COALESCE(SUM(dispatch_qty), 0)
                    FROM delivery_challan_items
                    WHERE po_item_id = ? AND lot_no = ? AND dc_number != ?
                """, (po_item_id, lot_no, exclude_dc)).fetchone()[0]
            else:
                already_dispatched = db.execute("""
                    SELECT COALESCE(SUM(dispatch_qty), 0)
                    FROM delivery_challan_items
                    WHERE po_item_id = ? AND lot_no = ?
                """, (po_item_id, lot_no)).fetchone()[0]
            
            remaining = lot_ordered - already_dispatched
            
            # INVARIANT: DC-1 - Dispatch quantity cannot exceed remaining quantity
            if dispatch_qty > remaining:
                raise BusinessRuleViolation(
                    f"Item {idx + 1}: Cannot dispatch {dispatch_qty}. "
                    f"Only {remaining} remaining for Lot {lot_no}",
                    details={
                        "item_index": idx,
                        "lot_no": lot_no,
                        "dispatch_qty": dispatch_qty,
                        "lot_ordered": lot_ordered,
                        "already_dispatched": already_dispatched,
                        "remaining": remaining,
                        "invariant": "DC-1"
                    }
                )

        # GLOBAL INVARIANT: Dispatch cannot exceed PO Item Ordered Quantity
        # Use Reconciliation Ledger View for single source of truth
        recon_row = db.execute("""
            SELECT rl.ordered_quantity, rl.total_delivered_qty 
            FROM reconciliation_ledger rl
            JOIN purchase_order_items poi ON rl.po_number = poi.po_number AND rl.po_item_no = poi.po_item_no
            WHERE poi.id = ?
        """, (po_item_id,)).fetchone()
        
        if recon_row:
            global_ordered = recon_row[0]
            global_delivered = recon_row[1]
            
            # If updating, exclude current DC contribution from 'global_delivered'
            if exclude_dc:
                current_dc_contribution = db.execute("""
                    SELECT COALESCE(SUM(dispatch_qty), 0)
                    FROM delivery_challan_items
                    WHERE dc_number = ? AND po_item_id = ?
                """, (exclude_dc, po_item_id)).fetchone()[0]
                global_delivered -= current_dc_contribution
            
            # Allow small float tolerance if needed
            remaining_global = global_ordered - global_delivered
            
            if dispatch_qty > remaining_global + 0.001:  # Simple float tolerance
                 raise BusinessRuleViolation(
                    f"Item {idx + 1}: Over-dispatch error. Total Ordered: {global_ordered}, "
                    f"Already Delivered: {global_delivered}, Remaining: {remaining_global}. "
                    f"Attempting to dispatch: {dispatch_qty}",
                    details={
                        "item_index": idx,
                        "global_ordered": global_ordered,
                        "already_delivered": global_delivered,
                        "remaining_global": remaining_global,
                        "dispatch_qty": dispatch_qty,
                        "invariant": "Global-PO-Limit"
                    }
                )


def check_dc_has_invoice(dc_number: str, db: sqlite3.Connection) -> Optional[str]:
    """
    Check if DC is linked to an invoice
    
    Returns:
        Invoice number if linked, None otherwise
    """
    invoice_row = db.execute("""
        SELECT invoice_number FROM gst_invoice_dc_links 
        WHERE dc_number = ? 
        LIMIT 1
    """, (dc_number,)).fetchone()
    
    return invoice_row["invoice_number"] if invoice_row else None


def create_dc(dc: DCCreate, items: List[dict], db: sqlite3.Connection) -> ServiceResult[Dict]:
    """
    Create new Delivery Challan
    HTTP-agnostic - returns ServiceResult instead of raising HTTPException
    
    Args:
        dc: DC header data
        items: List of DC items
        db: Database connection (must be in transaction)
    
    Returns:
        ServiceResult with success status and dc_number
    """
    try:
        # Validate
        validate_dc_header(dc)
        validate_dc_items(items, db, exclude_dc=None)
        
        logger.debug(f"Creating DC {dc.dc_number} with {len(items)} items")
        
        # Insert DC header
        db.execute("""
            INSERT INTO delivery_challans
            (dc_number, dc_date, po_number, department_no, consignee_name, consignee_gstin,
             consignee_address, inspection_company, eway_bill_no, vehicle_no, lr_no,
             transporter, mode_of_transport, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            dc.dc_number, dc.dc_date, dc.po_number, dc.department_no, dc.consignee_name,
            dc.consignee_gstin, dc.consignee_address, dc.inspection_company, dc.eway_bill_no,
            dc.vehicle_no, dc.lr_no, dc.transporter, dc.mode_of_transport, dc.remarks
        ))
        
        # Insert DC items
        for item in items:
            item_id = str(uuid.uuid4())
            db.execute("""
                INSERT INTO delivery_challan_items
                (id, dc_number, po_item_id, lot_no, dispatch_qty, hsn_code, hsn_rate)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                item_id,
                dc.dc_number,
                item["po_item_id"],
                item.get("lot_no"),
                item["dispatch_qty"],
                item.get("hsn_code"),
                item.get("hsn_rate")
            ))
        
        logger.info(f"Successfully created DC {dc.dc_number} with {len(items)} items")
        return ServiceResult.ok({"success": True, "dc_number": dc.dc_number})
    
    except (ValidationError, ResourceNotFoundError, BusinessRuleViolation) as e:
        # Domain errors - let them propagate
        raise
    except Exception as e:
        # Unexpected errors
        logger.error(f"Failed to create DC: {e}", exc_info=True)
        return ServiceResult.fail(
            error_code=ErrorCode.INTERNAL_ERROR,
            message=f"Failed to create DC: {str(e)}"
        )


def update_dc(dc_number: str, dc: DCCreate, items: List[dict], db: sqlite3.Connection) -> ServiceResult[Dict]:
    """
    Update existing Delivery Challan
    HTTP-agnostic - returns ServiceResult instead of raising HTTPException
    
    Args:
        dc_number: DC number to update
        dc: Updated DC header data
        items: Updated list of DC items
        db: Database connection (must be in transaction)
    
    Returns:
        ServiceResult with success status and dc_number
    """
    try:
        # INVARIANT: DC-2 - DC cannot be edited if it has an invoice
        invoice_number = check_dc_has_invoice(dc_number, db)
        if invoice_number:
            raise ConflictError(
                f"Cannot edit DC {dc_number} - already linked to invoice {invoice_number}",
                details={
                    "dc_number": dc_number,
                    "invoice_number": invoice_number,
                    "invariant": "DC-2"
                }
            )
        
        # Ensure DC number matches
        if dc.dc_number != dc_number:
            raise ValidationError("DC number in body must match URL")
        
        # Validate
        validate_dc_header(dc)
        validate_dc_items(items, db, exclude_dc=dc_number)
        
        logger.debug(f"Updating DC {dc_number} with {len(items)} items")
        
        # Update Header
        db.execute("""
            UPDATE delivery_challans SET
            dc_date = ?, po_number = ?, department_no = ?, consignee_name = ?, consignee_gstin = ?,
            consignee_address = ?, inspection_company = ?, eway_bill_no = ?, vehicle_no = ?, lr_no = ?,
            transporter = ?, mode_of_transport = ?, remarks = ?
            WHERE dc_number = ?
        """, (
            dc.dc_date, dc.po_number, dc.department_no, dc.consignee_name,
            dc.consignee_gstin, dc.consignee_address, dc.inspection_company, dc.eway_bill_no,
            dc.vehicle_no, dc.lr_no, dc.transporter, dc.mode_of_transport, dc.remarks, dc_number
        ))
        
        # Delete old items
        db.execute("DELETE FROM delivery_challan_items WHERE dc_number = ?", (dc_number,))
        
        # Insert new items
        for item in items:
            item_id = str(uuid.uuid4())
            db.execute("""
                INSERT INTO delivery_challan_items
                (id, dc_number, po_item_id, lot_no, dispatch_qty, hsn_code, hsn_rate)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                item_id, dc_number, item["po_item_id"], item.get("lot_no"),
                item["dispatch_qty"], item.get("hsn_code"), item.get("hsn_rate")
            ))

        logger.info(f"Successfully updated DC {dc_number}")
        return ServiceResult.ok({"success": True, "dc_number": dc_number})
    
    except (ValidationError, ResourceNotFoundError, ConflictError, BusinessRuleViolation) as e:
        # Domain errors - let them propagate
        raise
    except Exception as e:
        # Unexpected errors
        logger.error(f"Failed to update DC: {e}", exc_info=True)
        return ServiceResult.fail(
            error_code=ErrorCode.INTERNAL_ERROR,
            message=f"Failed to update DC: {str(e)}"
        )


def delete_dc(dc_number: str, db: sqlite3.Connection) -> ServiceResult[Dict]:
    """
    Delete a Delivery Challan
    Rolls back quantity reconciliation by removing the records
    """
    try:
        # INVARIANT: DC-2 - DC cannot be deleted if it has an invoice
        invoice_number = check_dc_has_invoice(dc_number, db)
        if invoice_number:
            raise ConflictError(
                f"Cannot delete DC {dc_number} - already linked to invoice {invoice_number}",
                details={
                    "dc_number": dc_number,
                    "invoice_number": invoice_number,
                    "invariant": "DC-2"
                }
            )
        
        # Check if DC exists
        dc_row = db.execute("SELECT 1 FROM delivery_challans WHERE dc_number = ?", (dc_number,)).fetchone()
        if not dc_row:
            raise ResourceNotFoundError("DC", dc_number)
            
        # Delete DC Header (Items will be deleted via ON DELETE CASCADE)
        db.execute("DELETE FROM delivery_challans WHERE dc_number = ?", (dc_number,))
        
        logger.info(f"Successfully deleted DC {dc_number}")
        return ServiceResult.ok({"success": True, "message": f"DC {dc_number} deleted"})
        
    except (ResourceNotFoundError, ConflictError) as e:
        raise
    except Exception as e:
        logger.error(f"Failed to delete DC: {e}", exc_info=True)
        return ServiceResult.fail(
            error_code=ErrorCode.INTERNAL_ERROR,
            message=f"Failed to delete DC: {str(e)}"
        )
