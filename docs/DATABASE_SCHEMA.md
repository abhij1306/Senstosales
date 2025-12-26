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

### `po_items`
**Purpose**: Store line items for each PO  
**Primary Key**: `id` (Auto-increment)  
**Foreign Key**: `po_number` → `purchase_orders.po_number`

```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
po_number VARCHAR(50) REFERENCES purchase_orders(po_number)
po_item_no INTEGER                 -- Item sequence number
material_code VARCHAR(100)
material_description TEXT
drg_no VARCHAR(100)
unit VARCHAR(20)
ord_qty DECIMAL(15,3)
po_rate DECIMAL(15,2)
item_value DECIMAL(15,2)           -- ord_qty * po_rate
```

### `po_deliveries`
**Purpose**: Store delivery schedule for each item  
**Primary Key**: `id` (Auto-increment)  
**Foreign Key**: `po_item_id` → `po_items.id`

```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
po_item_id INTEGER REFERENCES po_items(id)
lot_no INTEGER
dely_qty DECIMAL(15,3)
dely_date DATE
entry_allow_date DATE
dest_code VARCHAR(50)
```

### `delivery_challans`
**Purpose**: Store headers for Delivery Challans (DC)  
**Primary Key**: `dc_number`

```sql
dc_number VARCHAR(50) PRIMARY KEY   -- Generated (DC + random + FY)
dc_date DATE
po_number VARCHAR(50) REFERENCES purchase_orders(po_number)
consignee_name VARCHAR(200)
status VARCHAR(20)                  -- 'Pending', 'Delivered'
created_at TIMESTAMP DEFAULT NOW()
```

### `delivery_challan_items`
**Purpose**: Link DCs to specific PO delivery lots

```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
dc_number VARCHAR(50) REFERENCES delivery_challans(dc_number)
po_item_id INTEGER REFERENCES po_items(id)
lot_no INTEGER                      -- Specific delivery lot
quantity DECIMAL(15,3)              -- Dispatched quantity
```

### `invoices`
**Purpose**: Store GST Invoices linked to DCs  
**Primary Key**: `invoice_number`

```sql
invoice_number VARCHAR(50) PRIMARY KEY
invoice_date DATE
dc_number VARCHAR(50) REFERENCES delivery_challans(dc_number)
total_amount DECIMAL(15,2)
tax_amount DECIMAL(15,2)
net_amount DECIMAL(15,2)
status VARCHAR(20)                  -- 'Pending', 'Paid'
created_at TIMESTAMP DEFAULT NOW()
```

### `srvs` (Store Receipt Vouchers)
**Purpose**: Record receipt of goods at customer site

```sql
srv_number VARCHAR(50) PRIMARY KEY
srv_date DATE
po_number VARCHAR(50) REFERENCES purchase_orders(po_number)
raw_html_content TEXT               -- Original uploaded HTML
status VARCHAR(20)                  -- 'Matched', 'Unmatched'
created_at TIMESTAMP DEFAULT NOW()
```

---

## Indexes
- `idx_po_items_po_number` on `purchase_order_items(po_number)`
- `idx_po_deliveries_po_item_id` on `po_deliveries(po_item_id)`
- `idx_dci_po_item` on `delivery_challan_items(po_item_id)`
- `idx_srv_po` on `srvs(po_number)`
