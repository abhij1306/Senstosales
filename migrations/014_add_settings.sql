-- Add business_settings table for global configuration
CREATE TABLE IF NOT EXISTS business_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial settings if table is empty
INSERT OR IGNORE INTO business_settings (key, value) VALUES ('company_name', 'Sensto');
INSERT OR IGNORE INTO business_settings (key, value) VALUES ('company_gstin', '');
INSERT OR IGNORE INTO business_settings (key, value) VALUES ('company_address', '');
