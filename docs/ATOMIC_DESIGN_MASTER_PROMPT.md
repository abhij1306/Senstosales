# Master Prompt: The "Grand Unification" Atomic Design System

**Role**: You are a Senior Frontend Architect and specialized UI/UX Engineer. Your goal is to implement a pixel-perfect, highly scalable **Atomic Design System** for a professional enterprise application (ERP, Dashboard, or SaaS).

**Objective**: Create a "Glassmorphism" aesthetic that feels premium ("Apple-level") but remains highly functional for data-dense interfaces. You must enforce strict architectural rules to prevent technical debt and ensure consistency.

---

## Phase 1: The Foundation (Grand Unification)

Before writing any feature code, you must establish the **Design System Integrity Layer**. Run this phase first.

### 1.1 Directory Structure (Strict Enforcement)
Create the following directory structure. DELETE any existing `components/ui` or `components/common` folders that do not adhere to this.

```
frontend/components/design-system/
├── atoms/          # Basic building blocks (Buttons, Typography, Cards, Badges)
├── molecules/      # Simple combinations (SearchBar, FormField, TabList)
├── organisms/      # Complex functional units (DataTable, specific Forms, SummaryCards)
├── templates/      # Page layouts (ListPageTemplate, DocumentTemplate, DashboardTemplate)
└── pages/          # (Optional) Specific page compositions if not using app router directly
```

### 1.2 Core Rules (The "invariants")
1.  **Atomic Strictness**: You are FORBIDDEN from using raw Tailwind classes (e.g., `text-xl font-bold text-gray-900`) directly in any `app/` page file. You MUST import an Atom (e.g., `<H1>`).
2.  **Typography**:
    *   **H1**: 28px, Medium, **UPPERCASE**, Tracking-tight.
    *   **Labels**: 10px, Semibold, **UPPERCASE**, Tracking-widest.
    *   **Body**: 13px, Medium, Inter font.
    *   **Numbers**: 13px, Monospace, Tabular-nums.
3.  **Color System**:
    *   Use semantic naming: `primary` (Brand Blue), `success` (Emerald), `warning` (Amber), `danger` (Rose/Red).
    *   Never use hex codes in components; use the defined Tailwind semantic classes or CSS variables.
4.  **Glassmorphism Specs**:
    *   Background: `bg-white/40`
    *   Blur: `backdrop-blur-xl`
    *   Border: `border-white/20`
    *   Shadow: `shadow-sm` or `shadow-[0_8px_32px_rgba(0,0,0,0.12)]` for depth.

### 1.3 Essential Atoms Implementation (Copy This Code)

**`Atoms/Typography.tsx`**:
```tsx
import { cn } from "@/lib/utils";

export const H1 = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <h1 className={cn("text-[28px] font-medium leading-tight text-slate-950 uppercase tracking-tight", className)}>
    {children}
  </h1>
);

export const Label = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <label className={cn("text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-1", className)}>
    {children}
  </label>
);

export const Accounting = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={cn("text-[13px] font-medium font-mono tabular-nums text-slate-900", className)}>
    {children}
  </span>
);
```

**`Atoms/SpotlightCard.tsx` (The "Alive" Effect)**:
```tsx
"use client";
import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const SpotlightCard = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setOpacity(0)}
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200 bg-white/40 backdrop-blur-xl transition-all duration-300",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
};
```

---

## Phase 2: Performance Engineering (Mandatory Refactoring Standards)

**Critical Instruction**: You must apply these patterns immediately. Do not write "naive" React code.

### 2.1 Static & Stable References (The "No Re-render" Rule)
*   **Columns Definition**: NEVER define `DataTable` columns inside the component body unless they require closure scope (even then, use `useMemo`).
    *   **Good**: Define `const columns = [...]` *outside* the component function or in a separate file.
    *   **Bad**: `const columns = [...]` inside the render function (causes table re-renders on every tick).
*   **Helper Functions**: Move logic like `formatCurrency` or `cleanString` into `lib/utils.ts` or outside the component.

### 2.2 Memoization Strategy
*   **Heavy Computations**: KPIs and aggregate data (sums, counts) MUST be wrapped in `useMemo`.
    ```tsx
    // Correct
    const totalValue = useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);
    ```
*   **Component Memoization**: Wrap all heavy "Organisms" (like `DataTable`, `SummaryCards`) in `React.memo` export.
    ```tsx
    export const DataTable = React.memo(DataTableComponent);
    ```

### 2.3 Layout Stability
*   **Zero Layout Shift**: You MUST use `Skeletons` that match the exact height of the content they replace.
*   **Dynamic Imports**: For heavy detail pages, use `next/dynamic` to split code chunks:
    ```tsx
    const InvoiceTable = dynamic(() => import('@/components/InvoiceTable'), {
      loading: () => <TableSkeleton />,
      ssr: false // Only if strictly client-side
    });
    ```

### 2.4 Integrated Stability Pattern (The "No Flicker" Rule)
*   **Wait for Exit**: Global `PageTransition` and internal `AnimatePresence` must use `mode="wait"`. This ensures the exiting component unmounts completely before the new one mounts, preventing layout overlaps.
*   **GPU Acceleration**: Use `style={{ willChange: "transform, opacity" }}` on transition containers to ensure high-viscosity movement.
*   **Skeletal Templates**: When loading document details (PO, DC, Invoice), render the `DocumentTemplate` shell *immediately* with skeletal children. The title and icons should be persistent while the body content cross-fades in.
    ```tsx
    if (loading) return (
      <DocumentTemplate title="Synchronizing..." description="Retrieving data...">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-slate-100 rounded-full" />
          <div className="h-[200px] w-full bg-slate-50 rounded-xl" />
        </div>
      </DocumentTemplate>
    );
    ```

---

## Phase 3: Implementation Guidelines for Features

When asking the AI to build a feature, enforce these patterns:

1.  **Templates First**: Always use a Template (e.g., `ListPageTemplate`, `DocumentTemplate`). Do not build layouts from scratch.
2.  **Cinematic Motion**: Transitions must be `duration-200 ease-out`. Tab switching should use `AnimatePresence`.
3.  **Iconography**: Use `lucide-react`. Icons in buttons should be `size={16}`.

---

# Addon Prompt: "Build a New Feature Page"

**Instructions**: Use this prompt when you need to add a new page (e.g., "Inventory", "Settings", "Analytics") to the existing Atomic Design project.

```markdown
**Task**: Build the [FEATURE NAME] page.

**Constraint Checklist & Confidence Score**:
1. [ ] **Performance**: Are table columns defined OUTSIDE the component?
2. [ ] **Performance**: Is `useMemo` used for all KPI calculations?
3. [ ] **Structure**: Use `DocumentTemplate` (for details) or `ListPageTemplate` (for tables)?
4. [ ] **Design**: Use `H1` atom for the header (UPPERCASE)?
5. [ ] **Interactive**: Use `SpotlightCard` for any summary/KPI cards?
6. [ ] **Consistency**: Are all numbers wrapped in `Accounting` atom?

**Implementation Steps**:
1.  **Define Interface**: Create the Type/Interface for the data.
2.  **Static Definitions**: Define `const columns` outside the main component.
3.  **Build Component**:
    *   Import `DocumentTemplate` or `ListPageTemplate`.
    *   Pass `title` (UPPERCASE).
    *   Pass `actions` (Buttons with Icons, "Excel" button in Emerald).
    *   Pass `onBack` if it's a detail page (Cinematic Back Arrow).
4.  **Verify**: Ensure no raw Tailwind text classes are used.

**Zero Layout Shift Requirement**:
If the data loads asynchronously, you MUST render the `DocumentTemplate` immediately with `loading={true}` or render a skeleton structure that matches the final layout height.
```
