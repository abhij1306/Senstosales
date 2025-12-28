# GLOBAL PROJECT MANAGEMENT & GOVERNANCE
> **Authority**: AI Architecture Steward
> **Enforcement Level**: ACTIVE (Strict Invariant Grading)

This document defines the non-negotiable governance rules, architecture invariants, and interaction protocols for this project. It serves as the single source of truth for all Agents, Humans, and Automation tools.

---

## 1. Architecture Invariants
The following rules are absolute. Any deviation is considered a standard failure and must be auto-corrected or rejected.

- **Database Constraint**: 
  - Max 1 SQLite database file per project.
  - Path must match `architecture-manifest.yaml`.
  - No DB creation outside this canonical path.
- **Folder Boundaries**:
  - `backend/`: API, Services, Repositories, Schemas ONLY.
  - `frontend/`: UI Components, Pages, Hooks, Lib ONLY.
  - `scripts/`: DevOps, Maintenance, Migration scripts ONLY.
  - **No New Root Folders** allowed without explicit `architecture_manifest` update.
- **Code Purity**:
  - Frontend imports must NOT touch Backend drivers (e.g., `sqlalchemy`, `sqlite3`).
  - Backend must NOT contain UI code (React, HTML templates).
  - No "utils" pollution in root; all utilities must be scoped to `lib/` or `core/`.

## 2. Database Path Contract
The canonical database location is defined in `architecture-manifest.yaml` under `database.path`.
- **Allowed**: Reading/Writing to `<manifest.database.path>` via defined drivers.
- **Forbidden**: Creating `test.db`, `temp.db`, or any `.db` file in `src/`, `app/`, or `frontend/`.
- **Migration Rule**: Schema changes allowed **only** via strict SQL migration files in `backend/migrations/` (or equivalent). AI must not execute DDL directly.

## 3. Folder Boundary Policy
Agents must check the destination path before file creation.
- **IF** `frontend/` → Ensure content is React/TS/CSS.
- **IF** `backend/` → Ensure content is Python/Pydantic/SQLAlchemy.
- **IF** `docs/` → Documentation only.
- **Violation Response**: Immediately move file to correct location or `archive/` and log as Technical Debt.

## 4. Trace Plan & Grading Contract
Before any code generation, Agents must perform a Self-Trace:
1.  **Intent Trace**: JSON declaring affected layers, DB changes, and guardrails.
2.  **Local Validations**: Checking imports and file paths against Invariants.
3.  **Execution Log**: Post-generation JSON confirming `validation_status: "pass"`.
4.  **Regeneration**: If `trace_grade == fail`, retry strictly fixing the violation.

## 5. Regeneration Discipline
- **Zero Tolerance**: Failed traces cannot be "explained away". Code must be rewritten.
- **Loop Limit**: Max 3 retries. If failure persists, revert to pre-task state and notify Human.
- **Cleanup**: Failed attempts must be deleted, not left as commented-out code.

## 6. Deployment Runbook Rules
- **Orchestrator**: `scripts/deploy.sh` (or equivalent) is the ONLY entry point for production.
- **Pre-Flight**:
  1.  Commit Check (Clean working tree).
  2.  Lint/Test Pass.
  3.  Database Backup (Timestamped).
- **Rollback**: Automatic restore of DB backup and git revert on failure.

## 7. Human Intervention Rules
Agents have "Full Authority" for code/architecture but MUST pause for:
- Non-standard dependency installation (requires OS/Network confirmation).
- Secret/Env Variable changes.
- Deletion of "High Complexity" logic (Severity > 7) without prior plan approval.
- Deployment to Production targets (Staging is autonomous).

## 8. Debt Taxonomy & Delta Definition
Technical Debt is defined strictly as **Delta from Documentation**.
- **Report Format**: `audit/TECH_DEBT_REPORT_<MODULE>.json`
- **Fields**:
  - `desired_state`: What the doc says.
  - `current_state`: What the file system implies.
  - `delta`: The exact difference.
  - `severity`: Standardized specific level.
- **Reaction**: Update code to match Docs (Preferred) OR Update Docs if Architecture has evolved (Requires Trace Log).

## 9. How to Install This System in Any Project
1.  Copy this `GLOBAL_PROJECT_MANAGEMENT.md` to `docs/`.
2.  Create `architecture-manifest.yaml` in root.
3.  Initialize `scripts/guardrails/` (optional local scripts).
4.  Instruct AI Agent with the "Architecture Steward" Master Prompt.

## 10. How Agents Must Interact with Guards
- Agents must assume "Silent Guards" exist.
- Before `write_to_file`, check: "Does this violate Folder/Invariant rules?"
- If unsure, Check `architecture-manifest.yaml`.

## 11. How to Extend New Features Safely
1.  **Plan**: Update `implementation_plan.md`.
2.  **Trace**: Generate Intent Trace JSON.
3.  **Execute**: Write Code.
4.  **Verify**: Run Invariant Checks.
5.  **Audit**: Update `TECH_DEBT_REPORT` if new debt introduced.

## 12. Architecture Approval Discipline
- Major refactors (Migration, Framework swap) require `implementation_plan.md` approval via `notify_user`.
- Minor fixes (Bugfix, Styles, Typos) are Autonomous.

## 13. Session Switching Resilience Guide
- **State Persistence**: All context must be saved to `docs/session_state.md` (or similar) or implicit in `task.md`.
- **Debt Logs**: Debt reports are persistent. New session = Re-read debt reports.
- **Manifest**: Always the first read on new session.

## 14. Self-Learning Feedback Loops Guide
- Agents must log "Correction Actions" in Trace Logs.
- If a specific error repeats across 3 sessions, create a specific Rule in `SYSTEM_INVARIANTS.md` to prevent recurrence.
