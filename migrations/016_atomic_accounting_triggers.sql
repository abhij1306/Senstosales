-- Atomic Accounting Triggers & Views
-- Objective: Single source of truth for all module quantities

-- 1. DROP and RECREATE Reconciliation Ledger View with Invoiced Qty
DROP VIEW IF EXISTS reconciliation_ledger;
CREATE VIEW reconciliation_ledger AS
SELECT 
    poi.po_number,
    poi.po_item_no,
    poi.material_code,
    poi.material_description,
    poi.ord_qty as ordered_quantity,
    
    -- Delivered Quantity (Sum from DCs)
    COALESCE((
        SELECT SUM(dci.dispatch_qty) 
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
    ), 0) as total_rejected_qty,

    -- Invoiced Quantity (Sum from Invoices linked to DCs)
    COALESCE((
        SELECT SUM(gii.quantity)
        FROM gst_invoice_items gii
        JOIN gst_invoices gi ON gii.invoice_number = gi.invoice_number
        JOIN delivery_challan_items dci ON dci.dc_number = gi.linked_dc_numbers
        WHERE dci.po_item_id = poi.id AND gii.po_sl_no = dci.lot_no
    ), 0) as total_invoiced_qty

FROM purchase_order_items poi;

-- 2. TRIGGERS for real-time aggregate updates in purchase_order_items
-- This ensures PO item totals are ALWAYS correct even if bypassed by service layer

-- DC Dispatch Trigger
CREATE TRIGGER IF NOT EXISTS trg_dc_items_dispatch_sync
AFTER INSERT ON delivery_challan_items
BEGIN
    UPDATE purchase_order_items 
    SET delivered_qty = (SELECT SUM(dispatch_qty) FROM delivery_challan_items WHERE po_item_id = NEW.po_item_id)
    WHERE id = NEW.po_item_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_dc_items_dispatch_sync_update
AFTER UPDATE OF dispatch_qty ON delivery_challan_items
BEGIN
    UPDATE purchase_order_items 
    SET delivered_qty = (SELECT SUM(dispatch_qty) FROM delivery_challan_items WHERE po_item_id = NEW.po_item_id)
    WHERE id = NEW.po_item_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_dc_items_dispatch_sync_delete
AFTER DELETE ON delivery_challan_items
BEGIN
    UPDATE purchase_order_items 
    SET delivered_qty = (SELECT SUM(dispatch_qty) FROM delivery_challan_items WHERE po_item_id = OLD.po_item_id)
    WHERE id = OLD.po_item_id;
END;

-- SRV Receipt Trigger
CREATE TRIGGER IF NOT EXISTS trg_srv_items_receipt_sync
AFTER INSERT ON srv_items
BEGIN
    UPDATE purchase_order_items 
    SET rcd_qty = (SELECT SUM(received_qty) FROM srv_items WHERE po_number = NEW.po_number AND po_item_no = NEW.po_item_no),
        rejected_qty = (SELECT SUM(rejected_qty) FROM srv_items WHERE po_number = NEW.po_number AND po_item_no = NEW.po_item_no)
    WHERE po_number = NEW.po_number AND po_item_no = NEW.po_item_no;
END;

CREATE TRIGGER IF NOT EXISTS trg_srv_items_receipt_sync_update
AFTER UPDATE OF received_qty, rejected_qty ON srv_items
BEGIN
    UPDATE purchase_order_items 
    SET rcd_qty = (SELECT SUM(received_qty) FROM srv_items WHERE po_number = NEW.po_number AND po_item_no = NEW.po_item_no),
        rejected_qty = (SELECT SUM(rejected_qty) FROM srv_items WHERE po_number = NEW.po_number AND po_item_no = NEW.po_item_no)
    WHERE po_number = NEW.po_number AND po_item_no = NEW.po_item_no;
END;

CREATE TRIGGER IF NOT EXISTS trg_srv_items_receipt_sync_delete
AFTER DELETE ON srv_items
BEGIN
    UPDATE purchase_order_items 
    SET rcd_qty = (SELECT SUM(received_qty) FROM srv_items WHERE po_number = OLD.po_number AND po_item_no = OLD.po_item_no),
        rejected_qty = (SELECT SUM(rejected_qty) FROM srv_items WHERE po_number = OLD.po_number AND po_item_no = OLD.po_item_no)
    WHERE po_number = OLD.po_number AND po_item_no = OLD.po_item_no;
END;
