"""
SRV Ingestion Service
Validates and inserts SRV data into the database.
"""

import sqlite3
from typing import Dict, Tuple, List, Optional
from datetime import datetime
from app.services.srv_scraper import scrape_srv_html


def validate_srv_data(srv_data: Dict, db: sqlite3.Connection) -> Tuple[bool, str, bool]:
    """
    Validate SRV data before database insertion.

    Args:
        srv_data: Parsed SRV data from scraper
        db: Database session

    Returns:
        (is_valid: bool, message: str, po_found: bool)
    """
    header = srv_data.get("header", {})
    items = srv_data.get("items", [])

    # Required header fields
    if not header.get("srv_number"):
        return False, "Missing required field: SRV number", False

    if not header.get("po_number"):
        return False, "Missing required field: PO number", False

    if not header.get("srv_date"):
        return False, "Missing required field: SRV date", False

    # Remove existence check here as we handle overwrite in process_srv_file
    # existing_srv = db.execute(...)

    # Check if PO exists - WARNING instead of ERROR
    po_exists = db.execute(
        "SELECT po_number FROM purchase_orders WHERE po_number = :po_number",
        {"po_number": header["po_number"]},
    ).fetchone()

    po_found = bool(po_exists)

    if not po_found:
        # Strict Mode: Reject SRV if PO does not exist
        return (
            False,
            f"Error: PO {header['po_number']} not found in database. SRV cannot be processed.",
            False,
        )

    # Validate items
    if not items or len(items) == 0:
        return False, "SRV must have at least one item", po_found

    # Validate each item
    for idx, item in enumerate(items):
        # Validate quantities (always, regardless of PO existence)
        received_qty = item.get("received_qty", 0)
        rejected_qty = item.get("rejected_qty", 0)
        accepted_qty = item.get("accepted_qty", 0)

        if received_qty < 0:
            return (
                False,
                f"Item {idx + 1}: Received quantity cannot be negative",
                po_found,
            )

        if rejected_qty < 0:
            return (
                False,
                f"Item {idx + 1}: Rejected quantity cannot be negative",
                po_found,
            )

        if accepted_qty < 0:
            return (
                False,
                f"Item {idx + 1}: Accepted quantity cannot be negative",
                po_found,
            )

        # Enforce accounting invariant: Received = Accepted + Rejected
        # Allow small tolerance for floating point precision (0.001)
        calculated_accepted = received_qty - rejected_qty
        if accepted_qty > 0 and abs(accepted_qty - calculated_accepted) > 0.001:
            return (
                False,
                f"Item {idx + 1}: Accounting invariant violated. Accepted ({accepted_qty}) must equal Received ({received_qty}) - Rejected ({rejected_qty}) = {calculated_accepted}",
                po_found,
            )

        # TODO: Add GSTIN validation when field is added to data model
        # if not item.get('gstin'):
        #     return False, f"Item {idx + 1}: GSTIN is required", po_found

        # TODO: Add HSN validation when field is added to data model
        # if not item.get('hsn_code'):
        #     return False, f"Item {idx + 1}: HSN code is required", po_found

        # Validate only if PO exists
        if po_found:
            if not item.get("po_item_no"):
                return False, f"Item {idx + 1}: Missing PO item number", po_found

            # Check if PO item exists
            po_item_exists = db.execute(
                """
                SELECT id, ord_qty, delivered_qty, pending_qty FROM purchase_order_items 
                WHERE po_number = :po_number AND po_item_no = :po_item_no
            """,
                {"po_number": header["po_number"], "po_item_no": item["po_item_no"]},
            ).fetchone()

            if not po_item_exists:
                return (
                    False,
                    f"Item {idx + 1}: PO item number {item['po_item_no']} not found in PO {header['po_number']}",
                    po_found,
                )

            # Warning (not error) if dispatch qty > pending qty
            challan_qty = item.get("challan_qty", 0)
            pending_qty = po_item_exists["pending_qty"] or 0
            if challan_qty > pending_qty:
                # This is a warning, not a blocker - data may be out of sync
                pass  # Logged elsewhere, don't fail validation

    return True, "Valid", po_found


def ingest_srv_to_db(
    srv_data: Dict, db: sqlite3.Connection, po_found: bool = True
) -> bool:
    """
    Insert SRV data into database with transaction safety.
    Also updates PO item quantities with received and rejected quantities from SRV.

    Args:
        srv_data: Validated SRV data
        db: Database session
        po_found: Whether the referenced PO exists in database

    Returns:
       bool: Success status

    Raises:
        Exception: If database operation fails
    """
    header = srv_data["header"]
    items = srv_data["items"]

    try:
        # 1. Insert NEW SRV header (Soft Delete logic removed as duplicates are rejected)
        db.execute(
            """
            INSERT INTO srvs (srv_number, srv_date, po_number, srv_status, po_found, file_hash, is_active, created_at, updated_at)
            VALUES (:srv_number, :srv_date, :po_number, :srv_status, :po_found, :file_hash, 1, :created_at, :updated_at)
        """,
            {
                "srv_number": header["srv_number"],
                "srv_date": header["srv_date"],
                "po_number": header["po_number"],
                "srv_status": "Received",
                "po_found": 1 if po_found else 0,
                "file_hash": header.get("file_hash"),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            },
        )

        # 2. Insert SRV items
        for item in items:
            # Enforce accounting invariant: Received = Accepted + Rejected
            received_qty = item.get("received_qty", 0)
            rejected_qty = item.get("rejected_qty", 0)
            accepted_qty = item.get("accepted_qty", 0)

            if accepted_qty == 0 and received_qty > 0:
                accepted_qty = max(0, received_qty - rejected_qty)

            db.execute(
                """
                INSERT INTO srv_items 
                (srv_number, po_number, po_item_no, lot_no, received_qty, rejected_qty, 
                 challan_no, invoice_no, remarks, created_at,
                 invoice_date, challan_date, order_qty, challan_qty, accepted_qty, unit,
                 div_code, pmir_no, finance_date, cnote_no, cnote_date)
                VALUES 
                (:srv_number, :po_number, :po_item_no, :lot_no, :received_qty, :rejected_qty,
                 :challan_no, :invoice_no, :remarks, :created_at,
                 :invoice_date, :challan_date, :order_qty, :challan_qty, :accepted_qty, :unit,
                 :div_code, :pmir_no, :finance_date, :cnote_no, :cnote_date)
            """,
                {
                    "srv_number": header["srv_number"],
                    "po_number": header["po_number"],
                    "po_item_no": item["po_item_no"],
                    "lot_no": item.get("lot_no"),
                    "received_qty": received_qty,
                    "rejected_qty": rejected_qty,
                    "challan_no": item.get("challan_no"),
                    "invoice_no": item.get("invoice_no"),
                    "remarks": item.get("remarks"),
                    "created_at": datetime.now().isoformat(),
                    "invoice_date": item.get("invoice_date"),
                    "challan_date": item.get("challan_date"),
                    "order_qty": item.get("order_qty", 0),
                    "challan_qty": item.get("challan_qty", 0),
                    "accepted_qty": accepted_qty,
                    "unit": item.get("unit"),
                    "div_code": item.get("div_code"),
                    "pmir_no": item.get("pmir_no"),
                    "finance_date": item.get("finance_date"),
                    "cnote_no": item.get("cnote_no"),
                    "cnote_date": item.get("cnote_date"),
                },
            )

        # 3. Update PO item quantities if PO exists
        if po_found:
            for item in items:
                # Get current totals for this PO item from all SRVs
                srv_totals = db.execute(
                    """
                    SELECT 
                        COALESCE(SUM(received_qty), 0) as total_received,
                        COALESCE(SUM(rejected_qty), 0) as total_rejected
                    FROM srv_items si
                    JOIN srvs s ON si.srv_number = s.srv_number
                    WHERE s.po_number = :po_number AND si.po_item_no = :po_item_no AND s.is_active = 1
                """,
                    {
                        "po_number": header["po_number"],
                        "po_item_no": item["po_item_no"],
                    },
                ).fetchone()

                # Update PO item with aggregated quantities
                if srv_totals:
                    db.execute(
                        """
                        UPDATE purchase_order_items
                        SET 
                            rcd_qty = :received_qty,
                            rejected_qty = :rejected_qty,
                            updated_at = :updated_at
                        WHERE po_number = :po_number AND po_item_no = :po_item_no
                    """,
                        {
                            "received_qty": float(srv_totals[0]),
                            "rejected_qty": float(srv_totals[1]),
                            "updated_at": datetime.now().isoformat(),
                            "po_number": header["po_number"],
                            "po_item_no": item["po_item_no"],
                        },
                    )

        # 4. Commit transaction
        db.commit()
        return True

    except Exception as e:
        db.rollback()
        raise e


def get_srv_aggregated_quantities(po_number: str, db: sqlite3.Connection) -> Dict:
    """
    Get aggregated received and rejected quantities per PO item from all SRVs.

    Args:
        po_number: PO number
        db: Database connection

    Returns:
        dict: {po_item_no: {"received_qty": float, "rejected_qty": float}}
    """
    result = db.execute(
        """
        SELECT 
            po_item_no,
            SUM(received_qty) as total_received,
            SUM(rejected_qty) as total_rejected
        FROM srv_items
        WHERE po_number = :po_number
        GROUP BY po_item_no
    """,
        {"po_number": po_number},
    ).fetchall()

    aggregated = {}
    for row in result:
        aggregated[row[0]] = {
            "received_qty": float(row[1] or 0),
            "rejected_qty": float(row[2] or 0),
        }

    return aggregated


def process_srv_file(
    contents: bytes,
    filename: str,
    db: sqlite3.Connection,
    po_from_filename: Optional[int] = None,
) -> Tuple[bool, List[str]]:
    """
    Process an uploaded SRV HTML file.
    Parses content, validates against DB, and ingests if valid.
    Handles files containing multiple SRVs.
    """
    import hashlib

    file_hash = hashlib.sha256(contents).hexdigest()

    try:
        html_content = contents.decode("utf-8")
        srv_list = scrape_srv_html(html_content)

        if not srv_list:
            return False, ["No valid SRVs found in file"]

        results = []
        for srv_data in srv_list:
            header = srv_data.get("header", {})
            header["file_hash"] = file_hash  # Inject hash

            # Check for exact duplicate file upload (Idempotency)
            # User requested Overwrite instead of Skip.
            # So we check if SRV exists, and if so, delete it before re-ingesting.

            existing_srv = db.execute(
                "SELECT 1 FROM srvs WHERE srv_number = :srv_number",
                {"srv_number": header.get("srv_number")},
            ).fetchone()

            if existing_srv:
                # Delete existing SRV to allow overwrite
                # This handles rollback of quantities from PO items implicitly in delete_srv
                delete_srv(header.get("srv_number"), db)

            # If PO extraction failed from HTML, try filename fallback
            if not header.get("po_number") and po_from_filename:
                header["po_number"] = str(po_from_filename)

            # Validate
            is_valid, message, po_found = validate_srv_data(srv_data, db)

            # Add po_found status to header for ingestion
            header["po_found"] = po_found
            if not po_found:
                header["warning_message"] = message

            if not is_valid:
                results.append(
                    {
                        "success": False,
                        "srv_number": header.get("srv_number", "Unknown"),
                        "error": message,
                    }
                )
                continue

            # Ingest
            try:
                ingest_srv_to_db(srv_data, db, po_found)
                results.append(
                    {
                        "success": True,
                        "srv_number": header.get("srv_number"),
                        "warnings": [message] if not po_found else [],
                    }
                )
            except Exception as e:
                print(f"Error ingesting SRV {header.get('srv_number')}: {e}")
                results.append(
                    {
                        "success": False,
                        "srv_number": header.get("srv_number", "Unknown"),
                        "error": str(e),
                    }
                )

        # Summarize results
        success_count = sum(1 for r in results if r["success"])

        all_messages = []
        for r in results:
            prefix = f"SRV {r['srv_number']}: "
            if r["success"]:
                if r.get("warnings"):
                    all_messages.append(
                        f"{prefix}Success (Warning: {r['warnings'][0]})"
                    )
                else:
                    all_messages.append(f"{prefix}Success")
            else:
                all_messages.append(f"{prefix}Failed: {r['error']}")

        if success_count > 0:
            return True, all_messages
        else:
            return False, all_messages

    except Exception as e:
        print(f"Error processing SRV file {filename}: {e}")
        import traceback

        traceback.print_exc()
        return False, [str(e)]


def delete_srv(srv_number: str, db: sqlite3.Connection) -> Tuple[bool, str]:
    """
    Delete an SRV (Hard Delete) and rollback quantities.

    Strategy:
    1. Identify affected PO items.
    2. Permanently DELETE srv_items and srvs records.
    3. Recalculate 'rcd_qty' and 'rejected_qty' for affected PO items
       by summing up remaining SRV items.

    Args:
        srv_number: SRV number to delete
        db: Database connection

    Returns:
        (success: bool, message: str)
    """
    try:
        # 1. Get affected PO items before deleting
        affected_items = db.execute(
            """
            SELECT DISTINCT po_number, po_item_no 
            FROM srv_items 
            WHERE srv_number = :srv_number
        """,
            {"srv_number": srv_number},
        ).fetchall()

        if not affected_items:
            # Check if SRV exists even without items (edge case)
            srv_exists = db.execute(
                "SELECT 1 FROM srvs WHERE srv_number = :srv", {"srv": srv_number}
            ).fetchone()
            if not srv_exists:
                return False, f"SRV {srv_number} not found"

        # 2. Hard Delete SRV Items first (FK constraint safety)
        db.execute(
            "DELETE FROM srv_items WHERE srv_number = :srv_number",
            {"srv_number": srv_number},
        )

        # 3. Hard Delete SRV Header
        db.execute(
            "DELETE FROM srvs WHERE srv_number = :srv_number",
            {"srv_number": srv_number},
        )

        # 4. Recalculate quantities for affected PO items
        for row in affected_items:
            po_number, po_item_no = row

            # Sum up remaining SRV items
            srv_totals = db.execute(
                """
                SELECT 
                    COALESCE(SUM(received_qty), 0) as total_received,
                    COALESCE(SUM(rejected_qty), 0) as total_rejected
                FROM srv_items
                WHERE po_number = :po_number AND po_item_no = :po_item_no
            """,
                {"po_number": po_number, "po_item_no": po_item_no},
            ).fetchone()

            if srv_totals:
                received_qty = float(srv_totals[0])
                rejected_qty = float(srv_totals[1])

                db.execute(
                    """
                    UPDATE purchase_order_items
                    SET 
                        rcd_qty = :received_qty,
                        rejected_qty = :rejected_qty,
                        updated_at = :now
                    WHERE po_number = :po_number AND po_item_no = :po_item_no
                """,
                    {
                        "received_qty": received_qty,
                        "rejected_qty": rejected_qty,
                        "now": datetime.now().isoformat(),
                        "po_number": po_number,
                        "po_item_no": po_item_no,
                    },
                )

        db.commit()
        return True, f"SRV {srv_number} has been permanently deleted"

    except Exception as e:
        db.rollback()
        return False, f"Failed to delete SRV: {str(e)}"
