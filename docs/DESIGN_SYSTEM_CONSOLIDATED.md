# SenstoSales Design System (Consolidated v4.0)

Professional "Glassmorphism" for high-density business intelligence.

## 1. Core Philosophy
**Professional Glassmorphism**
- **Aesthetic**: Modern, translucent, ethereal but grounded. Data floats on a Mesh Gradient background.
- **Functional**: High information density, clear hierarchy, distinct status indicators.
- **Surface**: `bg-white/45` | `backdrop-blur-xl (24px)` | `border-white/20`.

## 2. Typography & Density
**Font Family**: `Inter` (Sans-serif) for all UI elements.
**Font Weight System**:
- **Headers (H1)**: `text-[28px] font-medium leading-tight text-slate-950`.
- **Labels**: `text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1`.
- **Values (Body)**: `text-[13px] font-medium leading-relaxed text-slate-950`.
- **Accounting**: `text-[13px] font-medium font-mono tabular-nums text-slate-950`.

## 3. Color Palette (Tailwind Semantic)
| Role | Class | Color | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `text-blue-600` | `#3B82F6` | Links, Active states |
| **Success** | `text-emerald-600` | `#10B981` | Paid, Delivered, Accepted |
| **Warning** | `text-amber-500` | `#F59E0B` | Pending, Low Stock |
| **Danger** | `text-red-500` | `#EF4444` | Rejected, Overdue |
| **Neutral** | `text-slate-600` | `#475569` | Secondary Metadata |

## 4. Components Standards

### Button System
- **Premium**: `.btn-premium` base class with `.btn-primary` (gradient) or `.btn-ghost`.
- **Standard**: `bg-purple-600 text-white rounded-lg shadow-purple-500/20`.

### Glass Containers
- **GlassCard**: Foundational container with `p-6` and `bg-white/40`.
- **DenseTable**: Standardized `DataTable` for listings with 12px `TableText`.

## 5. Layout Architecture
- **Sidebar**: Non-collapsible fixed rail (`w-72`) with navy gradient.
- **Main View**: `mx-auto max-w-[1400px] w-full px-10 pt-10`.
- **KPI Headers**: 3-4 glass cards at the top of list pages for primary metrics.

## 6. Prohibited Practices
- **No Monospace** for general text (only for `Accounting` numbers).
- **No Bold** for table data (use `font-medium` instead).
- **No Inline Styles**: Use Tailwind utility classes or global identifiers.
- **No Arbitrary Spacing**: Follow the scale (4px, 8px, 16px, 24px, 32px).
