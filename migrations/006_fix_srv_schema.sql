-- Migration: Fix SRV Schema (Remove FK + Add Columns)
-- Purpose: 
-- 1. Remove foreign key constraint on po_number (to allow SRVs before POs)
-- 2. Add missing warning_message column
-- 3. Ensure po_found column exists

PRAGMA foreign_keys=OFF;

BEGIN TRANSACTION;

-- 1. Recreate SRVS table
ALTER TABLE srvs RENAME TO srvs_old;

CREATE TABLE srvs (
    srv_number VARCHAR(50) PRIMARY KEY,
    srv_date DATE NOT NULL,
    po_number VARCHAR(50) NOT NULL,
    srv_status VARCHAR(50) DEFAULT 'Received',
    po_found BOOLEAN DEFAULT 1,
    warning_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Removed FK on po_number
);

-- Copy data from old table
-- Note: warning_message will be NULL for existing rows
INSERT INTO srvs (srv_number, srv_date, po_number, srv_status, po_found, created_at, updated_at)
SELECT srv_number, srv_date, po_number, srv_status, po_found, created_at, updated_at
FROM srvs_old;

DROP TABLE srvs_old;

-- 2. Recreate SRV_ITEMS table
ALTER TABLE srv_items RENAME TO srv_items_old;

CREATE TABLE srv_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    srv_number VARCHAR(50) NOT NULL,
    po_number VARCHAR(50) NOT NULL,
    po_item_no INTEGER NOT NULL,
    lot_no INTEGER,
    received_qty DECIMAL(15,3) DEFAULT 0,
    rejected_qty DECIMAL(15,3) DEFAULT 0,
    challan_no VARCHAR(50),
    invoice_no VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (srv_number) REFERENCES srvs(srv_number) ON DELETE CASCADE
    -- Removed FK on po_number
);

-- Copy data
INSERT INTO srv_items (id, srv_number, po_number, po_item_no, lot_no, received_qty, rejected_qty, challan_no, invoice_no, remarks, created_at)
SELECT id, srv_number, po_number, po_item_no, lot_no, received_qty, rejected_qty, challan_no, invoice_no, remarks, created_at
FROM srv_items_old;

DROP TABLE srv_items_old;

-- 3. Recreate Indexes
CREATE INDEX idx_srv_items_srv_number ON srv_items(srv_number);
CREATE INDEX idx_srv_items_po_number ON srv_items(po_number);
CREATE INDEX idx_srv_items_po_item ON srv_items(po_number, po_item_no);
CREATE INDEX idx_srvs_po_number ON srvs(po_number);
CREATE INDEX idx_srvs_date ON srvs(srv_date);
CREATE INDEX idx_srvs_po_found ON srvs(po_found);

COMMIT;

PRAGMA foreign_keys=ON;
