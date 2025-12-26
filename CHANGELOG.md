# Changelog

All notable changes to SenstoSales ERP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.4.0] - 2025-12-27

### Added
- **Integrated Stability Pattern**: Rolled out a new stability standard across all Document and List modules to eliminate "After-Pop" flickering.
- **Master Prompt Update**: codified the "No Flicker" rule in `docs/ATOMIC_DESIGN_MASTER_PROMPT.md` for all future AI-generated features.

### Fixed
- **Global Transitions**: Refined `PageTransition.tsx` with `mode="wait"`, GPU acceleration hints (`will-change`), and tuned viscous cubic-bezier easing.
- **Layout Stabilization**: Forced persistent vertical scrollbars in `RootLayout` to prevent horizontal layout shifts during navigation.
- **Module Rollout**: Applied structural stabilization to Dashboard, PO, DC, Invoice, and SRV modules, ensuring headers remain persistent while data loads into skeletal shells.
- **Redundancy Cleanup**: Removed conflicting `PageAnimatePresence` wrapper from `Providers.tsx` to centralize animation logic.

## [3.3.0] - 2025-12-26

### Added
- **Cinematic Transitions**: Implemented "Shared Element" morphing transitions for PO, DC, and Invoice numbers, creating a seamless navigation experience between lists and details.
- **Skeleton Loading**: Replaced generic spinners with layout-aware Skeleton screens for PO, DC, Invoice, and Templates pages, eliminating "Double Flicker" and layout shifts.
- **Audit Infrastructure**: Restored critical MCP audit servers (`lint-audit`, `performance-audit`) using shared configurations.
- **Performance Trace**: Integrated Playwright-based performance tracing to measure CLS and load times (Cold Start ~11s, Transitions optimized).

### Fixed
- **Linting**: Auto-fixed formatting issues across 108+ frontend files using Prettier.
- **Visual Stability**: Resolved layout jumping on "PO Notes/Templates" page by standardizing the loading state.



### Fixed
- **Reports Page**: Resolved "Duplicate children with the same key" React error in "Shortages" and "Ledger Audit" tabs by implementing unique composite keys for data rows.
- **Reports Icons**: Fixed "Objects are not valid as a React child" error in KPI cards by correctly instantiating Lucide icons.
- **Invoice Creation**: Fixed 422 Unprocessable Entity error and client-side crash by correctly mapping frontend models to backend schemas and improving error message handling.

### Added
- **Manual Numbering**: Implemented strict manual entry for Invoice and DC numbers with real-time financial year-based duplicate checking.
- **UI Streamlining**: Auto-hiding creation steps/selectors when creating documents contextually (e.g., creating DC from PO view).

## [3.1.1] - 2025-12-25

### Fixed
- **Total Items Column**: Fixed data not appearing in PO list - required backend restart to load updated Pydantic model
- **Column Positioning**: Moved "Items" column to appear before "Ord" column as requested
- **Sidebar Flickering**: Resolved layout shifts by adding transparent borders to `.nav-link` while preserving translateX animations
- **Batch Upload Stop Button**: Fixed Stop button to immediately cancel upload without getting stuck

### Added
- **Batch Upload Animation**: Enhanced upload progress display with:
  - Large animated progress bar with gradient and shimmer effect
  - Real-time percentage display
  - Grid of processed files with staggered fade-in animations
  - Working cancel button for instant upload termination

### Documentation
- **DESIGN_GUIDE.md**: Created comprehensive design system documentation covering:
  - Global color palette and typography standards
  - Component library patterns (buttons, inputs, cards, tabs, tables)
  - Page layout templates and best practices
  - Animation guidelines and spacing system
  - Complete example feature implementation
- **README.md**: Rewritten for clarity with prominent references to DESIGN_GUIDE.md
- **Cleanup**: Removed archive folder with old temp files and test scripts

### Verified
- Manual DC/Invoice number input working with FY-wise duplicate checking (backend logic confirmed)
- Database contains items for all POs (e.g., PO #1115002 has 1 item)
- API correctly returns `total_items_count` field after server restart

## [3.1.0] - 2025-12-25

### Added
- **Database Robustness**: Foreign Key verification on every connection with failure detection
- **Unique Constraints**: Migration 015 - Added unique indexes on PO/DC/Invoice/SRV numbers
- **Reset Database Feature**: Admin endpoint `/api/system/reset-db` with two-step UI confirmation
- **System Router**: New router for administrative operations (database reset, maintenance)
- **Reset Database Component**: Frontend component with danger warnings and FK-safe deletion

### Fixed
- **Foreign Key Enforcement**: Added runtime verification to ensure FK pragma succeeds
- **Reset Database Safety**: FK disabled during deletion, re-enabled after with verification
- **Invoice View Description**: Reformatted to prevent text wrapping in long descriptions  
- **DC Completed Items**: Disabled dispatch input for items with 0 remaining quantity
- **Invoice Download**: Fixed route ordering - download endpoint before catch-all path parameter
- **URL Encoding**: Applied `encodeURIComponent` to invoice numbers with slashes throughout frontend

### Security
- **Pre-Release Audit**: Comprehensive system audit completed - 0 critical issues found
- **Quantity Math Validation**: Verified 0 violations of ordered ≥ delivered ≥ received invariants
- **Transaction Safety**: Confirmed all DB writes are atomic with proper rollback
- **Database Integrity**: WAL mode + Foreign Keys enabled, unique constraints applied, 0 duplicate data

## [3.0.0] - 2025-12-25

### Changed
- **Major UI/UX Overhaul**: Replaced legacy card designs with a unified "Glassmorphism" aesthetic across all pages.
- **Global Typography**:
  - Removed `font-mono` from all numeric/date fields for a cleaner look.
  - Standardized font weights to `font-medium` (Slate-700) for optimal readability/contrast in both List and Edit modes.
  - Consistent header sizing and spacing.
- **Layout Refactoring**:
  - Converted `Invoice View` and `PO View` to a standardized 2-Column layout (Sidebar + Main Content).
  - Applied consistent Gradient Backgrounds (`slate-50` to `purple-50/30`) globally.
- **Performance**: Added database indexes for Dashboard queries (`created_at`, `po_status`, etc.) to improve load times.

### Added
- **Global Font Weight Check**: Audited and corrected font weight discrepancies between List and View pages.
- **Accounting Formatting**:
  - Adopted `tabular-nums` for all numeric columns (PO, Invoice, DC) to ensure perfect vertical alignment of digits.
  - Enforced strict Right Alignment for all monetary and quantity fields.
  - Applied Indian Currency Formatting (Lakhs/Crores) to all large values across Dashboards and Lists for better readability.

## [2.2.0] - 2025-12-25

### Added
- **UI Customization**: 
  - Standardized column alignment across all tables (Left for text, Right for numbers).
  - Updated `DenseTable` to automatically align headers based on content class.
  - **PO Table**: Split "Reconciliation" into 4 sortable columns (Ord, Del, Recd, Rej) with color coding. Added "Value" column.
- **SRV Upload**: Enhanced batch upload with chunking, progress bar, and failed file tracking.
- **PO-SRV Linkage**: Implemented retroactive linkage for orphan SRVs and normalized PO number matching.

### Fixed
- **Pagination**: Restored "Rows per page" label visibility.
- **Linkage**: Fixed ambiguous column error in SRV ingestion.
- **Linting**: Resolved typescript errors in `api.ts` and `POPage.tsx` mostly related to `POStats` interface.

## [2.1.0] - 2025-12-24

### Fixed
- **PO Date Scraper Bug**: Changed `PO DATE` regex from `(?:PO\s+)?DATE` to `^PO\s+DATE$` to prevent false matches with `ENQ DATE`, `DELY DATE`, etc.
- **Reports NaN Serialization**: Added `.fillna(0)` to all report endpoints (`reconciliation`, `sales`, `dc_register`, `invoice_register`, `pending`) to prevent "Out of range float values are not JSON compliant" errors
- **DC Register SQL Query**: Corrected `COUNT(dci.id)` to `COUNT(*)` and completed `GROUP BY` clause
- **Database Migration Dependencies**: Fixed circular dependencies in migration files (011 using `is_active` before 010 added it)

### Added
- **Database Reset Script**: Created `reset_database.py` that applies all 12 migrations in correct dependency order
- **Multipart Upload Limit**: Created `backend/app/core/multipart_fix.py` to increase file upload limit from 1,000 to 10,000
- **Migration Order Fix**: Updated `backend/scripts/apply_migrations.py` to use same order as reset script

### Changed
- Enhanced `.gitignore` to exclude test files (`test_*.py`, `debug_*.py`, etc.) and sensitive data
- Improved PO scraper accuracy by making field regexes more specific

### Removed
- Temporary test/debug files created during troubleshooting

## [2.0.0] - 2024-12-17

### Added
- Initial release with complete PO-DC-Invoice-SRV workflow
- Dashboard with analytics
- Reconciliation reports
- PDF/Excel export functionality
- Search and alerts system

[2.1.0]: https://github.com/yourusername/SenstoSales/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/yourusername/SenstoSales/releases/tag/v2.0.0
