# SenstoSales ERP - Supplier Management System

**Version**: 5.0.0 (Atomic Design & Architecture Refactor)
**Status**: Production Ready
**Last Updated**: December 26, 2025

## Overview

SenstoSales is an internal supplier-side ERP system designed for Senstographic Solutions to manage business operations with BHEL (Bharat Heavy Electricals Limited) and other PSUs. It handles the complete lifecycle of Purchase Orders (PO), Delivery Challans (DC), Sales Invoices, and Store Receipt Vouchers (SRV).

## 📚 Documentation

Detailed documentation is available in the `docs/` folder:

*   **[DESIGN_SYSTEM_CONSOLIDATED.md](./docs/DESIGN_SYSTEM_CONSOLIDATED.md)** - **START HERE**. UI/UX standards, component library, and typography (v5.0).
*   **[FRONTEND_ARCHITECTURE.md](./docs/FRONTEND_ARCHITECTURE.md)** - Frontend structure (Atomic Design), State Management, and Performance patterns.
*   **[DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** - Detailed ERD, table definitions, and relationships.
*   **[DATA_PIPELINE.md](./docs/DATA_PIPELINE.md)** - Logic for PO ingestion, HTML scraping, and business rules.
*   **[DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)** - Production setup, server configuration, and maintenance.
*   **[API_REFERENCE.md](./docs/API_REFERENCE.md)** - Backend API endpoints.
*   **[SYSTEM_INVARIANTS.md](./docs/SYSTEM_INVARIANTS.md)** - Immutable business rules and enforcement layers.

## Technology Stack

*   **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
*   **Backend**: FastAPI, Python 3.10+, SQLAlchemy (Async), SQLite/PostgreSQL
*   **Tools**: Lucide React, Pydantic v2, BeautifulSoup4 (Scraper)

## Quick Start

### 1. Installation

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 2. Running Localy

```bash
# Terminal 1: Backend
cd backend
python entry_point.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

*   **Frontend**: http://localhost:3000
*   **Backend API**: http://localhost:8000/docs

## Feature Highlights

*   **Atomic Design**: Modular, reusable UI components (`docs/FRONTEND_ARCHITECTURE.md`).
*   **Performance**: Lazy loading, parallel fetching, optimistic UI updates.
*   **PO Automation**: Batch upload HTML POs with extraction pipeline (`docs/DATA_PIPELINE.md`).
*   **Automated Reconciliation**: Link DCs to Invoices and match SRVs automatically.
*   **Real-time Dashboard**: Live status tracking and KPI cards.

## Contributing

Please review our [DESIGN_SYSTEM_CONSOLIDATED.md](./docs/DESIGN_SYSTEM_CONSOLIDATED.md) before submitting PRs. We follow a strict standard for UI consistency and code quality.

## License

Internal use only - Senstographic Solutions Pvt. Ltd.
