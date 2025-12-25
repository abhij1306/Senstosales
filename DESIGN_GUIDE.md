# SenstoSales Design Guide

## Global Design System

This document defines the **global design conventions** for SenstoSales. **All features must follow these patterns** to maintain consistency across the application.

---

## 1. Color Palette

### Primary Colors
- **Primary Blue**: `#3b82f6` (blue-500) to `#2563eb` (blue-600)
- **Accent Indigo**: `#4f46e5` (indigo-600)
- **Success**: `#10b981` (emerald-500)
- **Warning**: `#f59e0b` (amber-500)
- **Danger**: `#ef4444` (red-500)

### Neutral Colors
- **Text Primary**: `#0f172a` (slate-900)
- **Text Secondary**: `#475569` (slate-600)
- **Text Tertiary**: `#94a3b8` (slate-400)
- **Borders**: `#e2e8f0` (slate-200)
- **Background**: `#f8fafc` (slate-50)

---

## 2. Typography

### Font Family
- **Primary**: `'Inter', system-ui, -apple-system, sans-serif`
- **Monospace**: `'JetBrains Mono', monospace` (for numbers/codes)

### Font Sizes (Global Classes)
```css
.heading-xl    /* 1.875rem (30px) - Page titles */
.heading-lg    /* 1.5rem (24px) - Section headers */
.heading-md    /* 1.125rem (18px) - Card titles */
.text-label    /* 10px - Form labels (uppercase, bold, tracking-widest) */
.text-value    /* 0.875rem (14px) - Form values */
.text-meta     /* 0.75rem (12px) - Metadata */
.text-accounting /* Monospace, tabular numbers */
```

### Font Weights
- **Black (900)**: Headers, important labels
- **Bold (600-700)**: Standard labels, buttons
- **Medium (500)**: Body text
- **Normal (400)**: Secondary text

---

## 3. Component Library

### Buttons (`globals.css`)
```tsx
// Primary action button
<button className="btn-premium btn-primary">
  <Icon className="w-4 h-4" /> Action
</button>

// Secondary/ghost button
<button className="btn-premium btn-ghost">
  <Icon className="w-4 h-4" /> Cancel
</button>
```

**CSS Classes:**
- `.btn-premium` - Base button styles
- `.btn-primary` - Gradient blue background
- `.btn-ghost` - Transparent with glassmorphism

### Input Fields
```tsx
<input 
  className="input-premium font-bold" 
  placeholder="Enter value"
/>
```

**Features:**
- Glassmorphism background
- Smooth transitions
- Focus ring with blue shadow
- Consistent padding and border-radius

### Cards
```tsx
<GlassCard className="p-6">
  {/* Content */}
</GlassCard>
```

**Features:**
- Subtle glassmorphism effect
- Backdrop blur
- Soft shadows
- Rounded corners (1rem)

### Tabs
```tsx
<Tabs
  tabs={[
    { id: 'tab1', label: 'Tab One', icon: IconComponent },
    { id: 'tab2', label: 'Tab Two', icon: IconComponent2 }
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

**Styling:**
- Uppercase, bold labels (10px)
- Wide letter spacing
- Indigo active state
- Icon + text combo

### Tables
Use `DenseTable` component with column definitions:

```tsx
const columns: Column<DataType>[] = [
  {
    header: "Column Name",
    accessorKey: "fieldName",
    enableSorting: true,
    cell: (item) => <span>{item.fieldName}</span>
  }
];

<DenseTable columns={columns} data={items} />
```

---

## 4. Layout Patterns

### Page Structure
```tsx
export default function PageName() {
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-xl">Page Title</h1>
          <p className="text-sm text-slate-500 mt-1">Description</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-premium btn-primary">
            <Icon /> Action
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Metric" value={100} icon={Icon} color="blue" />
      </div>

      {/* Main Content */}
      <GlassCard className="p-6">
        {/* Content */}
      </GlassCard>
    </div>
  );
}
```

### Form Layout
```tsx
<GlassCard className="p-0 overflow-hidden">
  <Tabs tabs={tabConfig} activeTab={activeTab} onTabChange={setActiveTab} />
  
  <div className="p-10">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      <div className="space-y-2">
        <label className="text-label">Field Label</label>
        <input className="input-premium" />
      </div>
    </div>
  </div>
</GlassCard>
```

---

## 5. Animation & Transitions

### Entry Animations
Use Tailwind's `animate-in` utilities:
```tsx
<div className="animate-in fade-in slide-in-from-top-4 duration-300">
  {/* Content */}
</div>
```

### Hover States
```tsx
<button className="transition-all hover:shadow-lg hover:scale-105">
  {/* Button */}
</button>
```

### Loading States
```tsx
{loading ? (
  <Loader2 className="w-5 h-5 animate-spin" />
) : (
  <Content />
)}
```

---

## 6. Icons

Use `lucide-react` icons exclusively:
```tsx
import { FileText, Package, Users } from "lucide-react";

<Icon className="w-4 h-4 text-blue-500" />
```

**Standard Sizes:**
- Small: `w-3.5 h-3.5` (14px)
- Medium: `w-4 h-4` (16px) - **Default**
- Large: `w-5 h-5` (20px)
- XL: `w-6 h-6` (24px)

---

## 7. Spacing System

Use consistent spacing scale:
- **xs**: `gap-1, p-1` (4px)
- **sm**: `gap-2, p-2` (8px)
- **md**: `gap-4, p-4` (16px)
- **lg**: `gap-6, p-6` (24px)
- **xl**: `gap-8, p-8` (32px)
- **2xl**: `gap-10, p-10` (40px)

---

## 8. Navigation

### Sidebar Navigation
Located in `NavRail.tsx`:
- Glassmorphism background
- Icon + label links
- Active state: white background, blue text
- Hover: subtle slide animation (`translateX`)

```tsx
<Link href="/path" className="nav-link">
  <Icon /> Label
</Link>
```

---

## 9. Best Practices

### DO ✓
- Use global CSS classes defined in `globals.css`
- Follow the component library patterns
- Maintain consistent spacing and typography
- Use existing color variables
- Keep animations subtle and purposeful

### DON'T ✗
- Create inline custom styles
- Use arbitrary font sizes or weights
- Mix different design patterns
- Override global conventions
- Use colors outside the defined palette

---

## 10. File Organization

```
frontend/
├── app/                    # Next.js pages
│   ├── globals.css        # Global styles (DO NOT MODIFY without approval)
│   └── [feature]/
├── components/
│   ├── ui/                # Core reusable components
│   │   ├── GlassCard.tsx
│   │   ├── Tabs.tsx
│   │   └── DenseTable.tsx
│   └── [feature]/         # Feature-specific components
└── lib/
    ├── api.ts             # API client
    └── utils.ts           # Utility functions
```

---

## 11. Example: Creating a New Feature

When adding a new feature, follow this template:

```tsx
"use client";

import { useState } from "react";
import { Icon1, Icon2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Tabs from "@/components/ui/Tabs";

export default function NewFeaturePage() {
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-xl">Feature Title</h1>
          <p className="text-sm text-slate-500 mt-1">Feature description</p>
        </div>
        <button className="btn-premium btn-primary">
          <Icon1 className="w-4 h-4" /> Action
        </button>
      </div>

      {/* Content */}
      <GlassCard className="p-0">
        <Tabs
          tabs={[
            { id: 'tab1', label: 'Tab 1', icon: Icon1 },
            { id: 'tab2', label: 'Tab 2', icon: Icon2 }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="p-10">
          {/* Tab Content */}
        </div>
      </GlassCard>
    </div>
  );
}
```

---

## Questions?

For clarification on any design pattern, refer to existing implementations:
- **Forms**: `app/po/create/page.tsx`
- **Tables**: `app/po/page.tsx`
- **View Pages**: `app/po/view/page.tsx`
- **Navigation**: `components/NavRail.tsx`

**Remember**: Consistency is key. When in doubt, follow existing patterns.
