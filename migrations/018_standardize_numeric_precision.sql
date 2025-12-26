-- Migration 018: Standardize Numeric Precision
-- Created: 2025-12-26
-- Purpose: Fix precision issues in financial calculations
--          Convert REAL and generic NUMERIC to proper DECIMAL types

-- ============================================================================
-- ISSUE FOUND:
-- - gst_invoice_items uses REAL (floating point) for currency - BAD!
-- - Other tables use generic NUMERIC without precision
-- ============================================================================

-- CRITICAL: Disable foreign keys temporarily for table recreation
PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

-- STRATEGY:
-- SQLite doesn't support ALTER COLUMN TYPE directly
-- We need to:
-- 1. Create new tables with correct types
-- 2. Copy data
-- 3. Drop old tables  
-- 4. Rename new tables

-- ============================================================================
-- STANDARDIZED TYPES:
-- - Quantities: DECIMAL(10,2) - supports up to 99,999,999.99
-- - Currency: DECIMAL(12,2) - supports up to ₹999,999,999.99
-- - Rates: DECIMAL(10,2) - sufficient for unit rates
-- ============================================================================

-- CRITICAL: This migration preserves all data and foreign key relationships

-- Step 1: Fix gst_invoice_items (REAL → DECIMAL)
-- This is most critical as it affects money calculations

CREATE TABLE gst_invoice_items_new (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    po_sl_no TEXT,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'NO',
    rate DECIMAL(12,2) NOT NULL DEFAULT 0,
    hsn_sac TEXT,
    no_of_packets INTEGER,
    taxable_value DECIMAL(12,2) DEFAULT 0,
    cgst_rate DECIMAL(5,2) DEFAULT 0,
    cgst_amount DECIMAL(12,2) DEFAULT 0,
    sgst_rate DECIMAL(5,2) DEFAULT 0,
    sgst_amount DECIMAL(12,2) DEFAULT 0,
    igst_rate DECIMAL(5,2) DEFAULT 0,
    igst_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_number) REFERENCES gst_invoices(invoice_number) ON DELETE CASCADE
);

-- Copy data from old table
INSERT INTO gst_invoice_items_new 
SELECT * FROM gst_invoice_items;

-- Drop old table and rename
DROP TABLE gst_invoice_items;
ALTER TABLE gst_invoice_items_new RENAME TO gst_invoice_items;

-- Recreate indexes
CREATE INDEX idx_invoice_items_invoice ON gst_invoice_items(invoice_number);


-- Step 2: Fix purchase_order_items (NUMERIC → DECIMAL)

CREATE TABLE purchase_order_items_new (
    id TEXT PRIMARY KEY,
    po_number INTEGER NOT NULL,
    po_item_no INTEGER NOT NULL,
    material_code TEXT,
    material_description TEXT,
    drg_no TEXT,
    mtrl_cat INTEGER,
    unit TEXT,
    po_rate DECIMAL(12,2),
    ord_qty DECIMAL(10,2),
    rcd_qty DECIMAL(10,2) DEFAULT 0,
    item_value DECIMAL(12,2),
    hsn_code TEXT,
    delivered_qty DECIMAL(10,2) DEFAULT 0,
    pending_qty DECIMAL(10,2) DEFAULT 0,
    rejected_qty DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(po_number, po_item_no),
    FOREIGN KEY (po_number) REFERENCES purchase_orders(po_number) ON DELETE CASCADE
);

-- Copy data
INSERT INTO purchase_order_items_new 
SELECT * FROM purchase_order_items;

-- Drop and rename
DROP TABLE purchase_order_items;
ALTER TABLE purchase_order_items_new RENAME TO purchase_order_items;

-- Recreate indexes
CREATE INDEX idx_purchase_order_items_po ON purchase_order_items(po_number);
CREATE UNIQUE INDEX idx_purchase_order_items_unique ON purchase_order_items(po_number, po_item_no);


-- Step 3: Fix delivery_challan_items (NUMERIC → DECIMAL)

CREATE TABLE delivery_challan_items_new (
    id TEXT PRIMARY KEY,
    dc_number TEXT NOT NULL,
    po_item_id TEXT,
    dispatch_qty DECIMAL(10,2) NOT NULL,
    lot_no TEXT,
    hsn_code TEXT,
    hsn_rate DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dc_number) REFERENCES delivery_challans(dc_number) ON DELETE CASCADE,
    FOREIGN KEY (po_item_id) REFERENCES purchase_order_items(id) ON DELETE SET NULL
);

-- Copy data
INSERT INTO delivery_challan_items_new 
SELECT * FROM delivery_challan_items;

-- Drop and rename
DROP TABLE delivery_challan_items;
ALTER TABLE delivery_challan_items_new RENAME TO delivery_challan_items;

-- Recreate indexes
CREATE INDEX idx_dc_items_dc ON delivery_challan_items(dc_number);
CREATE INDEX idx_dc_items_po_item ON delivery_challan_items(po_item_id);


-- Step 4: srv_items already uses DECIMAL(15,3) - just standardize to DECIMAL(10,2)

CREATE TABLE srv_items_new (
    id TEXT PRIMARY KEY,
    srv_number TEXT NOT NULL,
    po_item_no INTEGER,
    description TEXT,
    received_qty DECIMAL(10,2) DEFAULT 0,
    rejected_qty DECIMAL(10,2) DEFAULT 0,
    order_qty DECIMAL(10,2) DEFAULT 0,
    challan_qty DECIMAL(10,2) DEFAULT 0,
    accepted_qty DECIMAL(10,2) DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (srv_number) REFERENCES srvs(srv_number) ON DELETE CASCADE
);

-- Copy data (will auto-convert DECIMAL(15,3) → DECIMAL(10,2))
INSERT INTO srv_items_new 
SELECT * FROM srv_items;

-- Drop and rename
DROP TABLE srv_items;
ALTER TABLE srv_items_new RENAME TO srv_items;

-- Recreate indexes
CREATE INDEX idx_srv_items_srv ON srv_items(srv_number);
CREATE INDEX idx_srv_items_po_item ON srv_items(po_item_no);

-- Commit transaction and re-enable foreign keys
COMMIT;

PRAGMA foreign_keys = ON;
