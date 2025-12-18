# Sales Manager v2.0

Local-first PO-DC-Invoice Management System built with Next.js and FastAPI.

## Architecture

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python
- **Database**: SQLite (local file)
- **Design**: Google Stitch-style minimal UI

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── db.py                # Database connection
│   │   ├── models.py            # Pydantic models
│   │   ├── routers/             # API endpoints
│   │   │   ├── dashboard.py
│   │   │   ├── po.py
│   │   │   ├── dc.py
│   │   │   └── invoice.py
│   │   ├── services/            # Business logic
│   │   │   ├── po_scraper.py    # HTML PO parser
│   │   │   └── ingest_po.py     # PO ingestion service
│   │   └── utils/               # Utilities
│   ├── database/
│   │   └── business.db          # SQLite database
│   └── requirements.txt
│
├── frontend/
│   ├── app/                     # Next.js pages
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Dashboard
│   │   ├── po/                  # Purchase Orders
│   │   ├── dc/                  # Delivery Challans
│   │   └── invoice/             # Invoices
│   ├── components/              # React components
│   │   ├── NavRail.tsx
│   │   └── KpiCard.tsx
│   └── lib/
│       └── api.ts               # API client
│
└── migrations/
    └── v1_initial.sql           # Database schema
```

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend will run on `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`

Create a `.env.local` file in the frontend directory:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Features

### Current Implementation

- **Dashboard**: KPIs and recent activity feed
- **Purchase Orders**: 
  - List all POs
  - Upload HTML PO files (auto-parsed)
  - View PO details with items
- **Delivery Challans**: List view
- **Invoices**: List view

### Data Flow

1. Upload PO HTML file via frontend
2. Backend parses HTML using existing scraper logic
3. Data is normalized and stored in SQLite
4. Frontend displays data via REST APIs

## API Endpoints

- `GET /api/dashboard/summary` - Dashboard KPIs
- `GET /api/activity` - Recent activity
- `GET /api/po/` - List all POs
- `GET /api/po/{po_number}` - PO detail
- `POST /api/po/upload` - Upload PO HTML
- `GET /api/dc/` - List all DCs
- `GET /api/invoice/` - List all invoices

## Design Principles

- **Local-first**: Runs entirely on localhost
- **Business-key driven**: PO number, DC number, Invoice number as primary keys
- **Flexible linking**: Entities can be linked but not enforced
- **SQL clarity**: Direct SQL queries, no ORM magic
- **Preserved logic**: All existing scraping/ingestion logic retained

## Next Steps

See `task.md` for planned enhancements including:
- Smart global search
- Quantity reconciliation
- Linking assistance
- Alert system
- Enhanced reports
