# Changelog

All notable changes to SenstoSales ERP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
