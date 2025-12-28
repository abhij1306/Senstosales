# TECHNICAL DEBT ASSESSMENT
> **Status**: Auto-Updated by debt_audit_loop
> **Strictness**: High

This document tracks all active technical debt detected by the Architecture Steward.
Debt is defined as any divergence from `architecture-manifest.yaml` or `GLOBAL_PROJECT_MANAGEMENT.md`.

## 1. High Severity
- **Architecture**: `Found 'app/utils' in backend.`
  - *Manifest*: Forbidden.
  - *Impact*: Code pollution, unclear boundaries.
  - *Action*: Refactor into `services` or specific `lib` modules.

## 2. Medium Severity
- **Deployment**: `Legacy deployment/ folder found.`
  - *Status*: **RESOLVED** (Moved to `migrations/` and `scripts/`).
- **Documentation**: `Missing Architecture Docs.`
  - *Status*: **RESOLVED** (Self-Healed).

## 3. Low Severity
- **Imports**: `frontend/backend_imports`.
  - *Status*: Clean.

## 4. Remediation Plan
1. Refactor `backend/app/utils` -> `backend/app/core` or merge into services.
2. Update `architecture-manifest.yaml` to explicitly allow `app/core` if generic utilities are needed.
3. Establish trace-grading for all future features to prevent regression.
