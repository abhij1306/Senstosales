import sqlite3
from datetime import datetime

def get_fy(date_str):
    if not date_str: return "UNKNOWN"
    try:
        # Handle various formats just in case
        if "T" in date_str: date_str = date_str.split("T")[0]
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        if dt.month < 4: return f"{dt.year-1}-{str(dt.year)[2:]}"
        else: return f"{dt.year}-{str(dt.year+1)[2:]}"
    except Exception as e:
        # print(f"Date error {date_str}: {e}")
        return "2024-25" # Fallback

def migrate():
    conn = sqlite3.connect('db/business.db')
    cursor = conn.cursor()
    
    # Conf: Table, PK_Col, DateCol
    tables = [
        ("purchase_orders", "po_number", "po_date"),
        ("delivery_challans", "dc_number", "dc_date"),
        ("gst_invoices", "invoice_number", "invoice_date")
    ]
    
    for table, pk_col, date_col in tables:
        print(f"--- Migrating {table} ---")
        
        # 1. Add Column
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN financial_year TEXT")
            print("Added financial_year column")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e):
                print("Column financial_year already exists")
            else:
                print(f"Error adding column: {e}")

        # 2. Backfill
        print("Backfilling FY data...")
        try:
            # Use PK_Col to identify rows
            rows = cursor.execute(f"SELECT {pk_col}, {date_col} FROM {table}").fetchall()
            count = 0
            for row in rows:
                rid, rdate = row
                fy = get_fy(rdate)
                cursor.execute(f"UPDATE {table} SET financial_year=? WHERE {pk_col}=?", (fy, rid))
                count += 1
            conn.commit()
            print(f"Updated {count} rows")
        except Exception as e:
            print(f"Error backfilling: {e}")

        # 3. Create Index (Non-Unique per FY, just for search)
        # We CANNOT make (pk, fy) unique if pk is already unique. 
        # But we can add an index for performance.
        try:
             idx_name = f"idx_{table}_fy"
             cursor.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table}(financial_year)")
             print(f"Created index {idx_name}")
        except Exception as e:
             print(f"Index error: {e}")
            
    conn.close()
    print("Migration Complete")

if __name__ == "__main__":
    migrate()
