-- Add missing columns to gst_invoices table
-- Renamed buyers_order names to PO names where applicable as per user request

ALTER TABLE gst_invoices ADD COLUMN po_date DATE;
ALTER TABLE gst_invoices ADD COLUMN vehicle_no TEXT;
ALTER TABLE gst_invoices ADD COLUMN lr_no TEXT;
ALTER TABLE gst_invoices ADD COLUMN transporter TEXT;
ALTER TABLE gst_invoices ADD COLUMN destination TEXT;
ALTER TABLE gst_invoices ADD COLUMN terms_of_delivery TEXT;
ALTER TABLE gst_invoices ADD COLUMN gemc_number TEXT;
ALTER TABLE gst_invoices ADD COLUMN mode_of_payment TEXT;
ALTER TABLE gst_invoices ADD COLUMN payment_terms TEXT;
ALTER TABLE gst_invoices ADD COLUMN despatch_doc_no TEXT;
ALTER TABLE gst_invoices ADD COLUMN srv_no TEXT;
ALTER TABLE gst_invoices ADD COLUMN srv_date DATE;
ALTER TABLE gst_invoices ADD COLUMN buyer_state TEXT;
ALTER TABLE gst_invoices ADD COLUMN buyer_state_code TEXT;
