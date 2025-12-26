import sqlite3
import json
import os

DB_PATH = 'db/business.db'

def backfill_invoices():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # Get all invoices
        invoices = cursor.execute("SELECT invoice_number, linked_dc_numbers, po_numbers, po_date FROM gst_invoices").fetchall()
        
        print(f"Found {len(invoices)} invoices to check.")
        
        updated_count = 0
        
        for inv in invoices:
            invoice_number = inv['invoice_number']
            dc_number = inv['linked_dc_numbers']
            
            needs_update = False
            new_po_number = inv['po_numbers']
            new_po_date = inv['po_date']
            
            # If PO Number or Date is missing, try to fetch from DC
            if not new_po_number or not new_po_date or new_po_number == 'null' or new_po_date == 'null':
                print(f"Invoice {invoice_number} missing PO details. DC: {dc_number}")
                
                # Get DC details
                dc = cursor.execute("SELECT po_number FROM delivery_challans WHERE dc_number = ?", (dc_number,)).fetchone()
                
                if dc and dc['po_number']:
                    found_po_number = str(dc['po_number'])
                    
                    # If we didn't have a PO number, use this one
                    if not new_po_number or new_po_number == 'null':
                         new_po_number = found_po_number
                         needs_update = True
                    
                    # Fetch PO Date
                    po = cursor.execute("SELECT po_date FROM purchase_orders WHERE po_number = ?", (found_po_number,)).fetchone()
                    if po and po['po_date']:
                        if not new_po_date or new_po_date == 'null':
                            new_po_date = po['po_date']
                            needs_update = True
                            
                    if needs_update:
                        print(f"  -> Updating Invoice {invoice_number}: PO={new_po_number}, Date={new_po_date}")
                        cursor.execute("""
                            UPDATE gst_invoices 
                            SET po_numbers = ?, po_date = ?
                            WHERE invoice_number = ?
                        """, (new_po_number, new_po_date, invoice_number))
                        updated_count += 1
                else:
                    print(f"  -> DC {dc_number} not found or has no PO number.")
            
        conn.commit()
        print(f"Backfill complete. Updated {updated_count} invoices.")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    backfill_invoices()
