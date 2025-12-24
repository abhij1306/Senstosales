-- Migration: 011_fix_recon_view.sql
-- Purpose: Fix reconciliation_ledger view to use correct column ord_qty

DROP VIEW IF EXISTS reconciliation_ledger;

CREATE VIEW reconciliation_ledger AS
SELECT 
    poi.po_number,
    poi.po_item_no,
    poi.material_code,
    poi.ord_qty as ordered_quantity, -- Alias ord_qty to ordered_quantity
    
    -- Delivered Quantity (Sum from DCs)
    COALESCE((
        SELECT SUM(dci.dispatch_qty) -- Fixed: dispatch_qty not delivered_quantity
        FROM delivery_challan_items dci 
        JOIN delivery_challans dc ON dci.dc_number = dc.dc_number
        WHERE dci.po_item_id = poi.id
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
