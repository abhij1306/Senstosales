-- Add indexes to improve dashboard query performance

-- Purchase Orders
CREATE INDEX IF NOT EXISTS idx_po_created_at ON purchase_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(po_status);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoice_created_at ON gst_invoices(created_at);
-- Invoice number is usually PK or Unique, but ensuring index on it if used in joins
CREATE INDEX IF NOT EXISTS idx_invoice_dc_link ON gst_invoices(linked_dc_numbers);

-- Delivery Challans
CREATE INDEX IF NOT EXISTS idx_dc_created_at ON delivery_challans(created_at);

-- SRV Items (for rejection stats)
CREATE INDEX IF NOT EXISTS idx_srv_items_rejected ON srv_items(rejected_qty) WHERE rejected_qty > 0;
CREATE INDEX IF NOT EXISTS idx_srv_items_created_at ON srv_items(created_at);
