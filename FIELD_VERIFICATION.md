# PO Field Verification Matrix

**Last Updated:** 2025-12-18  
**Purpose:** Complete reference for PO data extraction, storage, and usage

## Overview

This document maps all fields from Purchase Order documents through the system:
- **Scraper Extraction** (`po_scraper.py`)
- **Database Storage** (schema in `migrations/v1_initial.sql`)
- **Ingestion Mapping** (`ingest_po.py`)

## Header Fields (30 fields from PO)

| # | Field Name | Scraper Key | DB Column | Status | Notes |
|---|------------|-------------|-----------|--------|-------|
| 1 | PURCHASE ORDER | `PURCHASE ORDER` | `po_number` | ✅ OK | Primary key |
| 2 | PO DATE | `PO DATE` | `po_date` | ✅ OK | Date normalized |
| 3 | SUPP NAME M/S | `SUPP NAME M/S` | `supplier_name` | ✅ OK | Buyer name (BHEL, etc.) |
| 4 | SUPP CODE | `SUPP CODE` | `supplier_code` | ✅ OK | Buyer code |
| 5 | PHONE | `PHONE` | `supplier_phone` | ✅ OK | Buyer phone |
| 6 | FAX | `FAX` | `supplier_fax` | ✅ OK | Buyer fax |
| 7 | EMAIL | `EMAIL` | `supplier_email` | ✅ OK | Buyer email |
| 8 | WEBSITE | `WEBSITE` | - | ✅ OK | Fallback for email |
| 9 | DVN | `DVN` | `department_no` | ✅ OK | Department/Division |
| 10 | ENQUIRY | `ENQUIRY` | `enquiry_no` | ✅ OK | Enquiry reference |
| 11 | ENQ DATE | `ENQ DATE` | `enquiry_date` | ✅ OK | Date normalized |
| 12 | QUOTATION | `QUOTATION` | `quotation_ref` | ✅ OK | Quotation reference |
| 13 | QUOT-DATE | `QUOT-DATE` | `quotation_date` | ✅ OK | Date normalized |
| 14 | RC NO | `RC NO` | `rc_no` | ✅ OK | RC number |
| 15 | ORD-TYPE | `ORD-TYPE` | `order_type` | ✅ OK | Order type |
| 16 | PO STATUS | `PO STATUS` | `po_status` | ✅ OK | PO status |
| 17 | TIN NO | `TIN NO` | `tin_no` | ✅ OK | Fixed: was 'TIN NO.' |
| 18 | ECC NO | `ECC NO` | `ecc_no` | ✅ OK | Fixed: was 'ECC NO.' |
| 19 | MPCT NO | `MPCT NO` | `mpct_no` | ✅ OK | Fixed: was 'MPCT NO.' |
| 20 | PO-VALUE | `PO-VALUE` | `po_value` | ✅ OK | Numeric |
| 21 | FOB VALUE | `FOB VALUE` | `fob_value` | ✅ OK | Numeric |
| 22 | EX RATE | `EX RATE` | `ex_rate` | ✅ OK | Numeric |
| 23 | CURRENCY | `CURRENCY` | `currency` | ✅ OK | Currency code |
| 24 | NET PO VAL | `NET PO VAL` | `net_po_value` | ✅ OK | Numeric |
| 25 | AMEND NO | `AMEND NO` | `amend_no` | ✅ OK | Amendment number |
| 26 | INSPECTION BY | `INSPECTION BY` | `inspection_by` | ✅ OK | e.g., "BHEL" |
| 27 | NAME | `NAME` | `issuer_name` | ✅ OK | Issuer name |
| 28 | DESIGNATION | `DESIGNATION` | `issuer_designation` | ✅ OK | Issuer designation |
| 29 | PHONE NO | `PHONE NO` | `issuer_phone` | ✅ OK | Issuer phone |
| 30 | REMARKS | `REMARKS` | `remarks` | ✅ OK | PO remarks |

## Item Fields (10 fields from PO)

| # | Field Name | Scraper Key | DB Column | Status | Notes |
|---|------------|-------------|-----------|--------|-------|
| 1 | PO ITM | `PO ITM` | `po_item_no` | ✅ OK | Item number |
| 2 | MATERIAL CODE | `MATERIAL CODE` | `material_code` | ✅ OK | Material code |
| 3 | DESCRIPTION | `DESCRIPTION` | `material_description` | ✅ OK | Merged cell extraction |
| 4 | DRG | `DRG` | `drg_no` | ✅ OK | Drawing number |
| 5 | MTRL CAT | `MTRL CAT` | `mtrl_cat` | ✅ OK | Material category |
| 6 | UNIT | `UNIT` | `unit` | ✅ OK | Unit of measure |
| 7 | PO RATE | `PO RATE` | `po_rate` | ✅ OK | Numeric |
| 8 | ORD QTY | `ORD QTY` | `ord_qty` | ✅ OK | Numeric |
| 9 | RCD QTY | `RCD QTY` | `rcd_qty` | ✅ OK | Numeric |
| 10 | ITEM VALUE | `ITEM VALUE` | `item_value` | ✅ OK | Numeric |

## Delivery Schedule Fields (5 fields from PO)

| # | Field Name | Scraper Key | DB Column | Status | Notes |
|---|------------|-------------|-----------|--------|-------|
| 1 | LOT NO | `LOT NO` | `lot_no` | ✅ OK | Lot number |
| 2 | DELY QTY | `DELY QTY` | `dely_qty` | ✅ OK | Numeric |
| 3 | DELY DATE | `DELY DATE` | `dely_date` | ✅ OK | Date normalized |
| 4 | ENTRY ALLOW DATE | `ENTRY ALLOW DATE` | `entry_allow_date` | ✅ OK | Date normalized |
| 5 | DEST CODE | `DEST CODE` | `dest_code` | ✅ OK | Destination code |

## Internal Fields (Not in PO - Added Manually)

| Field | DB Column | Purpose | When Added |
|-------|-----------|---------|------------|
| SUPPLIER GSTIN | `supplier_gstin` | Your company's GSTIN | DC/GST Invoice generation |
| HSN CODE | `hsn_code` | HSN classification | DC/GST Invoice generation |

## Summary

**Total Fields Extracted from PO:** 45
- Header: 30 fields
- Items: 10 fields  
- Delivery: 5 fields

**Internal Fields (Manual Entry):** 2
- SUPPLIER GSTIN
- HSN CODE

## Corrections Made

1. ✅ **TIN NO, ECC NO, MPCT NO** - Fixed field name mismatch (removed periods)
2. ❌ **AMEND 1 DATE, AMEND 2 DATE** - Removed (not in PO documents)
3. ❌ **INSPECTION AT BHEL** - Removed (it's a value, not a field)
4. ❌ **SUPPLIER GSTIN** - Removed from extraction (internal data)
5. ✅ **DESCRIPTION** - Merged cell extraction working
6. ✅ **DRG** - PO-level field added to all items

## Usage in DC and GST Invoice

When generating Delivery Challans and GST Invoices:
- All PO fields are available from database
- SUPPLIER GSTIN and HSN CODE will be added from your master data
- Item descriptions and DRG numbers will appear correctly
