-- ============================================================
-- Migration: v4_add_srv_tables.sql
-- Purpose: Add SRV (Stores Receipt Voucher) support
-- Date: 2025-12-22
-- ============================================================

-- SRV Header Table
-- Stores information about each SRV received from buyers (BHEL, NTPC, etc.)
CREATE TABLE IF NOT EXISTS srvs (
    srv_number VARCHAR(50) PRIMARY KEY,
    srv_date DATE NOT NULL,
    po_number VARCHAR(50) NOT NULL,
    srv_status VARCHAR(50) DEFAULT 'Received',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (po_number) REFERENCES purchase_orders(po_number) ON DELETE CASCADE
);

-- SRV Items Table
-- Links SRV to specific PO items with received and rejected quantities
CREATE TABLE IF NOT EXISTS srv_items (
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
    FOREIGN KEY (srv_number) REFERENCES srvs(srv_number) ON DELETE CASCADE,
    FOREIGN KEY (po_number) REFERENCES purchase_orders(po_number) ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_srv_items_srv_number ON srv_items(srv_number);
CREATE INDEX IF NOT EXISTS idx_srv_items_po_number ON srv_items(po_number);
CREATE INDEX IF NOT EXISTS idx_srv_items_po_item ON srv_items(po_number, po_item_no);
CREATE INDEX IF NOT EXISTS idx_srvs_po_number ON srvs(po_number);
CREATE INDEX IF NOT EXISTS idx_srvs_date ON srvs(srv_date);

-- ============================================================
-- Verification Queries (for testing)
-- ============================================================

-- Check if tables were created successfully
-- SELECT name FROM sqlite_master WHERE type='table' AND name IN ('srvs', 'srv_items');

-- Check indexes
-- SELECT name FROM sqlite_master WHERE type='index' AND tbl_name IN ('srvs', 'srv_items');
