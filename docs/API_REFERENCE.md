# API Reference Documentation

**Version**: 1.0.0  
**Base URL**: `http://localhost:8000`  
**Format**: JSON  
**Last Updated**: December 24, 2025

---

## Authentication

Currently, this is an internal system with no authentication layer. All endpoints are publicly accessible on the local network.

> [!NOTE]
> For production deployment, consider adding API key authentication or JWT tokens.

---

## Endpoints

### Dashboard

#### GET `/api/dashboard/summary`

Returns KPI metrics for the dashboard view.

**Response** `200 OK`:
```json
{
  "total_sales_month": 1250000.00,
  "sales_growth": 15.2,
  "pending_pos": 3,
  "new_pos_today": 1,
  "active_challans": 5,
  "active_challans_growth": "Stable",
  "total_po_value": 5000000.00,
  "po_value_growth": 8.5,
  "total_ordered": 1000.0,
  "total_delivered": 750.0,
  "total_received": 700.0
}
```

#### GET `/api/dashboard/activity`

Returns recent activity items (last 20 transactions).

**Response** `200 OK`:
```json
[
  {
    "type": "PO",
    "number": "6664062",
    "date": "2024-12-15",
    "description": "Purchase Order created",
    "created_at": "2024-12-15T10:30:00"
  }
]
```

---

### Purchase Orders

#### GET `/api/po`

List all purchase orders with summary information.

**Query Parameters**:
- `skip` (optional): Pagination offset (default: 0)
- `limit` (optional): Results per page (default: 100)

**Response** `200 OK`:
```json
[
  {
    "po_number": 6664062,
    "po_date": "2024-10-15",
    "supplier_name": "SENSTOGRAPHIC SOLUTIONS PVT. LTD.",
    "po_value": 125000.00,
    "amend_no": 0,
    "po_status": "Active",
    "linked_dc_numbers": "DC-001,DC-002",
    "total_ordered_quantity": 100.0,
    "total_dispatched_quantity": 75.0,
    "total_pending_quantity": 25.0,
    "created_at": "2024-10-15T08:00:00"
  }
]
```

#### GET `/api/po/{po_number}`

Get detailed information for a specific PO including items and delivery schedule.

**Path Parameters**:
- `po_number` (required): PO number

**Response** `200 OK`:
```json
{
  "header": {
    "po_number": 6664062,
    "po_date": "2024-10-15",
    "supplier_name": "SENSTOGRAPHIC SOLUTIONS PVT. LTD.",
    "supplier_gstin": "07AAKCS0413P1ZI",
    "po_value": 125000.00
  },
  "items": [
    {
      "id": "uuid-here",
      "po_item_no": 10,
      "material_code": "M12345",
      "material_description": "Steel Component",
      "unit": "NO",
      "po_rate": 1250.00,
      "ordered_quantity": 100.0,
      "received_quantity": 75.0,
      "rejected_quantity": 5.0,
      "pending_quantity": 25.0,
      "deliveries": [
        {
          "lot_no": 1,
          "delivered_quantity": 50.0,
          "dely_date": "2024-11-15"
        }
      ]
    }
  ]
}
```

**Response** `404 Not Found`:
```json
{
  "detail": "PO 1234567 not found"
}
```

#### POST `/api/po/upload`

Upload a single PO HTML file for parsing and ingestion.

**Request** (multipart/form-data):
- `file`: HTML file from BHEL system
- `po_number` (optional): Override PO number

**Response** `200 OK`:
```json
{
  "success": true,
  "po_number": 6664062,
  "items_count": 15,
  "message": "PO uploaded successfully"
}
```

**Response** `400 Bad Request`:
```json
{
  "detail": "Invalid HTML format"
}
```

#### POST `/api/po/upload/batch`

Upload multiple PO HTML files in batch.

**Request** (multipart/form-data):
- `files[]`: Array of HTML files

**Response** `200 OK`:
```json
{
  "total": 5,
  "successful": 4,
  "failed": 1,
  "results": [
    {
      "filename": "PO_6664062.html",
      "success": true,
      "po_number": 6664062
    }
  ]
}
```

---

### Delivery Challans

#### GET `/api/dc`

List all delivery challans.

**Query Parameters**:
- `po` (optional): Filter by PO number

**Response** `200 OK`:
```json
[
  {
    "dc_number": "6664062-DC-01",
    "dc_date": "2024-11-20",
    "po_number": 6664062,
    "consignee_name": "BHEL Haridwar",
    "status": "Delivered",
    "total_value": 62500.00,
    "created_at": "2024-11-20T09:00:00"
  }
]
```

#### POST `/api/dc`

Create a new delivery challan.

**Request Body**:
```json
{
  "dc_number": "6664062-DC-03",
  "dc_date": "2024-12-01",
  "po_number": 6664062,
  "consignee_name": "BHEL Haridwar",
  "vehicle_no": "HR12AB1234",
  "lr_no": "LR123456",
  "items": [
    {
      "po_item_id": "uuid-of-po-item",
      "lot_no": 1,
      "dispatch_qty": 25.0,
      "hsn_code": "7326",
      "hsn_rate": 18.0
    }
  ]
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "dc_number": "6664062-DC-03"
}
```

**Response** `400 Bad Request` (Business Rule Violation):
```json
{
  "message": "Cannot dispatch 30. Only 25 remaining for Lot 1",
  "error_code": "BUSINESS_RULE_VIOLATION",
  "details": {
    "invariant": "DC-1",
    "lot_ordered": 50.0,
    "already_dispatched": 25.0,
    "remaining": 25.0
  }
}
```

#### PUT `/api/dc/{dc_number}`

Update an existing delivery challan.

**Response** `409 Conflict`:
```json
{
  "message": "Cannot edit DC DC-001 - already linked to invoice INV/24-25/001",
  "error_code": "CONFLICT",
  "details": {
    "invariant": "DC-2"
  }
}
```

#### DELETE `/api/dc/{dc_number}`

Delete a delivery challan (blocked if invoiced).

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "DC DC-001 deleted"
}
```

---

### Sales Invoices

#### GET `/api/invoice`

List all GST invoices.

**Response** `200 OK`:
```json
[
  {
    "invoice_number": "INV/24-25/001",
    "invoice_date": "2024-12-01",
    "po_numbers": "6664062",
    "linked_dc_numbers": "DC-001,DC-002",
    "taxable_value": 100000.00,
    "total_invoice_value": 118000.00,
    "created_at": "2024-12-01T10:00:00"
  }
]
```

#### POST `/api/invoice`

Create a new invoice from a delivery challan.

**Request Body**:
```json
{
  "invoice_number": "INV/24-25/003",
  "invoice_date": "2024-12-15",
  "dc_number": "DC-003",
  "buyer_name": "BHEL Haridwar",
  "buyer_gstin": "05AAACB1234M1Z5",
  "place_of_supply": "Uttarakhand"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "invoice_number": "INV/24-25/003",
  "total_amount": 59000.00,
  "items_count": 2
}
```

**Response** `409 Conflict`:
```json
{
  "message": "DC DC-001 is already linked to invoice INV/24-25/001",
  "error_code": "CONFLICT",
  "details": {
    "invariant": "DC-2"
  }
}
```

---

### SRV (Store Receipt Vouchers)

#### GET `/api/srv`

List all SRV receipts.

**Query Parameters**:
- `po` (optional): Filter by PO number

**Response** `200 OK`:
```json
[
  {
    "srv_number": "SRV-001",
    "srv_date": "2024-11-25",
    "po_number": "6664062",
    "total_received_qty": 45.0,
    "total_rejected_qty": 5.0,
    "po_found": true,
    "created_at": "2024-11-25T14:00:00"
  }
]
```

#### GET `/api/srv/{srv_number}`

Get detailed SRV information.

**Response** `200 OK`:
```json
{
  "header": {
    "srv_number": "SRV-001",
    "srv_date": "2024-11-25",
    "po_number": "6664062"
  },
  "items": [
    {
      "po_item_no": 10,
      "lot_no": 1,
      "received_qty": 45.0,
      "rejected_qty": 5.0,
      "challan_no": "DC-001",
      "cnote_no": "CN123",
      "div_code": "DIV-A"
    }
  ]
}
```

#### POST `/api/srv/upload/batch`

Upload one or more SRV HTML files.

**Request** (multipart/form-data):
- `files[]`: Array of SRV HTML files

**Response** `200 OK`:
```json
{
  "total": 3,
  "successful": 3,
  "failed": 0,
  "results": [
    {
      "filename": "SRV_6664062.html",
      "success": true,
      "srv_number": "SRV-001",
      "message": "SRV uploaded successfully"
    }
  ]
}
```

> [!NOTE]
> SRV upload works even if the referenced PO doesn't exist yet (orphaned SRVs allowed per Invariant SRV-1).

#### DELETE `/api/srv/{srv_number}`

Hard delete an SRV and rollback associated quantities.

**Response** `200 OK`:
```json
{
  "message": "SRV SRV-001 deleted and quantities rolled back"
}
```

---

### Reports

#### GET `/api/reports/reconciliation`

PO fulfillment reconciliation report.

**Response** `200 OK`:
```json
[
  {
    "po_number": 6664062,
    "po_item_no": 10,
    "material_code": "M12345",
    "ordered": 100.0,
    "delivered": 75.0,
    "received": 70.0,
    "accepted": 65.0,
    "rejected": 5.0,
    "pending": 25.0
  }
]
```

#### GET `/api/reports/sales`

Monthly sales summary.

**Query Parameters**:
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD

**Response** `200 OK`:
```json
[
  {
    "month": "2024-11",
    "taxable_value": 500000.00,
    "total_value": 590000.00
  }
]
```

#### GET `/api/reports/register/dc`

DC register (all DCs listed).

**Response** `200 OK`:
```json
[
  {
    "dc_number": "DC-001",
    "dc_date": "2024-11-20",
    "po_number": 6664062,
    "total_value": 62500.00
  }
]
```

#### GET `/api/reports/pending`

Pending items (PO items not yet fully dispatched).

**Response** `200 OK`:
```json
[
  {
    "po_number": 6664062,
    "po_item_no": 10,
    "material_description": "Steel Component",
    "ordered": 100.0,
    "delivered": 75.0,
    "pending": 25.0
  }
]
```

---

## Error Response Format

All errors follow this structure:

```json
{
  "detail": "Error message" // Simple errors
}
```

Or for domain errors:

```json
{
  "message": "User-friendly error message",
  "error_code": "ERROR_CODE_ENUM",
  "details": {
    "field": "value",
    "invariant": "DC-1"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource doesn't exist |
| `CONFLICT` | 409 | Business rule conflict (e.g., duplicate) |
| `BUSINESS_RULE_VIOLATION` | 400 | Invariant violated |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

Currently no rate limiting is implemented. For production:
- Recommended: 100 requests/minute per IP
- Burst: 200 requests

---

## Changelog

### Version 1.0.0 (2024-12-24)
- Initial API documentation
- 52 endpoints documented
- All error codes documented

---

**Contact**: Development Team  
**Support**: Internal Wiki
