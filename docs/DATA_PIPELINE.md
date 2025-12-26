# Data Pipeline & Business Logic

## Data Pipeline: PO Ingestion

The data pipeline transforms HTML PO documents into structured database records through multiple stages.

### Stage 1: File Upload
- **Trigger**: User uploads HTML files via `POST /api/po/upload/batch`.
- **Input**: Multipart form data (HTML files).

### Stage 2: HTML Parsing (Scraper)
**Service**: `backend/app/services/po_scraper.py`
1.  **Parse HTML**: Uses `BeautifulSoup` to traverse the DOM.
2.  **Header Extraction**: Iterates through key-value tables to find `PO Number`, `Date`, `Supplier`, etc.
3.  **Item Extraction**: Identifies the main items table. Handles **merged cells** (rowspan) where descriptions span multiple rows.
4.  **Delivery Schedule**: Extracts nested delivery tables for each item.

### Stage 3: Data Validation
**Service**: `backend/app/services/po_ingestion.py`
- Checks required fields: `po_number`, `po_date`.
- Validates numeric formats: `ord_qty > 0`.
- Ensures material codes exist for all items.

### Stage 4: Transactional Insertion
- Uses **SQLAlchemy** transaction to ensure Atomicity.
- **Rollback**: If any part (Header, Item, or Schedule) fails, the entire PO insertion is rolled back.
- **Idempotency**: Checks if PO exists; if so, handles as Amendment (counters increment).

---

## Business Logic Rules

### 1. PO Status Lifecycle
`New` → `Active` → `Partially Delivered` → `Fully Delivered` → `Closed`

*   **Active**: Automatically set when PO is verified.
*   **Fully Delivered**: Calculated when `sum(dispatched_qty) == ord_qty` for all items.

### 2. Delivery Logic
*   **Lot Management**: Each item has multiple delivery lots.
*   **Validation**:
    *   `Sum(delivery_lot_qty) == Item_Ordered_Qty`.
    *   Dispatch Quantity cannot exceed `Remaining Lot Quantity`.
    *   Delivery Date must be sequential across lots.

### 3. Invoice Generation
*   **Linkage**: An invoice can be linked to **multiple** Delivery Challans (DCs).
*   **Taxation**:
    *   **IGST**: If Supplier State != Customer State.
    *   **CGST+SGST**: If Supplier State == Customer State.
    *   Tax Rate is fetched from the referenced PO Item (standard rate).

### 4. SRV Reconciliation
*   **Matching**: SRVs are matched to POs based on `PO Number` and `Item Code`.
*   **Validation**: **Strict Mode** is enabled. SRVs referencing a PO that does not exist in the database are **rejected** during ingestion.
*   **Status**: `Received` (default) upon insertion.
