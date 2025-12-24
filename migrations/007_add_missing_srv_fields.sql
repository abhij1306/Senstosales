-- Migration: Add missing SRV Item fields
-- Purpose: Add columns for Tax Invoice Date, Order Qty, Challan Qty, Accepted Qty, Challan Date, Unit

ALTER TABLE srv_items ADD COLUMN invoice_date DATE;
ALTER TABLE srv_items ADD COLUMN challan_date DATE;
ALTER TABLE srv_items ADD COLUMN order_qty DECIMAL(15,3) DEFAULT 0;
ALTER TABLE srv_items ADD COLUMN challan_qty DECIMAL(15,3) DEFAULT 0;
ALTER TABLE srv_items ADD COLUMN accepted_qty DECIMAL(15,3) DEFAULT 0;
ALTER TABLE srv_items ADD COLUMN unit VARCHAR(20);
