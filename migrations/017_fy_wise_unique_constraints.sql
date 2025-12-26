-- Migration 017: FY-Wise Unique Constraints for Supplier-Generated Documents
-- Created: 2025-12-26
-- Purpose: Enforce FY-wise uniqueness for DC and Invoice numbers (supplier-generated)
--          PO and SRV remain globally unique (buyer-generated)

-- ============================================================================
-- BUSINESS RULE:
-- - DC and Invoice numbers are supplier-generated, must be unique within FY
-- - PO and SRV numbers are buyer-generated, can repeat across FYs
-- ============================================================================

-- Drop existing global unique constraints for DC and Invoice
DROP INDEX IF EXISTS idx_unique_dc_number;
DROP INDEX IF EXISTS idx_unique_invoice_number;

-- Create FY-wise unique constraints for supplier-generated documents
CREATE UNIQUE INDEX idx_unique_dc_number_fy 
    ON delivery_challans(dc_number, financial_year);

CREATE UNIQUE INDEX idx_unique_invoice_number_fy 
    ON gst_invoices(invoice_number, financial_year);

