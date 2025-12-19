-- Migration: Add Data Integrity Constraints
-- Date: 2025-12-19
-- Purpose: Add database-level constraints to prevent data integrity issues

-- Constraint 1: Prevent negative dispatch quantities
-- Note: SQLite triggers fire BEFORE the operation, so we can validate
CREATE TRIGGER IF NOT EXISTS check_dispatch_qty_positive
BEFORE INSERT ON delivery_challan_items
FOR EACH ROW
WHEN NEW.dispatch_qty <= 0
BEGIN
    SELECT RAISE(ABORT, 'Dispatch quantity must be greater than 0');
END;

-- Constraint 2: Also check on UPDATE
CREATE TRIGGER IF NOT EXISTS check_dispatch_qty_positive_update
BEFORE UPDATE ON delivery_challan_items
FOR EACH ROW
WHEN NEW.dispatch_qty <= 0
BEGIN
    SELECT RAISE(ABORT, 'Dispatch quantity must be greater than 0');
END;

-- Constraint 3: Prevent negative invoice amounts
CREATE TRIGGER IF NOT EXISTS check_invoice_amount_positive
BEFORE INSERT ON gst_invoices
FOR EACH ROW
WHEN NEW.total_invoice_value < 0
BEGIN
    SELECT RAISE(ABORT, 'Invoice total value cannot be negative');
END;

CREATE TRIGGER IF NOT EXISTS check_invoice_amount_positive_update
BEFORE UPDATE ON gst_invoices
FOR EACH ROW
WHEN NEW.total_invoice_value < 0
BEGIN
    SELECT RAISE(ABORT, 'Invoice total value cannot be negative');
END;

-- Constraint 4: Prevent negative PO quantities
CREATE TRIGGER IF NOT EXISTS check_po_qty_positive
BEFORE INSERT ON purchase_order_items
FOR EACH ROW
WHEN NEW.ord_qty <= 0
BEGIN
    SELECT RAISE(ABORT, 'PO ordered quantity must be greater than 0');
END;

CREATE TRIGGER IF NOT EXISTS check_po_qty_positive_update
BEFORE UPDATE ON purchase_order_items
FOR EACH ROW
WHEN NEW.ord_qty <= 0
BEGIN
    SELECT RAISE(ABORT, 'PO ordered quantity must be greater than 0');
END;

-- Constraint 5: Prevent negative delivery quantities
CREATE TRIGGER IF NOT EXISTS check_delivery_qty_positive
BEFORE INSERT ON purchase_order_deliveries
FOR EACH ROW
WHEN NEW.dely_qty <= 0
BEGIN
    SELECT RAISE(ABORT, 'Delivery quantity must be greater than 0');
END;

CREATE TRIGGER IF NOT EXISTS check_delivery_qty_positive_update
BEFORE UPDATE ON purchase_order_deliveries
FOR EACH ROW
WHEN NEW.dely_qty <= 0
BEGIN
    SELECT RAISE(ABORT, 'Delivery quantity must be greater than 0');
END;

-- Verify triggers were created
SELECT 'Constraint triggers created. Total triggers: ' || COUNT(*) as result
FROM sqlite_master 
WHERE type = 'trigger' 
AND name LIKE 'check_%';
