-- Migration: Add po_found column to srvs table
-- Description: Track whether the referenced PO exists in database when SRV is uploaded
-- Date: 2025-12-23

-- Add po_found column to srvs table
ALTER TABLE srvs ADD COLUMN po_found BOOLEAN DEFAULT 1;

-- Update existing records to have po_found = 1 (assume all existing SRVs have valid POs)
UPDATE srvs SET po_found = 1 WHERE po_found IS NULL;

-- Add index for quick filtering of SRVs with missing POs
CREATE INDEX idx_srvs_po_found ON srvs(po_found);
