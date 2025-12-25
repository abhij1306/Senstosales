-- Add unique constraints to ensure data integrity
-- PO item description uniqueness within a PO (optional but good)
-- For now focusing on primary document uniqueness which is already in PK, 
-- but ensuring indexes exist for searching.

-- Consistency for Materials
CREATE TABLE IF NOT EXISTS materials (
    material_code TEXT PRIMARY KEY,
    description TEXT,
    unit TEXT,
    hsn_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint for Supplier Code if needed
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_code_unique ON purchase_orders(supplier_code) WHERE supplier_code IS NOT NULL;
