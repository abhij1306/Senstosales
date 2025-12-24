# SenstoSales Design Guidelines (v2.1)

## 1. Design Philosophy
**"Professional Glassmorphism"**
*   **Aesthetic**: Modern, translucent, ethereal but grounded.
*   **Functional**: High information density, clear hierarchy, distinct status indicators.
*   **Core Metaphor**: Data floats on a "Mesh Gradient" background, contained in "Glass Cards".

## 2. Core Colors (Tailwind Tokens)
We use a semantic color system mapped to Tailwind shades.

| Role | Color Family | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | Blue | `text-blue-600` | Links, Primary Buttons, Active States |
| **Success** | Emerald | `text-emerald-600` | Validated, Delivered, Paid, Approved |
| **Warning** | Amber | `text-amber-500` | Pending, In Transit, Unacknowledged |
| **Danger** | Red | `text-red-600` | Errors, Rejections, Overdue |
| **Neutral** | Slate | `text-slate-500` | Secondary Text, Borders, Icons |
| **Brand** | Purple | `text-purple-600` | Delivery Challans, Logistics |

### Surface Colors
*   **Glass Cards**: `bg-white/65` | `backdrop-blur-xl` (18px) | `border-white/20`
*   **Background**: `bg-mesh` (CSS linear gradient defined in `globals.css`)

## 3. Key Components

### 3.1. GlassCard
The fundamental container for all content.
```tsx
<GlassCard className="p-4">
  <h3>Content Title</h3>
  <p>Content body...</p>
</GlassCard>
```
*   **Properties**: `backdrop-filter: blur(18px)`, `bg-white/65`, `border-white/20`, `shadow-sm`.

### 3.2. ReconciliationBadge
Visualizes the accounting state of a PO item (`Ordered ≥ Delivered ≥ Received`).
```tsx
<ReconciliationBadge ordered={100} delivered={80} received={75} size="sm | md" />
```
*   **Visuals**:
    *   **Gray**: Ordered / Pending
    *   **Blue**: Delivered / In Transit
    *   **Emerald**: Received / Accepted
    *   **Red**: Rejected / Over-delivered

### 3.3. DenseTable
A high-density data grid replacing standard tables.
```tsx
<DenseTable 
  data={data} 
  columns={columns} 
  onRowClick={handleClick} 
  className="bg-white/60 shadow-sm backdrop-blur-sm"
/>
```

### 3.4. Input Fields
Standardized input styles for forms and search bars.
```tsx
<input className="w-full pl-9 pr-4 py-1.5 bg-white/60 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
```

### 3.5. Buttons
Standardized button styles.
*   **Primary**: `bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20`
*   **Secondary**: `bg-white border-slate-200 text-slate-600 hover:bg-slate-50`
*   **Destructive**: `bg-red-600 text-white hover:bg-red-700`

**Layout Rule**: Always wrap action buttons in a flex container: `<div className="flex gap-2">...</div>`.

## 4. Typography Scale
**Font Family**: Inter (System UI)

| Purpose | Size | Class | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | 20px | `text-[20px]` | `font-semibold` | Main page headings |
| **Section Heading** | 16px | `text-[16px]` | `font-semibold` | Card headers |
| **Subsection/Label** | 14px | `text-sm` | `font-medium` | Form labels, table cells |
| **Body Text** | 13px | `text-[13px]` | `font-normal` | Descriptions |
| **Small Text** | 11px | `text-xs` | `font-medium` | Field labels (uppercase) |
| **Micro Text** | 10px | `text-[10px]` | `font-medium` | KPI labels (uppercase) |
| **KPI Value** | 28px | `text-[28px]` | `font-bold` | Dashboard stat numbers |

## 5. Layout Patterns
*   **Standard Page**: Header (Title + Actions) -> KPIs -> Filters -> Table.
*   **Sticky Header**: Tables should have sticky headers for usability.
*   **Navigation**: Sidebar (NavRail) + Main Content Area.

## 6. Accessbility & UX
*   **Contrast**: Text must meet WCAG AA standards.
*   **Feedback**: Use Toast notifications for success/error actions.
*   **Loading**: Use Skeletons or Spinners (`Loader2`) for async states.
