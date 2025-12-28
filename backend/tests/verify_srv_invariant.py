
import sqlite3
import sys
import os

# Add backend to path
sys.path.append(os.getcwd())

from app.services.srv_ingestion import validate_srv_data

# Mock parsed SRV data with a PO number that definitely doesn't exist
mock_srv_data_orphan = {
    "header": {
        "srv_number": "SRV-TEST-ORPHAN",
        "po_number": "PO-DOES-NOT-EXIST-99999",
        "srv_date": "2025-12-28",
    },
    "items": [{"po_item_no": 1, "received_qty": 10}]
}

# Mock database connection
def test_srv_orphan_rejection():
    print("Testing SRV Orphan Rejection...")
    # Use in-memory DB or temporary file DB
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    
    # Create Purchase Order table to make the query valid (but empty of our PO)
    conn.execute("CREATE TABLE purchase_orders (po_number TEXT PRIMARY KEY)")
    
    # Run validation
    is_valid, message, po_found = validate_srv_data(mock_srv_data_orphan, conn)
    
    print(f"Valid: {is_valid}")
    print(f"Message: {message}")
    print(f"PO Found: {po_found}")

    if is_valid is False and "Error: PO PO-DOES-NOT-EXIST-99999 not found" in message:
        print("✅ TEST PASSED: Orphaned SRV correctly rejected.")
        sys.exit(0)
    else:
        print("❌ TEST FAILED: Orphaned SRV was NOT rejected or message incorrect.")
        sys.exit(1)

if __name__ == "__main__":
    test_srv_orphan_rejection()
