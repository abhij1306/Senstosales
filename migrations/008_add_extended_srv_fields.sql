-- Migration: Add extended SRV Item fields for full accounting support
-- Purpose: Add columns for Finance Date, Consignment Note details, PMIR, and Division

ALTER TABLE srv_items ADD COLUMN div_code VARCHAR(20);
ALTER TABLE srv_items ADD COLUMN pmir_no VARCHAR(50);
ALTER TABLE srv_items ADD COLUMN finance_date DATE;
ALTER TABLE srv_items ADD COLUMN cnote_no VARCHAR(50);
ALTER TABLE srv_items ADD COLUMN cnote_date DATE;
