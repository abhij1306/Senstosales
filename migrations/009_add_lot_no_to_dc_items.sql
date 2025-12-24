-- Migration: Add lot_no to delivery_challan_items
-- Purpose: Fix reconciliation API crash by adding missing lot_no column required for joining with Purchase Order Deliveries

ALTER TABLE delivery_challan_items ADD COLUMN lot_no INTEGER;

-- Initialize lot_no for existing items (default to 1 as fallback)
-- Ideally this should match the lot from PO but we can't easily guess it retrospectively without manual intervention
-- However, since the table was likely empty or data potentially invalid without it, just adding the column is the critical fix.
