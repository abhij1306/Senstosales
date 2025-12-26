# Frontend Architecture Guide

## Overview

SenstoSales frontend follows a strict **Atomic Design Methodology**, built on Next.js 14, TypeScript, and Tailwind CSS. This guide details the architectural decisions, design system structure, performance strategies, and transition patterns that drive the application's user experience.

---

## Table of Contents

1.  [Technological Stack](#technological-stack)
2.  [Atomic Design System](#atomic-design-system)
3.  [Component Architecture](#component-architecture)
4.  [Performance Optimization](#performance-optimization)
5.  [Motion & Comparisons](#motion--transitions)
6.  [State Management](#state-management)
7.  [Best Practices](#best-practices)

---

## Technological Stack

*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript (Strict Mode)
*   **Styling**: Tailwind CSS (Utility-first)
*   **Animations**: Framer Motion
*   **Icons**: Lucide React
*   **Data Fetching**: Custom API Client (`@/lib/api`)

---

## Atomic Design System

We organize components hierarchically to ensure consistency and reusability.

### 1. Atoms (`components/design-system/atoms`)
The smallest building blocks. These are highly reusable, logic-free, and style-pure.
*   **Examples**: `Button`, `Input`, `Typography` (H1, Body, Accounting), `Badge`, `Card`.
*   **Rule**: Atoms cannot import Molecules or Organisms.

### 2. Molecules (`components/design-system/molecules`)
Groups of atoms functioning together as a unit.
*   **Examples**: `SearchBar` (Input + Icon), `TableCells` (Status definitions), `Tabs` (Buttons + State).
*   **Rule**: Molecules handle local UI state (e.g., hover, focus) but avoid complex business logic.

### 3. Organisms (`components/design-system/organisms`)
Complex UI sections composed of molecules and atoms.
*   **Examples**: `DataTable` (Table + Pagination + Sort), `SummaryCards` (Group of Cards), `ReportsToolbar`.
*   **Rule**: Organisms can manage their own display state (e.g., current sort column) but prefer receiving data via props.

### 4. Templates (`components/design-system/templates`)
Page-level layouts that define the structure without specific content.
*   **Examples**: `ListPageTemplate` (Header + Toolbar + Summary + Table), `ReportsPageTemplate`.
*   **Rule**: Templates are "dumb" containers; they dictate *where* components go, not *what* data they show.

### 5. Pages (`app/*/page.tsx`)
The connector. Pages fetch data, manage business state (URL params, API loading), and inject content into Templates.
*   **Rule**: Pages are the "Smart Components".

---

## Component Architecture

### The "Smart Page / Dumb Template" Pattern

We decouple **Data Fetching** from **UI Rendering**.

**Page Component (`app/po/page.tsx`)**:
*   Fetches data (`api.listPOs()`).
*   Manages URL query state (Search, Filter).
*   Handles routing (`router.push`).
*   Passes data to Template.

**Template Component (`templates/ListPageTemplate.tsx`)**:
*   Receives `data`, `loading`, `columns` as props.
*   Renders the layout grid.
*   Handles loading skeletons and empty states.
*   Zero API knowledge.

---

## Performance Optimization

### 1. Server Components vs Client Components
*   **Root Layout (`layout.tsx`)** is a Server Component to ensure fast initial HTML.
*   Context Providers (`ThemeProvider`, `ToastProvider`) are extracted to `providers.tsx` (Client Component).
*   Leaf components are Client Components only when interactivity is required (`"use client"`).

### 2. Lazy Loading (`next/dynamic`)
Heavy components are loaded only when needed to reduce initial bundle size (Time to Interactive).
*   **DataTable**: `const DataTable = dynamic(() => import(...))`
*   **Visualizations**: `const DocumentJourney = dynamic(() => import(...))`
This is crucial for Detail pages where heavy tables might block the main content render.

### 3. Parallel Data Fetching
Avoid "Waterfalls" (fetching A, waiting, then fetching B). Use `Promise.all`:

```typescript
// ✅ Correct Pattern
const [pos, stats] = await Promise.all([
  api.listPOs(),
  api.getPOStats()
]);
```

### 4. Hook Optimization
*   **`useMemo`**: Used for expensive calculations (Filtering lists, Aggregating Layout stats).
    *   *Critical*: Always define Table Columns outside component or inside `useMemo`.
*   **`useCallback`**: Memoize event handlers passed to child components to prevent unnecessary re-renders.

---

## Motion & Transitions

We use **Framer Motion** for high-fidelity UI capability.

### Page Transitions
*   **Context**: Smooth fade-in/out when navigating between tabs.
*   **Implementation**: `<AnimatePresence mode="wait">` wrapping parameterized content.

### Tab Switch Logic (Flicker Fix)
*   **Problem**: "Ghosting" when switching (old tab fades out while new one fades in).
*   **Solution**:
    1.  Absolute positioning for "active" background pill.
    2.  `duration-200` for snappy feel.
    3.  Transparent borders on inactive tabs to prevent pixel shifts (Layout Shift).

---

## State Management

### URL-Driven State
For shareable views (Search queries, Active IDs), we prefer URL parameters over `useState`.
*   **Read**: `searchParams.get('q')`
*   **Write**: `router.push('?q=value')`

### Local UI State
Used for ephemeral interactions:
*   `activeTab` (if not persistent)
*   `isOpen` (Modals/Dropdowns)
*   `isLoading`

---

## Best Practices Checklist

1.  **Atomic Integrity**: Don't import a Page into an Atom.
2.  **Strict Typing**: No `any`. Define Interfaces for all Props (`interface POListItem`).
3.  **Skeleton Loading**: Always provide a skeleton state for async content. Never show a blank white screen.
4.  **Error Boundaries**: Handle API failures gracefully with "Error Cards" or Toast notifications.
5.  **Clean Imports**: Use `@/components/...` aliases. Avoid `../../`.

---

**Last Updated**: 2025-12-26
**Version**: 4.0.0 (Atomic Refactor)
