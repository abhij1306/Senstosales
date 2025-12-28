# DESIGN SYSTEM GOVERNANCE & PERFORMANCE INVARIANTS
> **Authority**: Principal Frontend Systems Architect
> **Mandate**: "Apple-level" consistency + "Google-level" performance
> **Targets**: CLS < 0.05, INP < 100ms

This document serves as the constitution for all frontend design and implementation work.

---

## Phase 1: Design Token Architecture
**Target**: >98% Token Coverage (No hardcoded values)

### 1. Token Hierarchy
- **Global**: Primitive values (e.g., `blue-500`, `font-sans`).
- **Semantic**: Contextual role (e.g., `sys.color.surface.glass`, `sys.type.body.regular`).
- **Component**: Specific overrides (e.g., `comp.card.kpi.bg`).

### 2. Naming Convention
Strict Format: `[category]-[property]-[concept]-[modifier]`
- **Good**: `sys.color.bg.primary`
- **Bad**: `text-blue-500` (Literal)

### 3. Thematic Support
- Tokens must support **Light**, **Dark**, and **High Contrast** modes.
- Manual style hacks bypassing tokens = **Build Error**.

---

## Phase 2: Typographic Rigor
**Target**: Financial Data Scanning Precision

### 1. Tabular Standards
- **Monospaced Numerals**: MANDATORY for all data tables (`font-feature-settings: "tnum"`).
- **Alignment Matrix**:
  - **Left**: Text labels, dates, zip codes, phone numbers.
  - **Right**: Accounting values, quantities, percentages.

### 2. Metric Overrides
- **Font Stack**: Fallback fonts (San Francisco/Inter) must utilize `size-adjust` and `ascent-override` to match web font metrics precisely, eliminating loading jank.

---

## Phase 3: Visual Effects (Glass & Grain)
**Target**: Aesthetic Depth without Performance Cost

### 1. Glassmorphism Safety-Valve
- **Style**: `backdrop-filter: blur(10px)` + `1px semi-transparent border`.
- **Limit**: Max **3 instances** per viewport.
- **Fallback**: Auto-switch to High-Opacity Solid if rendering bottlenecks detected.

### 2. Organic Materiality
- Apply CSS-based **Grain Texture** to glass elements to reduce "sterile" digital look.

### 3. Motion Constraints
- **Properties**: `transform` and `opacity` ONLY.
- **Duration**: Max `300ms`.
- **Tech**: GPU-accelerated layers (`will-change`).

---

## Phase 4: Performance & Stability
**Target**: Structural Resilience

### 1. Layout Stability (CLS < 0.05)
- **Min-Height Wrappers**: Dynamic content containers must reserve space.
- **Media Locking**: All images/video must have explicit aspect ratios.
- **Invariant**: Code modification causing >0.01 CLS shift = **Fail**.

### 2. Rendering Limits
- **Reflow Threshold**: Component mount must trigger ≤ 3 full-page reflows.
- **DOM Depth**: Max **12 levels** deep.
- **Resource Priority**: Above-the-fold assets (Fonts, KPI backgrounds) = `preload` / `fetchpriority="high"`.

---

## Standardized Layout Matrix

| Density | Row Height | Padding | Use Case |
| :--- | :--- | :--- | :--- |
| **Condensed** | 40px | 4px / 8px | High-volume data, Expert views |
| **Regular** | 48px | 8px / 12px | Standard dashboards |
| **Relaxed** | 56px | 12px / 16px | Marketing / Summary |
| **KPI Card** | Auto | 24px - 32px | High-prominence metrics |

---

## Verification Protocol
After every remediation step, the Agent MUST:
1.  **Log CLS Value**: Console output confirming layout stability.
2.  **Audit Tokens**: confirm no new hardcoded values.
3.  **Check Invariants**: Verify DOM depth and Glass limitations.

---

## AI Agent Protocol (New Feature Checklist)
When implementing new pages/components, Agents MUST verify:

1.  [ ] **Performance**: Tables defined *outside* component? Computed values memoized?
2.  [ ] **Structure**: Used `ListPageTemplate` or `DocumentTemplate`? (No scratch layouts).
3.  [ ] **Design**: Header `H1` uppercase? Labels uppercase/tracking-widest?
4.  [ ] **Consistency**: All numbers wrapped in `Accounting` atom?
5.  [ ] **Zero Shift**: `loading={true}` or exact-height Skeletons used?
