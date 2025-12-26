# MCP Audit Servers - Categorized Structure

## Directory Organization

```
mcp-servers/
├── code-quality/           # Code style, linting, formatting
│   ├── lint-audit/         # Python & TypeScript linting
│   └── ui-audit/           # Accessibility, component checks
│
├── data-integrity/         # Database & business logic validation  
│   ├── database-audit/     # Schema, FK, orphaned records
│   ├── business-audit/     # Invoice totals, DC rules
│   └── dedup-db-audit/     # Duplicate database detection
│
├── infrastructure/         # API & system health
│   └── api-audit/          # Endpoint health, response validation
│
└── security/               # Security & vulnerability scanning
    └── security-audit/     # Secret scanning, SQL injection, CORS
```

---

## Category Descriptions

### 1. Code Quality (`code-quality/`)
**Purpose**: Enforce coding standards and best practices

**Servers**:
- **lint-audit**: Python (Ruff, flake8) and TypeScript (ESLint) linting
- **ui-audit**: Accessibility checks, component extraction warnings

**Tools Used**: Ruff, ESLint, Prettier (from mcp-shared)

---

### 2. Data Integrity (`data-integrity/`)
**Purpose**: Validate data consistency and business rules

**Servers**:
- **database-audit**: Schema integrity, foreign keys, accounting invariants
- **business-audit**: Invoice calculations, DC-invoice rules, duplicate numbers
- **dedup-db-audit**: Scan for duplicate database files

**Critical for**: Financial accuracy, data correctness

---

### 3. Infrastructure (`infrastructure/`)
**Purpose**: System health and API functionality

**Servers**:
- **api-audit**: Endpoint availability, response schemas, error handling

**Tools Used**: HTTP requests, response validation

---

### 4. Security (`security/`)
**Purpose**: Identify security vulnerabilities

**Servers**:
- **security-audit**: Secret scanning, SQL injection detection, CORS config

**Tools Used**: Bandit, regex patterns, static analysis

---

## Running Audits by Category

### All Code Quality Checks
```bash
cd mcp-servers/code-quality
python lint-audit/run.py
python ui-audit/run.py
```

### All Data Integrity Checks
```bash
cd mcp-servers/data-integrity
python database-audit/run.py
python business-audit/run.py
python dedup-db-audit/__init__.py ..
```

### All Infrastructure Checks
```bash
cd mcp-servers/infrastructure
python api-audit/run.py
```

### All Security Checks
```bash
cd mcp-servers/security
python security-audit/run.py
bandit -r ../../backend/  # Use shared tool
```

---

## Master Audit Script

Create `mcp-servers/run_all_audits.py`:

```python
#!/usr/bin/env python3
"""Master audit runner - runs all MCP audits by category"""

import subprocess
import json
from pathlib import Path

def run_category_audits(category: str):
    """Run all audits in a category"""
    category_path = Path(__file__).parent / category
    results = {}
    
    for audit_dir in category_path.iterdir():
        if audit_dir.is_dir():
            audit_name = audit_dir.name
            print(f"Running {category}/{audit_name}...")
            
            # Run audit (adjust based on actual implementation)
            # results[audit_name] = run_audit(audit_dir)
    
    return results

def main():
    categories = ["code-quality", "data-integrity", "infrastructure", "security"]
    
    all_results = {}
    for category in categories:
        print(f"\n{'='*60}")
        print(f"CATEGORY: {category.upper()}")
        print(f"{'='*60}")
        all_results[category] = run_category_audits(category)
    
    # Save combined report
    with open("audit_report.json", "w") as f:
        json.dump(all_results, f, indent=2)
    
    print("\n✅ All audits complete. Report saved to audit_report.json")

if __name__ == "__main__":
    main()
```

---

## Benefits of Categorization

1. **Clarity**: Easy to find relevant audits
2. **Maintenance**: Grouped by concern area
3. **Scalability**: Add new audits to appropriate category
4. **Reporting**: Category-based health scores

---

## Future Categories (Optional)

As you add more MCP servers, consider these categories:

### `performance/`
- bundle-size-audit
- lighthouse-audit
- load-time-audit

### `testing/`
- playwright-audit (scraper tests)
- unit-test-coverage
- integration-test-audit

### `documentation/`
- readme-completeness
- api-doc-coverage
- code-comment-ratio

---

**Updated**: 2025-12-26 15:20 IST  
**Structure**: Categorized for clarity and scalability
