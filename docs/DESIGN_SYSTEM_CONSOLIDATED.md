# SenstoSales Design System (Consolidated v5.0-Stabilized)

Professional "Glassmorphism & Neo-Depth" for high-density business intelligence, built on **Atomic Design** principles.

## 1. Core Philosophy
**Professional Glassmorphism & Neo-Depth (v5.0-Stabilized)**
- **Aesthetic**: Modern, translucent, tactile. Features 3D "extruded" elements on a bluish mesh gradient.
- **Functional**: High information density, Zero Layout Shift (ZLS) verified.
- **Surface**: `bg-white/45` | `backdrop-blur-xl (24px)` | `border-white/20`.
- **Canvas**: Radial mesh gradient (`#f0f4f8` -> `#e2e8f0` -> `#dbeafe`).
- **Depth**: Neo-extrusion dual shadows (`-8px -8px 20px #ffffff`, `8px 8px 20px #a3b1c6/50`).
- **Architecture**: Atomic Design (Atoms -> Molecules -> Organisms -> Templates -> Pages).

## 2. Typography & Density
**Font Family**: `Inter` (Sans-serif) for all UI elements.

**Font Weight System**:
- **Headers (H1)**: `text-[28px] font-medium leading-tight text-slate-950 uppercase`.
- **Subheaders (H2)**: `text-[20px] font-medium leading-tight text-slate-950`.
- **Section Headers (H3)**: `text-[16px] font-medium leading-normal text-slate-950`.
- **Labels (H4/SmallText)**: `text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none`.
- **Body Text**: `text-[13px] font-medium leading-relaxed text-slate-950`.
- **Accounting**: `text-[13px] font-medium font-mono tabular-nums text-slate-950`.

## 3. Atomic Components (v5.0)

### Atoms (Data-agnostic, Style-pure)
- **Buttons**:
  - `variant="primary"`: Solid Blue with Neo-shadows.
  - `variant="secondary"`: White/Ghost background.
- **Typography**: `H1`, `H2`, `H3`, `Body`, `SmallText`, `Accounting`.
- **Layout**: `Flex`, `Stack`, `Grid`, `Box` (Mandatory for all page layouts).
- **Icons**: Lucide icons wrapped in standard density containers.

### Molecules (Component Groups)
- **SearchBar**: Neo-extruded input with KBD shortcuts.
- **Tabs**: Smooth AnimatePresence transitions with 0px layout shift.

### Organisms (Connected UI)
- **DataTable**: 
  - Zero Layout Shift rendering.
  - Right-aligned `Accounting` columns.
  - Memoized row renderers.
- **SummaryCards**: Grid of 4 KPI cards with hover depth.

## 4. Stability & Performance
- **Zero Layout Shift (ZLS)**: Enforced via `will-change: transform, opacity` and explicit `min-h` shells.
- **Memoization**: All components wrapped in `React.memo`, handlers in `useCallback`.
- **Double Flicker Prevention**: Structural shells (`ListPageTemplate`, `DocumentTemplate`) render before data load.

---
**Last Updated**: 2025-12-28
**Version**: 5.0.1-Stabilized
