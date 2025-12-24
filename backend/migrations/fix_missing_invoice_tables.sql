-- Fix for missing tables required by Invoice Service

CREATE TABLE IF NOT EXISTS gst_invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL,
    po_sl_no TEXT,
    description TEXT,
    hsn_sac TEXT,
    quantity REAL,
    unit TEXT,
    rate REAL,
    taxable_value REAL,
    cgst_rate REAL,
    cgst_amount REAL,
    sgst_rate REAL,
    sgst_amount REAL,
    igst_rate REAL,
    igst_amount REAL,
    total_amount REAL,
    FOREIGN KEY(invoice_number) REFERENCES gst_invoices(invoice_number)
);

CREATE TABLE IF NOT EXISTS gst_invoice_dc_links (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    dc_number TEXT NOT NULL,
    FOREIGN KEY(invoice_number) REFERENCES gst_invoices(invoice_number)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_invoice_items_inv_no ON gst_invoice_items(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_links_dc ON gst_invoice_dc_links(dc_number);
