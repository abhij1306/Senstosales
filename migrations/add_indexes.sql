-- Migration: Add Performance Indexes
-- Date: 2025-12-19
-- Purpose: Add missing indexes to improve query performance

-- Delivery Challans indexes
CREATE INDEX IF NOT EXISTS idx_dc_po_number ON delivery_challans(po_number);
CREATE INDEX IF NOT EXISTS idx_dc_created_at ON delivery_challans(created_at);
CREATE INDEX IF NOT EXISTS idx_dc_date ON delivery_challans(dc_date);

-- Delivery Challan Items indexes
CREATE INDEX IF NOT EXISTS idx_dci_dc_number ON delivery_challan_items(dc_number);
CREATE INDEX IF NOT EXISTS idx_dci_po_item_id ON delivery_challan_items(po_item_id);
CREATE INDEX IF NOT EXISTS idx_dci_lot_no ON delivery_challan_items(po_item_id, lot_no);

-- Invoice DC Links indexes
CREATE INDEX IF NOT EXISTS idx_invoice_dc_links_dc ON gst_invoice_dc_links(dc_number);
CREATE INDEX IF NOT EXISTS idx_invoice_dc_links_invoice ON gst_invoice_dc_links(invoice_number);

-- Purchase Order Items indexes
CREATE INDEX IF NOT EXISTS idx_poi_po_number ON purchase_order_items(po_number);
CREATE INDEX IF NOT EXISTS idx_poi_id ON purchase_order_items(id);

-- Purchase Order Deliveries indexes
CREATE INDEX IF NOT EXISTS idx_pod_po_item_id ON purchase_order_deliveries(po_item_id);
CREATE INDEX IF NOT EXISTS idx_pod_lot_no ON purchase_order_deliveries(po_item_id, lot_no);

-- GST Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON gst_invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON gst_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON gst_invoices(invoice_number);

-- Purchase Orders indexes
CREATE INDEX IF NOT EXISTS idx_po_created_at ON purchase_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_po_date ON purchase_orders(po_date);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(po_status);

-- Verify indexes were created
SELECT 'Index creation complete. Total indexes created: ' || COUNT(*) as result
FROM sqlite_master 
WHERE type = 'index' 
AND name LIKE 'idx_%';
