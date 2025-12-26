# Troubleshooting Guide - Frontend Issues

## Quick Diagnostic Checklist

When experiencing frontend issues, run through this checklist:

- [ ] Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
- [ ] Clear `.next` cache: `Remove-Item -Recurse -Force .next`
- [ ] Check browser console for errors (F12 → Console)
- [ ] Verify backend is running (`localhost:8000`)
- [ ] Check Next.js dev server is running (`localhost:3000`)

---

## Common Issues & Solutions

### 1. Pagination Not Working

#### Symptoms
- Pagination controls visible but clicking does nothing
- All rows displayed regardless of page
- Page number changes but data doesn't

#### Diagnosis
```tsx
// Check 1: Page has pagination state?
const [page, setPage] = useState(1);
const [pageSize] = useState(10);

// Check 2: Props wired to template?
<ListPageTemplate
  page={page}                                    // ✓
  pageSize={pageSize}                            // ✓
  totalItems={filteredData.length}               // ✓
  onPageChange={(newPage) => setPage(newPage)}  // ✓
/>

// Check 3: DataTable slicing logic correct?
// Should be: if (!totalItems || totalItems === data.length)
```

#### Solutions

**Missing State**:
```tsx
// Add at top of page component
const [page, setPage] = useState(1);
const [pageSize] = useState(10);
```

**Props Not Wired**:
```tsx
// Add to ListPageTemplate call
page={page}
pageSize={pageSize}
totalItems={filteredData.length}
onPageChange={(newPage) => setPage(newPage)}
```

**DataTable Slicing Bug**:
```tsx
// In DataTable.tsx processedData useMemo
// WRONG: if (!totalItems)
// RIGHT: if (!totalItems || totalItems === data.length)
```

---

### 2. Table Not Showing Data / Invisible Rows

#### Symptoms
- Data loads (console/network shows it)
- Pagination controls visible
- Table appears empty or rows invisible

#### Diagnosis
```bash
# Open browser DevTools (F12)
# Elements tab → Inspect table
# Check if <tr> elements exist in DOM
# If yes: CSS issue
# If no: Rendering issue
```

#### Solutions

**CSS Hiding Content**:
```tsx
// Add inline styles to override CSS
<div className="overflow-x-auto" style={{ minHeight: '200px', display: 'block' }}>
  <table className="w-full" style={{ display: 'table' }}>
```

**React Key Errors**:
```bash
# Check console for "Duplicate key" warnings
# Fix: Ensure unique_id is generated for all rows
```

**Empty processedData**:
```tsx
// Add debug logging in DataTable
console.log('[DataTable] processedData:', processedData.length);
console.log('[DataTable] data prop:', data.length);
// If processedData is 0 but data is >0: check filtering/sorting logic
```

---

### 3. Search Input Laggy / Typing Stutters

#### Symptoms
- Typing feels slow
- Characters appear delayed
- App freezes briefly on each keystroke

#### Cause
Search triggers immediate filtering → massive re-renders

#### Solution

**Add Debouncing**:
```tsx
import { useDebouncedValue } from '@/lib/hooks/useDebounce';

const [searchQuery, setSearchQuery] = useState("");
const debouncedSearch = useDebouncedValue(searchQuery, 300);

// Use debouncedSearch for filtering, not searchQuery
const filtered = data.filter(item => 
  item.name.includes(debouncedSearch) // ← Use debounced value
);
```

**Use SearchBar Molecule** (has built-in debounce):
```tsx
import { SearchBar } from '@/components/design-system/molecules/SearchBar';

<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search..."
/>
```

---

### 4. Excessive Re-renders / Performance Issues

#### Symptoms
- App feels sluggish
- Navigation lags
- Console shows many renders (React DevTools Profiler)

#### Diagnosis
```bash
# Install React DevTools extension
# Profiler tab → Record (●)
# Perform action (navigate, search, etc.)# Stop recording
# Check flamegraph for:
#   - Components rendering multiple times
#   - Long render durations
#   - Cascading re-renders
```

#### Solutions

**Component Not Memoized**:
```tsx
// Atom/Molecule components should be memoized
const ComponentInternal = (props) => { ... };
export const Component = React.memo(ComponentInternal);
```

**Event Handler Creating New Instance**:
```tsx
// WRONG
<DataTable onPageChange={(page) => setPage(page)} />

// RIGHT
const handlePageChange = useCallback((page: number) => {
  setPage(page);
}, []);
<DataTable onPageChange={handlePageChange} />
```

**Missing useMemo for Expensive Computation**:
```tsx
// Wrap filtering/sorting in useMemo
const filteredData = useMemo(() => {
  return data.filter(...).sort(...);
}, [data, searchQuery, sortKey]);
```

---

### 5. Duplicate Key Warnings

#### Symptoms
```
Warning: Each child in a list should have a unique "key" prop.
Warning: Encountered two children with the same key...
```

#### Cause
- Using array index as key
- Data items lack unique identifier
- keyField prop incorrect

#### Solutions

**Generate Unique IDs**:
```tsx
const dataWithKeys = rawData.map((item, index) => ({
  ...item,
  unique_id: item.natural_key || `${tab}-${index}-${Math.random().toString(36).substr(2, 9)}`
}));
```

**Set Correct keyField**:
```tsx
<DataTable
  keyField="unique_id"  // Must match field name in data
  data={dataWithKeys}
/>
```

**Never Use Index**:
```tsx
// ❌ NEVER DO THIS
{items.map((item, index) => <Row key={index} />)}

// ✅ ALWAYS DO THIS
{items.map((item) => <Row key={item.unique_id} />)}
```

---

### 6. Build Errors (Next.js)

#### Error: `Export 'X' does not exist in target module`

**Cause**: Component exported incorrectly after memoization

**Example**:
```bash
Export 'Accounting' doesn't exist in target module
```

**Fix**:
```tsx
// In Typography.tsx (or similar)
const AccountingInternal = (props) => { ... };
export const Accounting = React.memo(AccountingInternal); // ← Make sure this line exists
```

#### Error: `Cannot find module '@/hooks/useDebounce'`

**Cause**: Hook file doesn't exist or incorrect import path

**Fix**:
```bash
# Create hook if missing
# File: frontend/hooks/useDebounce.ts
```

```tsx
// Correct import
import { useDebounce } from '@/hooks/useDebounce';
```

---

### 7. Data Not Updating After Navigation

#### Symptoms
- Navigate to page
- Old data still showing
- Refresh fixes it

#### Cause
- Missing dependency in useEffect
- State not reset on navigation
- Data fetching not triggered

#### Solutions

**Add Router to Dependencies**:
```tsx
import { useRouter } from 'next/navigation';

useEffect(() => {
  loadData();
}, []); // ← Missing router.asPath or similar
```

**Reset State on Tab Change**:
```tsx
useEffect(() => {
  setPage(1); // Reset pagination when tab changes
  loadData();
}, [activeTab]);
```

**Clear Old Data Before Loading**:
```tsx
const loadData = async () => {
  setLoading(true);
  setData([]); // ← Clear old data
  const newData = await api.fetchData();
  setData(newData);
  setLoading(false);
};
```

---

### 8. Hydration Errors

#### Error:
```
Error: Text content does not match server-rendered HTML.
Warning: Expected server HTML to contain a matching <div> in <div>.
```

#### Causes
- Using Date.now() or Math.random() in render
- Conditional rendering based on window/localStorage
- Browser-only APIs during SSR

#### Solutions

**Suppress Hydration Warning** (use sparingly):
```tsx
<html suppressHydrationWarning>
```

**Use useEffect for Browser-Only Logic**:
```tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null; // Skip server-side render

return <div>{window.location.href}</div>; // Now safe
```

**Avoid Random Values in Render**:
```tsx
// ❌ WRONG - will be different on server vs client
const id = Math.random();

// ✅ RIGHT - stable value
const id = useMemo(() => Math.random(), []);
```

---

### 9. SearchBar Not Debouncing

#### Symptoms
- Using new SearchBar component
- Still experiencing lag on typing
- Every keystroke triggers filter

#### Diagnosis
```tsx
// Check if parent is using the debounced value correctly
<SearchBar value={query} onChange={setQuery} />

// Parent should just use query directly
// SearchBar handles debouncing internally
const filtered = data.filter(item => item.name.includes(query));
```

#### Solution
SearchBar manages its own debouncing - **just use the value directly**:

```tsx
const [searchQuery, setSearchQuery] = useState("");

<SearchBar value={searchQuery} onChange={setSearchQuery} />

// Use searchQuery directly (it's already debounced)
const filtered = useMemo(() => {
  return data.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [data, searchQuery]); // searchQuery is debounced internally
```

---

### 10. Flicker on Navigation

#### Symptoms
- Page flickers when navigating
- Sidebar briefly disappears
- Content jumps

#### Causes
- Layout remounting
- Multiple RootLayout files
- CSS transitions on mount

#### Solutions

**Verify Single RootLayout**:
```bash
# Should only have ONE layout.tsx
find frontend/app -name "layout.tsx"
# Output should be: frontend/app/layout.tsx (only one!)
```

**Check for usePathname in Client Component**:
```tsx
// RootLayout should be client component if using hooks
"use client";
import { usePathname } from 'next/navigation';
```

**Sidebar Persistence**:
```tsx
// Sidebar should be in RootLayout, not individual pages
export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <SidebarNav /> {/* ← Persists across navigation */}
        <main>{children}</main>
      </body>
    </html>
  );
}
```

---

## Debug Tools & Commands

### React DevTools Profiler
```bash
# Install extension
# Chrome: https://chrome.google.com/webstore React Developer Tools
# Firefox: https://addons.mozilla.org/firefox React DevTools

# Usage:
# 1. Open DevTools (F12)
# 2. Profiler tab
# 3. Click record (●)
# 4. Perform action
# 5. Stop recording
# 6. Analyze flamegraph
```

### Next.js Build Analysis
```bash
# Production build to check bundle size
cd frontend
npm run build

# Shows which components are client vs server
# Large client bundles = more memoization needed
```

### Browser Performance Tab
```bash
# Chrome DevTools → Performance tab
# Record page load or interaction
# Look for:
#   - Long tasks (>50ms)
#   - Forced reflows
#   - Excessive style recalculations
```

---

## Emergency Fixes

### Nuclear Option: Clear Everything
```bash
# Frontend
cd frontend
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
npm install
npm run dev

# Backend
cd backend
deactivate  # if in venv
Remove-Item -Recurse -Force __pycache__
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Verify Component Exports
```tsx
// In design-system/index.ts
export { Button } from './atoms/Button';
export { Accounting } from './atoms/Typography';
// etc.

// Reimport in page
import { Button, Accounting } from '@/components/design-system';
```

---

## Getting Help

### Check These First
1. **Console Errors**: F12 → Console tab
2. **Network Tab**: F12 → Network (failed API calls?)
3. **React DevTools**: Components tab (inspect props/state)
4. **This Guide**: Search for your symptom above

### Common Error Messages & Fixes

| Error | Likely Cause | Fix |
|-------|--------------|-----|
| `Cannot find module` | Missing import or file | Check import path, create file |
| `X is not a function` | Wrong export/import | Verify export type (default vs named) |
| `undefined is not an object` | Missing null check | Add `?.` or `item || fallback` |
| `Maximum update depth exceeded` | setState in render | Move to useEffect or event handler |
| `Hydration failed` | SSR mismatch | Add suppressHydrationWarning or fix logic |

---

## Related Documentation

- [Frontend Architecture](./FRONTEND_ARCHITECTURE.md)
- [Performance Guide](./PERFORMANCE.md)
- [API Reference](./API_REFERENCE.md)

---

**Last Updated**: 2025-12-26  
**Version**: 3.3.0
