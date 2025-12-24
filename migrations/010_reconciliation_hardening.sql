-- Migration: 010_reconciliation_hardening.sql
-- Purpose: Create reconciliation views and harden SRV schema

-- 1. Add Hash and Active status to SRVs for Idempotency & Revisions
ALTER TABLE srvs ADD COLUMN file_hash TEXT;
ALTER TABLE srvs ADD COLUMN is_active BOOLEAN DEFAULT 1;

-- 2. Create Reconciliation Ledger View
-- This view aggregates quantities across the supply chain to expose mismatches
CREATE VIEW reconciliation_ledger AS
SELECT 
    poi.po_number,
    poi.po_item_no,
    poi.material_code,
    poi.ordered_quantity,
    
    -- Delivered Quantity (Sum from DCs)
    COALESCE((
        SELECT SUM(dci.delivered_quantity) 
        FROM delivery_challan_items dci 
        JOIN delivery_challans dc ON dci.dc_number = dc.dc_number
        WHERE dci.po_number = poi.po_number AND dci.po_item_no = poi.po_item_no
    ), 0) as total_delivered_qty,
    
    -- Received & Rejected Quantity (Sum from Active SRVs)
    COALESCE((
        SELECT SUM(si.received_qty) 
        FROM srv_items si 
        JOIN srvs s ON si.srv_number = s.srv_number
        WHERE si.po_number = poi.po_number AND si.po_item_no = poi.po_item_no
        AND s.is_active = 1
    ), 0) as total_received_qty,
    
    COALESCE((
        SELECT SUM(si.rejected_qty) 
        FROM srv_items si 
        JOIN srvs s ON si.srv_number = s.srv_number
        WHERE si.po_number = poi.po_number AND si.po_item_no = poi.po_item_no
        AND s.is_active = 1
    ), 0) as total_rejected_qty

FROM purchase_order_items poi;
