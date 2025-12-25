
import sqlite3
import sys
import os

# Add current dir to sys.path to allow imports
sys.path.insert(0, os.getcwd())

from app.services.po_service import po_service

DB_PATH = "../db/business.db"

def check():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    # Enable row factory
    conn.row_factory = sqlite3.Row
    
    try:
        results = po_service.list_pos(conn)
        print(f"Total results: {len(results)}")
        
        po_numbers = [r.po_number for r in results]
        unique_pos = set(po_numbers)
        
        print(f"Unique PO numbers: {len(unique_pos)}")
        
        if len(results) != len(unique_pos):
            print("FAILED: Duplicates found in list_pos output!")
            # Find duplicates
            seen = set()
            duplicates = set()
            for x in po_numbers:
                if x in seen:
                    duplicates.add(x)
                seen.add(x)
            print(f"Duplicate POs: {duplicates}")
        else:
            print("SUCCESS: No duplicates in list_pos output.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check()
