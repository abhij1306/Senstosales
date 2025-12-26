-- Migration: Add missing fields to gst_invoices matching Excel template requirements
ALTER TABLE gst_invoices ADD COLUMN gemc_number TEXT;
ALTER TABLE gst_invoices ADD COLUMN mode_of_payment TEXT DEFAULT '45 Days';
ALTER TABLE gst_invoices ADD COLUMN srv_no TEXT;
ALTER TABLE gst_invoices ADD COLUMN srv_date TEXT;
ALTER TABLE gst_invoices ADD COLUMN despatch_doc_no TEXT;
