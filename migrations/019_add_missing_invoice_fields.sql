-- Add missing columns to gst_invoices table for new UI fields
-- Safe additions using ALTER TABLE

ALTER TABLE gst_invoices ADD COLUMN gemc_number TEXT;
ALTER TABLE gst_invoices ADD COLUMN gemc_date TEXT;
ALTER TABLE gst_invoices ADD COLUMN srv_no TEXT;
ALTER TABLE gst_invoices ADD COLUMN srv_date TEXT;
ALTER TABLE gst_invoices ADD COLUMN despatch_doc_no TEXT;
ALTER TABLE gst_invoices ADD COLUMN mode_of_payment TEXT;
ALTER TABLE gst_invoices ADD COLUMN payment_terms TEXT DEFAULT '45 Days';
