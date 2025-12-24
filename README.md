# SenstoSales ERP - Supplier Management System

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: December 24, 2025

## Overview

Sens toSales is an internal supplier-side ERP system designed for Senstographic Solutions to manage the complete lifecycle of business operations with BHEL (Bharat Heavy Electricals Limited) as the primary buyer. The system handles Purchase Orders, Delivery Challans, Sales Invoices, and Store Receipt Vouchers (SRVs) with full reconciliation capabilities.

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                        │
│  ┌────────────┬────────────┬────────────┬──────────────┐    │
│  │ Dashboard  │ PO Manager │ DC Manager │ Invoice Mgr  │    │
│  │            │            │            │              │    │
│  └────────────┴────────────┴────────────┴──────────────┘    │
│  ┌────────────────────────────────────────────────────┐     │
│  │   SRV Receipts   │   Reports   │   Reconciliation  │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
                              ▼  HTTP/JSON
┌──────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI + SQLite)                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │   API Layer (12 Routers, 52 Endpoints)                  │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │   Business Logic Layer (Service Layer Pattern)         │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │   Data Access Layer (SQLite + SQLAlchemy Core)         │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              ▼
                     ┌────────────────┐
                     │  business.db   │
                     │   (WAL mode)   │
                     └────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.10 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **UI Components**: Custom glassmorphism design system
- **State Management**: React hooks
- **HTTP Client**: Native fetch API

### Backend
- **Framework**: FastAPI 0.115.x
- **Language**: Python 3.10+
- **Database**: SQLite 3 (with WAL mode)
- **ORM**: SQLAlchemy Core (no full ORM)
- **Data Validation**: Pydantic v2
- **Excel Export**: XlsxWriter, Pandas
- **HTML Parsing**: BeautifulSoup4, lxml

### Quality Assurance
- **Backend Validation**: Pydantic schemas
- **Transaction Safety**: SQLite BEGIN IMMEDIATE
- **Error Handling**: Centralized exception handling
- **Logging**: Structured logging with rotation

## Project Structure

```
SenstoSales/
├── frontend/                   # Next.js application
│   ├── app/                    # App router pages
│   │   ├── page.tsx            # Dashboard
│   │   ├── po/                 # Purchase Orders
│   │   ├── dc/                 # Delivery Challans
│   │   ├── invoice/            # Sales Invoices
│   │   ├── srv/                # SRV Receipts
│   │   └── reports/            # Analytics & Reports
│   ├── components/             # Reusable UI components
│   │   ├── NavRail.tsx         # Sidebar navigation (memoized)
│   │   └── ui/                 # Base UI components
│   └── lib/                    # Utilities & helpers
│
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── main.py             # Application entry point
│   │   ├── db.py               # Database connection manager
│   │   ├── models.py           # Pydantic models (52 models)
│   │   ├── routers/            # API endpoints (12 routers, 52 routes)
│   │   ├── services/           # Business logic layer
│   │   ├── utils/              # Helper functions
│   │   └── core/               # Core configuration & exceptions
│   └── scripts/                # Maintenance & verification scripts
│
├── db/                         # Active production database
│   └── business.db             # SQLite database (WAL mode)
│
├── migrations/                 # Database schemas & migrations
│   ├── v1_initial.sql
│   ├── 002-012_*.sql
│   └── add_constraints.sql
│
├── archive/                    # Legacy code & deprecated files
│   └── [deprecated items]
│
└── docs/                       # Documentation
    └── [generated docs]
```

## Database Schema

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `purchase_orders` | PO headers from BHEL | `po_number` (PK), `po_date`, `supplier_name`, `po_value` |
| `purchase_order_items` | PO line items | `id` (UUID PK), `po_number` (FK), `material_code`, `ord_qty` |
| `purchase_order_deliveries` | Lot-wise delivery schedule | `po_item_id` (FK), `lot_no`, `dely_qty` |
| `delivery_challans` | Outbound DC headers | `dc_number` (PK), `dc_date`, `po_number` (FK) |
| `delivery_challan_items` | DC line items | `dc_number` (FK), `po_item_id` (FK), `dispatch_qty` |
| `gst_invoices` | Sales invoice headers | `invoice_number` (PK), `invoice_date`, `total_invoice_value` |
| `gst_invoice_items` | Invoice line items | `invoice_number` (FK), `taxable_value`, `cgst_amount` |
| `gst_invoice_dc_links` | DC-Invoice relationships | `invoice_number` (FK), `dc_number` (FK) |
| `srvs` | Store receipt voucher headers | `srv_number` (PK), `srv_date`, `po_number`, `po_found` |
| `srv_items` | SRV line items | `srv_number` (FK), `received_qty`, `rejected_qty` |

### Views

| View | Purpose |
|------|---------|
| `reconciliation_ledger` | Real-time PO fulfillment status (ordered vs. delivered vs. received) |

### Indexes

```sql
CREATE INDEX idx_poi_po_number ON purchase_order_items(po_number);
CREATE INDEX idx_dci_po_item ON delivery_challan_items(po_item_id);
CREATE INDEX idx_srv_po ON srvs(po_number);
CREATE INDEX idx_srv_items_po ON srv_items(po_number, po_item_no);
```

## Core Business Rules & Invariants

### Document Lifecycle

```
PO (Upload) → DC (Create) → Invoice (Generate) → SRV (Upload/Match)
     ↓            ↓              ↓                    ↓
 PO Items    Dispatch Qty   Invoice Items      Received/Rejected Qty
```

### Invariants

1. **DC-1**: Dispatch quantity ≤ Remaining lot quantity
2. **DC-2**: DC cannot be edited/deleted if linked to an invoice
3. **INV-1**: Invoice numbers must be globally unique (format: `INV/FY-YY/XXX`)
4. **INV-2**: Backend is the source of truth for all monetary calculations
5. **INV-4**: Invoice must reference at least one valid DC
6. **SRV-1**: SRV upload is allowed even if PO is not in system (orphaned SRVs)
7. **Global-PO-Limit**: Total dispatched ≤ Total ordered (across all DCs)

### Number Generation Strategy

All document numbers use **collision-safe MAX+1 logic**:

```python
# CORRECT (Used in Production)
SELECT ... ORDER BY number DESC LIMIT 1  # Get last number
new_number = last_number + 1

# INCORRECT (NOT USED)
SELECT COUNT(*) FROM table  # Race condition risk
```

## API Endpoints

### Dashboard & Analytics
- `GET /api/dashboard/summary` - KPI metrics
- `GET /api/dashboard/activity` - Recent transactions
- `GET /api/reports/reconciliation` - PO fulfillment report
- `GET /api/reports/kpis` - System-wide KPIs

### Purchase Orders
- `GET /api/po` - List all POs
- `GET /api/po/{po_number}` - PO detail
- `POST /api/po/upload` - Upload PO HTML
- `POST /api/po/upload/batch` - Batch PO upload

### Delivery Challans
- `GET /api/dc` - List all DCs
- `POST /api/dc` - Create DC
- `PUT /api/dc/{dc_number}` - Update DC (blocked if invoiced)
- `DELETE /api/dc/{dc_number}` - Delete DC (blocked if invoiced)
- `GET /api/dc/{dc_number}/download` - Export to Excel

### Sales Invoices
- `GET /api/invoice` - List all invoices
- `POST /api/invoice` - Create invoice from DC
- `GET /api/invoice/{invoice_number}/download` - Export to Excel

### SRV Receipts
- `GET /api/srv` - List all SRVs
- `POST /api/srv/upload/batch` - Upload SRV HTML files
- `DELETE /api/srv/{srv_number}` - Hard delete SRV (rollback quantities)

## SenstoSales ERP

**Version 2.1.0** | *Last Updated: 2025-12-24*

A local-first ERP system for managing Purchase Orders, Delivery Challans, Invoices, and Service Receipt Vouchers (SRVs) for BHEL supplier operations.

## Recent Fixes (v2.1.0)

### Critical Bug Fixes
- **PO Date Scraper**: Fixed regex pattern to match exactly "PO DATE" (not any field ending with "DATE")
- **Reports Serialization**: Added `.fillna(0)` to handle NaN values in JSON responses
- **Database Migrations**: Created `reset_database.py` with correct migration dependency order
- **Upload Limit**: Increased multipart file upload limit from 1,000 to 10,000 files

### Improvements
- Streamlined database reset procedure
- Enhanced error handling in report endpoints
- Improved scraper accuracy for PO data extraction

## Quick Start

### Database Setup
```bash
# Reset database with all migrations (recommended for clean start)
python reset_database.py

# Or use the migration script
python backend/scripts/apply_migrations.py
```

### Running the Application
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --reload --port 8000
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### Environment Configuration

Create `.env` file in the root directory:

```bash
# Backend
DATABASE_URL=sqlite:///../db/business.db
BACKEND_CORS_ORIGINS=["http://localhost:3000"]

# Frontend (in frontend/.env.local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Production Deployment

### Backend Production Build

```bash
# Install production dependencies only
pip install -r requirements.txt --no-dev

# Run with production ASGI server (Uvicorn)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend Production Build

```bash
cd frontend
npm run build
npm run start  # Production server on port 3000
```

### Database Backups

```bash
# Manual backup
python backend/scripts/backup_database.py

# Automated backup (Windows Task Scheduler / Linux CRON)
# Daily at 2 AM:
0 2 * * * cd /path/to/SenstoSales && python backend/scripts/backup_database.py
```

## Maintenance Scripts

| Script | Purpose |
|--------|---------|
| `backend/scripts/verify_database.py` | Check schema integrity & row counts |
| `backend/scripts/verify_api_contract.py` | Validate frontend-backend API alignment |
| `backend/scripts/check_schema.py` | Detailed schema inspection |

## Testing

### Backend Testing

```bash
cd backend
pytest tests/ -v
```

### Frontend Testing

```bash
cd frontend
npm test
```

## Troubleshooting

### Database Connection Issues

**Problem**: Backend cannot connect to database  
**Solution**:
```bash
# Verify database exists
Test-Path db/business.db

# Check file permissions
icacls db/business.db

# Recreate if missing (CAUTION: DATA LOSS)
python backend/scripts/init_database.py
```

### API Fetch Errors (Frontend)

**Problem**: `Failed to fetch` or CORS errors  
**Solution**:
1. Verify backend is running: `http://localhost:8000/health`
2. Check CORS settings in `backend/app/core/config.py`
3. Ensure `NEXT_PUBLIC_API_BASE_URL` is set correctly

### SRV Upload Failures

**Problem**: SRV HTML parsing errors  
**Solution**:
1. Verify HTML structure matches expected format
2. Check `backend/app/services/srv_scraper.py` for field mappings
3. Enable debug logging in `backend/app/logging_config.py`

## Security Considerations

1. **Database Security**: SQLite file permissions should be `600` (owner read/write only)
2. **CORS**: Restrict `BACKEND_CORS_ORIGINS` to trusted domains in production
3. **Input Validation**: All user inputs are validated via Pydantic schemas
4. **SQL Injection**: Using parameterized queries throughout
5. **File Uploads**: HTML files are parsed, not executed

## Performance Optimization

- **Database**: WAL mode enabled for concurrent reads
- **Frontend**: Memoized navigation components (NavRail)
- **API**: Indexed foreign keys for joins
- **Caching**: Consider adding Redis for frequently accessed data (future enhancement)

## License

Internal use only - Senstographic Solutions Pvt. Ltd.

## Support & Contacts

**Development Team**: [Your Team Name]  
**Email**: [support@senstographic.com]  
**Internal Wiki**: [Link to internal documentation]

---

**Document Version**: 1.0  
**Generated**: 2025-12-24  
**Next Review**: 2026-01-24
