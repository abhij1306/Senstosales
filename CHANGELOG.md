# Changelog

All notable changes to SenstoSales ERP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
