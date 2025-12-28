# System Invariants

## Purpose
This document defines the **absolute truths** of the SenstoSales system. These invariants must **never** be violated, whether operations are performed by human users or AI agents.

## Core Business Rules

### 1. Purchase Order (PO) Invariants

#### PO-1: Immutable PO Number
- **Rule**: Once a PO is created, its `po_number` cannot be changed
- **Rationale**: PO number is the primary identifier referenced across DCs and Invoices
- **Enforcement**: Database constraint + Service layer validation

#### PO-2: Delivery Quantity Bounds
- **Rule**: Sum of all delivery quantities for a PO item cannot exceed `ord_qty`
- **Formula**: `Σ(delivery.dely_qty) ≤ po_item.ord_qty`
- **Enforcement**: Service layer validation before DC creation

#### PO-3: Idempotent Ingestion
- **Rule**: Re-uploading a PO must preserve existing links (DCs, SRVs)
- **Enforcement**: `POIngestionService` uses UPSERT instead of DELETE/INSERT

### 2. Delivery Challan (DC) Invariants

#### DC-1: Dispatch Quantity Constraint
- **Rule**: Dispatch quantity cannot exceed remaining quantity for any lot
- **Formula**: `dispatch_qty ≤ (lot_ordered_qty - already_dispatched)`
- **Enforcement**: `services/dc.py::validate_dc_items()`
- **Error**: Raises `BusinessRuleViolation` if violated

#### DC-2: Single Invoice Link
- **Rule**: A DC can be linked to at most ONE invoice
- **Rationale**: Prevents double-billing
- **Enforcement**: Database constraint + `check_dc_has_invoice()` check
- **Error**: Raises `ConflictError` with code `DC_ALREADY_INVOICED`

#### DC-3: PO Reference Integrity
- **Rule**: If a DC references a PO, that PO must exist
- **Enforcement**: Foreign key constraint + service validation
- **Error**: Raises `ResourceNotFoundError` if PO not found

#### DC-4: Deletion Rollback
- **Rule**: Deleting a DC must restore pending quantities in the reconciliation ledger
- **Enforcement**: Cascading deletes + SQL view aggregation

### 3. Invoice Invariants

#### INV-1: Unique Invoice Number
- **Rule**: Invoice numbers must be globally unique
- **Enforcement**: Database unique constraint + `check_invoice_number_exists()`
- **Error**: Raises `ConflictError` with code `INVOICE_NUMBER_EXISTS`

#### INV-2: Server-Side Tax Calculation
- **Rule**: Tax amounts (CGST, SGST, IGST) are **always** calculated by the backend
- **Rationale**: Prevents tampering, ensures accuracy
- **Enforcement**: `services/invoice.py::create_invoice()` recalculates all taxes
- **Client Behavior**: Frontend displays calculated values but cannot override

#### INV-3: Invoice Total Integrity
- **Rule**: `total_invoice_value = taxable_value + cgst + sgst + igst`
- **Enforcement**: Calculated in `create_invoice()`, not accepted from client
- **Verification**: Automated test in test suite

#### INV-4: DC-Invoice Linkage
- **Rule**: An invoice must reference at least one valid DC
- **Enforcement**: Service layer validates DC existence before invoice creation
- **Error**: Raises `ResourceNotFoundError` if DC not found

### 4. Store Receipt Voucher (SRV) Invariants

#### SRV-1: Strict PO Linkage Required
- **Rule**: SRVs can ONLY be uploaded if the referenced PO exists in the system.
- **Rationale**: Prevents data integrity issues and ensures all received items can be reconciled against an ordered quantity.
- **Enforcement**: `services/srv_ingestion.py` validating against `purchase_orders` table.
- **Error**: Rejects upload with "PO Not Found" error.

#### SRV-2: Quantity Integrity
- **Rule**: Sum of received quantities across SRV items cannot exceed the total dispatched quantity for that item.
- **Formula**: `Σ(srv_item.received_qty) ≤ Σ(dc_item.dispatch_qty)`
- **Enforcement**: Strict validation in `services/srv_ingestion.py` and `db.trigger` (if applicable).
- **Error**: Raises `BusinessRuleViolation` with code `SRV_EXCEEDS_DISPATCH`.

#### SRV-3: Status Derivation
- **Rule**: `accepted_qty = max(0, received_qty - rejected_qty)`
- **Enforcement**: Automatic calculation in backend models.

## Enforcement Layers (v5.0-Stabilized)

### Layer 1: PostgreSQL/SQLite Constraints
- Strict Foreign Keys + `ON DELETE RESTRICT` for DC/Invoice links.
- Unique constraints on financial years for DC/Invoice numbers.

### Layer 2: Service Layer Hardening
- Every write operation wrapped in `ServiceResult` or `DomainError`.
- `BEGIN IMMEDIATE` transactions for all financial operations.

### Layer 3: Atomic Design Enforcement
- **Constraint**: Pages CANNOT import atoms directly.
- **Constraint**: All UI must inherit from `Layout` (Flex, Stack, Grid).
- **Verification**: `npm run build` serves as a semantic check for type/hierarchy violations.

---
**Last Updated**: 2025-12-28
**Version**: 5.0.1
