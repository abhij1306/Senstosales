-- Migration: Add gemc_date to gst_invoices
ALTER TABLE gst_invoices ADD COLUMN gemc_date TEXT;
