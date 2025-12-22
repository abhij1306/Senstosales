# SenstoSales - Purchase Order Management System

**Version**: 3.0.0 (Stable Release)  
**Status**: Production Ready - All Core Features Complete ✅  
**Last Updated**: 2025-12-20

## Overview

SenstoSales is a comprehensive Purchase Order management system designed for Senstographic (supplier) to manage purchase orders received from buyers (BHEL, NTPC, etc.). The system handles the complete lifecycle from PO ingestion to delivery challan and GST invoice generation, with advanced AI-powered features and hands-free voice interaction.

## Features

### ✅ Implemented (Version 3.0)

#### Core PO Management
- **Bulk PO Upload**: Upload multiple HTML PO files at once with batch processing
- **PO List**: View all POs with status badges, values, and amendments
- **PO Detail & Edit**: Complete view and edit of all 45 PO fields
  - 28 header fields organized in 4 tabs
  - Items table with 9 columns (including DRG)
  - Delivery schedules (expandable by default)
  - Add/Delete items and deliveries
  - Inline editing with proper validation
- **PO Notes Management**: Dedicated notes section with search and filtering

#### Delivery & Invoice Management
- **Delivery Challan Management**: Create and manage DCs with full item tracking
  - Lot-wise item tracking
  - **SRV Management**:
  - Batch upload buyer-generated SRV HTML files (BHEL/NTPC/etc).
  - Automated parsing of received and rejected quantities.
  - Integration with Purchase Orders to track delivery performance (Ordered vs Delivered vs Received vs Rejected).
  - Calculation of Rejection Rates per PO and global APIs.

- **Delivery Challans & Invoicing**:
  - Create Delivery Challans (DC) directly from POs with auto-populated items.
  - Generate GST Invoices linked to DCs with automatic tax calculation (CGST/SGST).
  - Validation to ensure `Received + Rejected <= Delivered`. and net amount computation

#### Smart Reports & Analytics
- **AI-Powered Reports**: Generate intelligent summaries using Groq LLM
  - Date-range based analysis
  - Natural language insights
  - Automated trend detection
- **Smart Reports Dashboard**: Interactive KPI cards with real-time data
  - Total PO Value, DC Count, Invoice Count
  - Pending Deliveries, Payment Status
  - Export capabilities
- **Reconciliation Reports**: Comprehensive PO-DC-Invoice reconciliation
  - Cross-reference validation
  - Oversell protection
  - Data integrity checks

#### Voice & AI Features
- **Hands-Free Voice Mode**: Continuous conversation loop with advanced capabilities
  - Voice Activity Detection (VAD) for automatic speech detection
  - Real-time interruptibility (stop AI mid-response)
  - Auto-silence detection (3-second threshold)
  - Groq Whisper STT integration
  - Mobile and web optimized
- **AI Summaries**: Context-aware business intelligence
  - PO analysis and insights
  - Delivery performance metrics
  - Financial summaries

#### UI/UX Excellence
- **Internal ERP Design**: Compact cards, clean typography, and dense data displays
- **Client-Side Pagination**: Efficient navigation for large lists (10 items/page)
- **Smart Navigation**: Cross-linking between POs, DCs, and Invoices
- **Global Search**: Quick access to any PO, DC, or Invoice
- **Command Bar**: Keyboard shortcuts for power users
- **Alerts Panel**: Real-time notifications and system alerts
- **Readiness Strip**: System health monitoring
- **Dashboard**: Real-time KPIs and recent activity tracking
- **Real-Time Statistics**: Zero-mock data policy; all KPIs reflect actual database state

### 🚧 Planned (Phase 3+)
- Advanced reporting and analytics
- Payment tracking and reconciliation
- Multi-user support with authentication

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL/SQLite
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Scraper**: BeautifulSoup4

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd SenstoSales
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Project Structure

```
SenstoSales/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── routers/
│   │   └── services/
│   └── database/
├── frontend/         # Next.js frontend
│   ├── app/
│   │   ├── page.tsx
│   │   └── po/
│   └── components/
├── scraper/          # Standalone scraper
├── migrations/       # SQL migrations
├── tests/            # Test files (gitignored)
├── utils/            # Utility scripts
└── CONTEXT.md        # Complete project documentation
```

## Documentation

- **[CONTEXT.md](./CONTEXT.md)** - Complete project intelligence, architecture, and guidelines
- **[API Docs](http://localhost:8000/docs)** - Interactive API documentation (when backend is running)

## Database Schema

### Core Tables
- `purchase_orders` - 30 header fields
- `po_items` - 10 fields per item (including DRG)
- `po_deliveries` - 5 fields per delivery

See [CONTEXT.md](./CONTEXT.md) for complete schema details.

## Usage

### Upload POs
1. Navigate to `/po`
2. Click "Select PO Files"
3. Choose one or more HTML PO files
4. Click "Upload"
5. View results and check PO list

### View/Edit PO
1. Click on PO number in the list
2. View all details in organized tabs
3. Click "Edit" to enable editing
4. Modify fields, add/remove items/deliveries
5. Click "Save" (coming soon)

### Hands-Free Voice Mode
> **Note**: Requires Microphone Access.

- **Safari/Mobile**: Requires a manual tap to start (User Gesture) to initialize Audio Context.
- **Chrome**: May suspend Audio Context if the tab is backgrounded.
- **Controls**:
  - Tap Mic to Start.
  - Speak naturally (VAD detects silence).
  - Tap "Stop" anytime to force end the session.


## Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Style
- Backend: PEP 8, type hints
- Frontend: TypeScript strict mode, ESLint

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - Senstographic Internal Use Only

## Support

For issues or questions, contact the development team.

---

**Last Updated**: 2025-12-20  
**Maintained by**: Senstographic Development Team
