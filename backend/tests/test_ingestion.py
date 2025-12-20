import unittest
import sqlite3
import sys
import os

# Add backend to path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ingest_po import POIngestionService

SCHEMA_SQL = """
CREATE TABLE purchase_orders (
    po_number INTEGER PRIMARY KEY,
    po_date DATE,
    supplier_name TEXT,
    supplier_gstin TEXT,
    supplier_code TEXT,
    supplier_phone TEXT,
    supplier_fax TEXT,
    supplier_email TEXT,
    department_no INTEGER,
    enquiry_no TEXT,
    enquiry_date DATE,
    quotation_ref TEXT,
    quotation_date DATE,
    rc_no TEXT,
    order_type TEXT,
    po_status TEXT,
    tin_no TEXT,
    ecc_no TEXT,
    mpct_no TEXT,
    po_value NUMERIC,
    fob_value NUMERIC,
    ex_rate NUMERIC,
    currency TEXT,
    net_po_value NUMERIC,
    amend_no INTEGER DEFAULT 0,
    amend_1_date DATE,
    amend_2_date DATE,
    inspection_by TEXT,
    inspection_at TEXT,
    issuer_name TEXT,
    issuer_designation TEXT,
    issuer_phone TEXT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_items (
    id TEXT PRIMARY KEY,
    po_number INTEGER NOT NULL REFERENCES purchase_orders(po_number) ON DELETE CASCADE,
    po_item_no INTEGER,
    material_code TEXT,
    material_description TEXT,
    drg_no TEXT,
    mtrl_cat INTEGER,
    unit TEXT,
    po_rate NUMERIC,
    ord_qty NUMERIC,
    rcd_qty NUMERIC DEFAULT 0,
    item_value NUMERIC,
    hsn_code TEXT,
    delivered_qty NUMERIC DEFAULT 0,
    pending_qty NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(po_number, po_item_no)
);

CREATE TABLE purchase_order_deliveries (
    id TEXT PRIMARY KEY,
    po_item_id TEXT NOT NULL REFERENCES purchase_order_items(id) ON DELETE CASCADE,
    lot_no INTEGER,
    dely_qty NUMERIC,
    dely_date DATE,
    entry_allow_date DATE,
    dest_code INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

class TestPOIngestion(unittest.TestCase):
    def setUp(self):
        self.conn = sqlite3.connect(':memory:')
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.conn.executescript(SCHEMA_SQL)
        self.service = POIngestionService()

    def tearDown(self):
        self.conn.close()

    def test_ingest_new_po(self):
        po_header = {
            'PURCHASE ORDER': '12345',
            'PO DATE': '2023-01-01',
            'SUPP NAME M/S': 'Test Supplier',
            'PO-VALUE': '1000.00'
        }
        po_items = [
            {
                'PO ITM': '10',
                'MATERIAL CODE': 'MAT001',
                'ORD QTY': '100',
                'PO RATE': '10.00',
                'LOT NO': '1',
                'DELY QTY': '50',
                'DELY DATE': '2023-02-01'
            },
            {
                'PO ITM': '10', # Same item, different delivery
                'MATERIAL CODE': 'MAT001',
                'ORD QTY': '100',
                'PO RATE': '10.00',
                'LOT NO': '2',
                'DELY QTY': '50',
                'DELY DATE': '2023-03-01'
            }
        ]

        success, warnings = self.service.ingest_po(self.conn, po_header, po_items)
        
        self.assertTrue(success)
        # Verify Header
        cursor = self.conn.execute("SELECT * FROM purchase_orders WHERE po_number = 12345")
        row = cursor.fetchone()
        self.assertIsNotNone(row)
        self.assertEqual(row['supplier_name'], 'Test Supplier')

        # Verify Items
        cursor = self.conn.execute("SELECT * FROM purchase_order_items WHERE po_number = 12345")
        rows = cursor.fetchall()
        self.assertEqual(len(rows), 1) 
        item_id = rows[0]['id']
        self.assertEqual(rows[0]['ord_qty'], 100.0)

        # Verify Deliveries
        cursor = self.conn.execute("SELECT * FROM purchase_order_deliveries WHERE po_item_id = ?", (item_id,))
        deliveries = cursor.fetchall()
        self.assertEqual(len(deliveries), 2)

    def test_ingest_update_po(self):
        # Initial Ingestion
        self.test_ingest_new_po()
        
        # Update
        po_header = {
            'PURCHASE ORDER': '12345',
            'SUPP NAME M/S': 'Test Supplier Updated',
            'AMEND NO': '1'
        }
        po_items = [
             {
                'PO ITM': '20', 
                'MATERIAL CODE': 'MAT002',
                'ORD QTY': '50', 
                'LOT NO': '1',
                'DELY QTY': '50'
            }
        ]

        success, warnings = self.service.ingest_po(self.conn, po_header, po_items)
        self.assertTrue(success)
        
        # Verify Header Updated
        cursor = self.conn.execute("SELECT * FROM purchase_orders WHERE po_number = 12345")
        row = cursor.fetchone()
        self.assertEqual(row['supplier_name'], 'Test Supplier Updated')
        self.assertEqual(row['amend_no'], 1)

        # Verify Items Replaced
        cursor = self.conn.execute("SELECT * FROM purchase_order_items WHERE po_number = 12345")
        rows = cursor.fetchall()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['po_item_no'], 20)

if __name__ == '__main__':
    unittest.main()
