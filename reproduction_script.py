
import sys
import os
# Mock app directory for imports
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.excel_service import ExcelService

# Mock Invoice Data (keys matching smart_reports.py output)
invoice_rows = [
    {
        "invoice_number": "INV-001",
        "invoice_date": "2023-12-01",
        "linked_dc_numbers": "DC-101",
        "invoice_value": 15000.0,
        "party_name": "Test Party"
    }
]

# Mock Challan Data
challan_rows = [
    {
        "dc_number": "DC-101",
        "dc_date": "2023-12-01",
        "po_number": "PO-501",
        "dispatched_qty": 10,
        "invoice_status": "Pending"
    }
]

print("Testing Invoice Export...")
try:
    ExcelService.generate_date_summary_excel("invoice", "2023-01-01", "2023-12-31", invoice_rows)
    print("Invoice Export Success")
except Exception as e:
    print(f"Invoice Export Failed: {e}")
    import traceback
    traceback.print_exc()

print("\nTesting Challan Export...")
try:
    ExcelService.generate_date_summary_excel("challan", "2023-01-01", "2023-12-31", challan_rows)
    print("Challan Export Success")
except Exception as e:
    print(f"Challan Export Failed: {e}")
    import traceback
    traceback.print_exc()
