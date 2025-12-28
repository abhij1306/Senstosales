# Database Schema

## Entity Relationship Diagram
```
purchase_orders (1) ──< (N) po_items (1) ──< (N) po_deliveries
       │
       └──> suppliers (N:1)
       └──> customers (N:1)
```

## Core Tables

### `purchase_orders`
**Purpose**: Store PO header information  
**Primary Key**: `po_number` (VARCHAR)

#### Fields
**Identity & References**
```sql
po_number VARCHAR(50) PRIMARY KEY  -- e.g., "1125394"
po_date DATE                       -- e.g., "2022-12-07"
amend_no INTEGER DEFAULT 0         -- Amendment number
```

**Supplier/Buyer Information**
```sql
supplier_name VARCHAR(200)         -- e.g., "SENSTOGRAPHIC,H-20/21,..."
supplier_code VARCHAR(50)          -- e.g., "123456"
supplier_phone VARCHAR(50)
supplier_fax VARCHAR(50)
supplier_email VARCHAR(100)
```

**Financial Fields**
```sql
po_value DECIMAL(15,2)             -- Total PO value
fob_value DECIMAL(15,2)
net_po_value DECIMAL(15,2)
```

**Audit Fields**
```sql
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

### `purchase_order_items`
**Purpose**: Store line items with real-time quantity tracking  
**Primary Key**: `id` (Auto-increment)  

```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
po_number INTEGER REFERENCES purchase_orders(po_number)
po_item_no INTEGER
material_code VARCHAR(100)
material_description TEXT
ord_qty DECIMAL(15,3)
delivered_qty DECIMAL(15,3) DEFAULT 0.0  -- Tracked via DC
received_qty DECIMAL(15,3) DEFAULT 0.0   -- Tracked via SRV
rejected_qty DECIMAL(15,3) DEFAULT 0.0   -- Tracked via SRV
accepted_qty DECIMAL(15,3) DEFAULT 0.0   -- ord_qty - rejected
pending_qty DECIMAL(15,3)                -- ord_qty - delivered
```

### `gst_invoices`
**Purpose**: Legal GST Invoices with FY-wise uniqueness  

```sql
invoice_number VARCHAR(50) NOT NULL
financial_year VARCHAR(10) NOT NULL
invoice_date DATE
po_numbers VARCHAR(100)
linked_dc_numbers TEXT
taxable_value DECIMAL(15,2)
cgst DECIMAL(15,2)
sgst DECIMAL(15,2)
igst DECIMAL(15,2)
total_invoice_value DECIMAL(15,2)
status VARCHAR(20) DEFAULT 'Pending'
UNIQUE(invoice_number, financial_year)
```

### `srvs` (Store Receipt Vouchers)
**Purpose**: Hardened Store Receipt data  

```sql
srv_number VARCHAR(50) PRIMARY KEY
srv_date DATE
po_number VARCHAR(50)
po_found BOOLEAN                        -- SRV-1 (Orphaned check)
total_received_qty DECIMAL(15,3)
total_rejected_qty DECIMAL(15,3)
is_active BOOLEAN DEFAULT 1
```

---

## Performance Indexes (v5.0-Stabilized)
- `idx_poi_query`: `(po_number, po_item_no)` composite.
- `idx_dc_fy`: `(dc_number, financial_year)` unique.
- `idx_inv_fy`: `(invoice_number, financial_year)` unique.
- `idx_srv_po`: `(po_number)` for reconciliation lookups.

---
**Last Updated**: 2025-12-28
**Version**: 5.0.1
