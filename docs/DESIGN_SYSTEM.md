# SenstoSales Design System (v3.0.0)

## 1. Core Philosophy
The UI follows a **"Glass, Gradient, & Compact"** philosophy designed for high-density data presentation without visual clutter. The goal is an airy, modern feel that remains highly legible for business operations.

---

## 2. Visual Foundation

### Global Background
All pages must use the standardized subtle gradient to maintain depth.
```css
bg-gradient-to-br from-slate-50 via-white to-purple-50/30
```

### Glassmorphism (Cards & Containers)
Content containers should not be solid white. Use the `GlassCard` component or apply:
```css
bg-white/40 backdrop-blur-md border border-white/20 shadow-sm
```

---

## 3. Typography
**Font Family**: `Inter` (Sans-serif) is used exclusively.
**Monospace Usage**: **FORBIDDEN** for general data. Do not use `font-mono` for currency or numbers; use tabular nums variants or standard sans-serif for better legibility.

### Weight System (Crucial)
*   **Headers (H1)**: `font-bold text-slate-800` (Text-2xl)
*   **Section Headers (H2/H3)**: `font-bold text-slate-700` (Text-sm/xs uppercase)
*   **Data Values (Important)**: `font-medium text-slate-700` (e.g., Invoice Totals, PO Amounts) is the standard. *Avoid "semibold" or "bold" for table data unless critical.*
*   **Data Labels**: `font-semibold text-slate-400 uppercase tracking-wider text-[10px]`

### Size Scale
*   **Input/Data**: `text-xs` (Primary size for dense interfaces)
*   **Body**: `text-sm` (Readable content)
*   **Micro**: `text-[10px]` (Tags, metadata)

---

## 4. Layout Standards

### "View" & "Create" Pages (2-Column)
All detail pages must follow a split layout:
1.  **Sidebar (Left, 1/3)**: Meta-information (Supplier Info, Financial Summaries, Status).
2.  **Main Content (Right, 2/3)**: Dense actionable data (Line items, tables, editable forms).

### "List" Pages
*   **Full Width**: Use `DenseTable` for maximum data visibility.
*   **KPI Header**: 3-4 Glass Cards at the top for quick stats.
*   **Sticky Filters**: Search bars and filters should stick to the top (`sticky top-2`).

---

## 5. Component Guidelines

### Buttons
*   **Primary Action**: `bg-purple-600 text-white rounded-lg shadow-purple-500/20`
*   **Secondary/Edit**: `bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`
*   **Destructive**: `text-red-600 hover:bg-red-50`

### Status Badges
Use our standard `StatusBadge` component. Manual classes:
*   **Success**: `bg-emerald-50 text-emerald-700 border-emerald-200`
*   **Pending**: `bg-amber-50 text-amber-700 border-amber-200`
*   **Neutral**: `bg-slate-100 text-slate-600 border-slate-200`
