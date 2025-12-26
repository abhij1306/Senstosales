# Grand Unification Discrepancy Report
**Date**: 2025-12-26
**Status**: Audit Completed
**Scope**: Frontend Codebase (`app/`, `components/`)

This document outlines deviations from the **"SenstoSales" Design System** and **Frontend Architecture** invariants. These discrepancies must be resolved to achieve 100% standardization.

## 🚨 Critical Architecture Violations

### 1. Missing Atomic Components
*   **Gap**: No generic `<Dialog>` or `<Modal>` component exists in `@/components/design-system`.
*   **Impact**: pages like `app/po/page.tsx` are implementing raw HTML/Tailwind modals (lines 300-345), violating the "No Raw HTML" rule.
*   **Action**: Create `components/design-system/molecules/Dialog.tsx`.

### 3. Inconsistent Tabs
*   **Gap**: `app/reports/page.tsx` implements custom tabs instead of using the standardized `Tabs` molecule.
*   **Impact**: Inconsistent UI behavior and increased maintenance.
*   **Action**: Refactor Reports page to use `components/design-system/molecules/Tabs.tsx`.

### 4. Settings Page Structure
*   **Gap**: `app/settings/my-details/page.tsx` uses `ListPageTemplate` which is intended for data tables, not forms.
*   **Impact**: Misalignment of semantic page structure. 
*   **Action**: Migrate to a dedicated `SettingsPageTemplate` or a generic `FormPageTemplate`.

---

## 📄 Page-Level Discrepancies

### 1. Dashboard (`app/page.tsx`)
*   **[Typography]**: Uses `H1` correctly, but typically missing `Label` atoms for smaller metadata.
*   **[Interactions]**:
    *   **Violation**: Recent Activity list uses a raw `<div onClick={...}>` (lines 71-104) instead of an `<ActionButton>` or `<Card>` interactive variant.
    *   **Violation**: Hardcoded colors (`text-[#1A3D7C]`, `bg-[#2BB7A0]/10`) instead of design tokens or `variant` props.
*   **[Loading]**: Uses `isLoading` state but lacks the "Dual Loading" pattern (Skeleton vs. Opacity Fade).

### 2. Purchase Orders (`app/po/page.tsx`)
*   **[Modals]**: **Critical Violation**. Uses a hardcoded `fixed inset-0 bg-black/50` div for the Upload Modal.
*   **[Routing]**: Uses standard `Link` (Good), but column definitions are inside the file (should be strict static or memoized external).
*   **[Colors]**: Hardcoded status colors in columns (`text-green-600`, `text-orange-600`) instead of `Badge` variants or `StatusText` atoms.

### 3. Reports (`app/reports/page.tsx`)
*   **[Tabs]**:
    *   **Violation**: Uses a manual `.map` loop to render tab buttons (lines 675-706) with raw Tailwind classes.
    *   **Fix**: Should use the standardized `<Tabs>` molecule found in `components/design-system/molecules/Tabs.tsx`.
*   **[Colors]**: Hardcoded Hex values (`text-[#1A3D7C]`) in column definitions.
*   **[Logic]**: Uses `useEffect` for data fetching; should optimally use a custom hook `useReportsData` to separate logic from view (Architecture Rule: Smart Hook / Dumb View).

### 4. Layout (`app/layout.tsx`)
*   **[Background]**: Uses `bg-slate-50`.
*   **[Invariant]**: "Muddy Background Fix" requires strictly `bg-gray-50` or verifying the exact token match with the Figma/Design System spec.
*   **[Structure]**: Missing `<AnimatePresence>` wrapper for route transitions.

### 5. Templates (`components/design-system/templates/`)
*   **[ListPageTemplate]**: **Good**. Uses `H1` and `DataTable` organisms correctly.
*   **[ReportsPageTemplate]**: **Good**. Uses generic atoms. No major violations found.

### 6. Settings (`app/settings/my-details/page.tsx`)
*   **[Forms]**: Uses raw inputs/labels? (Need verification on Form atoms usage).
*   **[Layout]**: It reuses `ListPageTemplate` effectively for consistency, but might benefit from a specific specialized template if the form becomes complex. currently acceptable.

---

## 🛠 Plan of Action

1.  **Phase 1 (Atomic)**: Refactor `Dashboard` activity list and `PO` upload modal to use Atoms/Molecules.
2.  **Phase 2 (Performance)**: Extract column definitions in `PO` and `Dashboard` to external constants to prevent re-creation.
3.  **Phase 3 (Motion)**: Implement `app/template.tsx` and wrap `Reports` tabs in `AnimatePresence`.

This report serves as the checklist for the "Grand Unification" refactor.
