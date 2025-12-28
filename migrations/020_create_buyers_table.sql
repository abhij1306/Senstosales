-- Create buyers table for Multi-Buyer Management
CREATE TABLE IF NOT EXISTS buyers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gstin TEXT NOT NULL,
    billing_address TEXT NOT NULL,
    shipping_address TEXT,
    place_of_supply TEXT NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookup of default buyer
-- Note: 'IF NOT EXISTS' is not standard for indices in all SQLite versions, handling in logic often better
-- but we'll try standard creation.
CREATE INDEX IF NOT EXISTS idx_buyers_default ON buyers(is_default) WHERE is_default = 1;

-- Seed initial default buyer if table is empty (Optional, but good for UX)
INSERT INTO buyers (name, gstin, billing_address, place_of_supply, is_default)
SELECT 'BHEL Haridwar', '05AAACB4146P1ZL', 'BHEL, Haridwar - 249403, Uttarakhand', 'Uttarakhand', 1
WHERE NOT EXISTS (SELECT 1 FROM buyers);
