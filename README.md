# SenstoSales ERP - Supplier Management System

**Version**: 3.1.0  
**Status**: Production Ready  
**Last Updated**: December 25, 2025

## Overview

SenstoSales is an internal supplier-side ERP system designed for Senstographic Solutions to manage the complete lifecycle of business operations with BHEL (Bharat Heavy Electricals Limited) as the primary buyer. The system handles Purchase Orders, Delivery Challans, Sales Invoices, and Store Receipt Vouchers (SRVs) with full reconciliation capabilities.

## 📚 Documentation

- **[DESIGN_GUIDE.md](./DESIGN_GUIDE.md)** - **READ THIS FIRST** when building new features. Contains all global design conventions, component patterns, and best practices.
- **[API_REFERENCE.md](./docs/API_REFERENCE.md)** - Complete list of all backend endpoints with request/response schemas
- **[DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** - Detailed database structure and relationships

## Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**  
- **SQLite 3**

### Installation

```bash
# Clone repository
git clone [repository-url]
cd SenstoSales

# Backend setup
cd backend
pip install -r requirements.txt

# Frontend setup
cd../frontend
npm install
```

### Running the Application

```bash
# Terminal 1: Backend (from project root)
python backend/entry_point.py

# Terminal 2: Frontend (from frontend directory)
cd frontend
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.10 (App Router, TypeScript)
- **Styling**: Tailwind CSS 3.x (Global Glassmorphism Design System)
- **Icons**: Lucide React
- **State**: React Hooks

### Backend
- **Framework**: FastAPI 0.115.x (Python 3.10+)
- **Database**: SQLite 3 (WAL mode)
- **Data Validation**: Pydantic v2
- **Excel Export**: XlsxWriter, Pandas

## Project Structure

```
SenstoSales/
├── DESIGN_GUIDE.md         ← START HERE for new features
├── frontend/
│   ├── app/                # Next.js pages
│   │   ├── globals.css     # Global design system
│   │   ├── po/            # Purchase Orders
│   │   ├── dc/            # Delivery Challans
│   │   ├── invoice/       # Sales Invoices
│   │   └── srv/           # SRV Receipts
│   ├── components/
│   │   ├── ui/            # Core reusable components
│   │   └── NavRail.tsx    # Sidebar navigation
│   └── lib/
│       ├── api.ts         # API client
│       └── utils.ts       # Utilities
│
├── backend/
│   ├── app/
│   │   ├── entry_point.py # Application entry
│   │   ├── db.py          # Database manager
│   │   ├── models.py      # Pydantic models
│   │   ├── routers/       # API endpoints
│   │   └── services/      # Business logic
│   └── tests/             # Test files
│
├── db/
│   └── business.db        # Production database
│
└── migrations/            # Database migrations
    └── *.sql
```

## Core Features

### Purchase Order Management
- Batch HTML upload with animated progress tracking
- View and modify PO details
- Download to Excel
- Real-time fulfillment tracking

### Delivery Challan System
- Create DCs from PO lot schedules
- Automatic DC number generation (or manual entry)
- FY-wise duplicate prevention
- Excel export with BHEL-compliant format

### Sales Invoice Generation
- Link multiple DCs to invoices
- Automatic tax calculations (CGST/SGST/IGST)
- Manual or auto-generated invoice numbers
- Excel export for accounting

### SRV Receipt Matching
- Orphaned SRV support (POs not in system)
- HTML batch upload
- Automatic matching to PO items
- Reconciliation views

## Design System

**All new features MUST follow the global design conventions defined in [DESIGN_GUIDE.md](./DESIGN_GUIDE.md).**

### Key Principles
- **Glassmorphism**: Subtle frosted-glass effects throughout
- **Typography**: Uppercase labels (10px bold), consistent font weights
- **Colors**: Blue/Indigo primary, Emerald success, Red danger
- **Components**: Reusable `GlassCard`, `Tabs`, `DenseTable`, `btn-premium`
- **Animations**: Subtle entry animations, smooth transitions

### Example Feature Implementation

```tsx
// See DESIGN_GUIDE.md Section 11 for full template
<div className="space-y-8 p-6">
  <div className="flex items-center justify-between">
    <h1 className="heading-xl">Feature Title</h1>
    <button className="btn-premium btn-primary">
      <Icon className="w-4 h-4" /> Action
    </button>
  </div>
  
  <GlassCard className="p-6">
    {/* Content */}
  </GlassCard>
</div>
```

## Database Schema

### Core Tables
- `purchase_orders` - PO headers from BHEL
- `purchase_order_items` - Line items with material codes  
- `delivery_challans` - Outbound DC headers
- `gst_invoices` - Sales invoice headers
- `srvs` - Store receipt vouchers

### Key Constraints
- DC cannot be edited/deleted if linked to invoice
- Invoice numbers must be unique per FY
- Dispatch quantity ≤ Remaining lot quantity
- All calculations done on backend (source of truth)

## API Endpoints

```
GET  /api/po                    # List all POs
GET  /api/po/{po_number}        # PO detail
POST /api/po/upload/batch       # Batch upload POs

GET  /api/dc                    # List DCs
POST /api/dc                    # Create DC
GET  /api/dc/{dc_number}/download

GET  /api/invoice               # List invoices
POST /api/invoice               # Create invoice
GET  /api/invoice/{id}/download

POST /api/srv/upload/batch      # Batch upload SRVs
GET  /api/reports/reconciliation
```

## Deployment

### Production Build

```bash
# Backend
cd backend
pip install -r requirements.txt --no-dev
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Frontend
cd frontend
npm run build
npm run start
```

### Database Backups

```bash
python backend/scripts/backup_database.py
```

## Recent Updates (v3.1.0)

### Bug Fixes (Dec 25, 2025)
- ✓ Fixed Total Items column data loading (required server restart)
- ✓ Repositioned Items column before Ord column
- ✓ Fixed sidebar flickering with transparent borders
- ✓ Verified manual DC/Invoice number input with FY-wise duplicate checking
- ✓ Restored batch upload animation with visible progress
- ✓ Fixed Stop button to immediately cancel uploads

### Design Updates (v3.0.0)
- Implemented global glassmorphism design system
- Standardized typography and spacing
- Unified tab and button styles
- Enhanced form layouts across all pages

## Contributing

**Before creating new features:**
1. Read [DESIGN_GUIDE.md](./DESIGN_GUIDE.md) thoroughly
2. Use existing components from `components/ui/`
3. Follow global CSS classes in `app/globals.css`
4. Match existing page patterns
5. Test all CRUD operations

## License

Internal use only - Senstographic Solutions Pvt. Ltd.

---

**Maintained by**: [Development Team]  
**Last Updated**: December 25, 2025  
**Next Review**: January 25, 2026
