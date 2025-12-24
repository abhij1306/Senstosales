-- Migration: Document Counters Table
-- Purpose: Canonical, atomic number generation for DC, Invoice, SRV
-- Date: 2025-12-24

CREATE TABLE IF NOT EXISTS document_sequences (
    seq_key TEXT PRIMARY KEY,
    current_val INTEGER DEFAULT 0,
    prefix TEXT,
    suffix TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial counters if not exist
INSERT OR IGNORE INTO document_sequences (seq_key, current_val, prefix) VALUES 
('DC_GLOBAL', 0, 'DC'),
('INVOICE_GLOBAL', 0, 'INV'),
('SRV_GLOBAL', 0, 'SRV');

-- Note: Delivery Challans are often per-PO. 
-- If we want strict sequential per PO, we might need a composite key or just logic.
-- However, the user asked for "DC generation must be per PO sequential".
-- "Invoice generation must be global sequential".
-- "SRV numbering must be unique".

-- For per-PO DC, we can't easily use a single row per key unless the key is dynamic (e.g., "PO123_DC").
