# SenstoSales Design System (Consolidated v5.0)

Professional "Glassmorphism" for high-density business intelligence, built on **Atomic Design** principles.

## 1. Core Philosophy
**Professional Glassmorphism**
- **Aesthetic**: Modern, translucent, ethereal but grounded. Data floats on a Mesh Gradient background.
- **Functional**: High information density, clear hierarchy, distinct status indicators.
- **Surface**: `bg-white/45` | `backdrop-blur-xl (24px)` | `border-white/20`.
- **Architecture**: Atomic Design (Atoms -> Molecules -> Organisms -> Templates -> Pages).

## 2. Typography & Density
**Font Family**: `Inter` (Sans-serif) for all UI elements.

**Font Weight System**:
- **Headers (H1)**: `text-[28px] font-medium leading-tight text-slate-950 uppercase`.
  - *Example*: `PURCHASE ORDERS`, `DASHBOARD`
- **Subheaders (H2)**: `text-[20px] font-medium leading-tight text-slate-950`.
- **Section Headers (H3)**: `text-[16px] font-medium leading-normal text-slate-950`.
- **Labels (H4)**: `text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1`.
  - *Example*: Table column headers (`DATE`, `STATUS`, `VALUE`).
- **Body Text**: `text-[13px] font-medium leading-relaxed text-slate-950`.
- **Accounting**: `text-[13px] font-medium font-mono tabular-nums text-slate-950`.

## 3. Color Palette (Tailwind Semantic)
| Role | Class | Color | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `text-blue-600` | `#3B82F6` | Links, Active states |
| **Success** | `text-emerald-600` | `#10B981` | Paid, Delivered, Accepted |
| **Warning** | `text-amber-500` | `#F59E0B` | Pending, Low Stock |
| **Danger** | `text-red-500` | `#EF4444` | Rejected, Overdue |
| **Neutral** | `text-slate-600` | `#475569` | Secondary Metadata |

## 4. Component Standards (Atomic)

### Atoms (Data-agnostic, Style-pure)
- **Buttons**:
  - `variant="primary"`: Solid Blue (`bg-blue-600 text-white`).
  - `variant="secondary"`: White/Ghost (`bg-white/50 hover:bg-white`).
  - `variant="danger"`: Red (`bg-red-50 text-red-600`).
- **Badges**: Rounded-full, uppercase tracking-wide (`px-2 py-0.5 text-[10px]`).
- **Cards**: `bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl`.

### Molecules (Component Groups)
- **SearchBar**: Input field + Search Icon + Keyboard Shortcut hint.
- **Tabs**: Button group with pills. Active state has `shadow-md` and `scale-105`.
- **TableCells**: Standardized cell renderers (e.g., `StatusCell`, `DateCell`).

### Organisms (Connected UI)
- **DataTable**:
  - Headers: **UPPERCASE**, 10px font-semibold.
  - Rows: Hover effects (`hover:bg-blue-50/30`), `cursor-pointer`.
  - Pagination: Sticky footer or integrated.
- **SummaryCards**: Grid of KPI cards at top of pages.

## 5. Layout Architecture
- **Root Layout**: Server Component (`layout.tsx`) holding the Shell.
- **Sidebar**: Non-collapsible fixed rail (`w-64`) with navy gradient.
- **Main View**: `mx-auto max-w-[1600px] w-full px-8 py-8`.
- **Page Structure**:
  1.  **Header**: H1 Title (UPPERCASE) + Subtitle + Action Toolbar.
  2.  **KPIs**: Row of Summary Cards.
  3.  **Content**: Charts, Tables, or Forms.

## 6. Motion & Interaction
- **Transitions**: Global page transitions use `mode="wait"` with `AnimatePresence`. Initial position: `opacity: 0, scale: 0.98, y: 10`. Exit position: `opacity: 0, scale: 1.02, y: -10`.
- **Performance**: High-viscosity movement is enforced using `will-change: transform, opacity`.
- **Hover Effects**: Subtle lift and shadow (`hover:-translate-y-0.5 hover:shadow-lg`).
- **Tab Switching**: Internal `AnimatePresence` with cross-fade (Opactiy 0->1, Y 10->0).
- **Skeletal Stabilization**: Mandatory. Structural shells (`DocumentTemplate`, `ListPageTemplate`) MUST render immediately during data fetching to prevent layout shifts ("Double Flicker").
- **Flicker Prevention**: Inactive tabs have transparent borders to prevent layout shifts.

## 7. Prohibited Practices
- **No Monospace** for general text (only for `Accounting` numbers).
- **No Bold** for table data (use `font-medium` instead).
- **No Inline Styles**: Use Tailwind utility classes or global identifiers.
- **No Arbitrary Spacing**: Follow the scale (4px, 8px, 16px, 24px, 32px).
- **No Mixed Case Headers**: All primary Page and Table headers must be **UPPERCASE**.

---
**Last Updated**: 2025-12-26
**Version**: 5.0.0
