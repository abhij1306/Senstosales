-- Migration: Add rejected_qty to purchase_order_items
-- Purpose: Support direct syncing of rejected quantities from SRVs

ALTER TABLE purchase_order_items ADD COLUMN rejected_qty NUMERIC DEFAULT 0;
