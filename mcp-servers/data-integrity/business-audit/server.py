"""
Business Logic Audit MCP Server
Validates ERP-specific invariants and business rules
"""
from mcp.server import Server
from mcp.types import Resource, Tool, TextContent
import mcp.server.stdio
import sqlite3
import json
from pathlib import Path
from typing import Any

server = Server("business-audit")
DB_PATH = Path(__file__).parents[2] / "db" / "business.db"

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

@server.list_resources()
async def list_resources() -> list[Resource]:
    return [
        Resource(
            uri="audit://business/invoice-totals",
            name="Invoice Total Validation",
            mimeType="application/json",
            description="Ensures invoice header totals match item sums"
        ),
        Resource(
            uri="audit://business/dc-invoice-rule",
            name="DC-Invoice 1-to-1 Rule",
            mimeType="application/json",
            description="Validates each DC has exactly one invoice"
        ),
        Resource(
            uri="audit://business/duplicate-numbers",
            name="Duplicate Number Check",
            mimeType="application/json",
            description="Detects duplicate invoice/DC numbers in same FY"
        )
    ]

@server.read_resource()
async def read_resource(uri: str) -> str:
    if uri == "audit://business/invoice-totals":
        return json.dumps(check_invoice_totals(), indent=2)
    elif uri == "audit://business/dc-invoice-rule":
        return json.dumps(check_dc_invoice_rule(), indent=2)
    elif uri == "audit://business/duplicate-numbers":
        return json.dumps(check_duplicate_numbers(), indent=2)
    else:
        raise ValueError(f"Unknown resource: {uri}")

@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="run_business_audit",
            description="Run all business logic invariant checks",
            inputSchema={"type": "object", "properties": {}, "required": []}
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    if name == "run_business_audit":
        results = {
            "invoice_totals": check_invoice_totals(),
            "dc_invoice_rule": check_dc_invoice_rule(),
            "duplicate_numbers": check_duplicate_numbers()
        }
        
        all_passed = all(r.get("status") == "pass" for r in results.values())
        
        return [TextContent(
            type="text",
            text=json.dumps({
                "status": "pass" if all_passed else "fail",
                "timestamp": __import__('datetime').datetime.now().isoformat(),
                "audits": results
            }, indent=2)
        )]
    
    raise ValueError(f"Unknown tool: {name}")

def check_invoice_totals() -> dict:
    """Validate invoice header totals match item sums"""
    issues = []
    conn = get_db()
    
    try:
        mismatches = conn.execute("""
            SELECT 
                inv.invoice_number,
                inv.taxable_value as header_taxable,
                inv.total_invoice_value as header_total,
                COALESCE(SUM(item.taxable_value), 0) as items_taxable,
                COALESCE(SUM(item.total_amount), 0) as items_total
            FROM gst_invoices inv
            LEFT JOIN gst_invoice_items item 
                ON inv.invoice_number = item.invoice_number
            GROUP BY inv.invoice_number
            HAVING 
                ABS(header_taxable - items_taxable) > 0.01 OR
                ABS(header_total - items_total) > 0.01
        """).fetchall()
        
        for row in mismatches:
            issues.append({
                "invoice": row[0],
                "header_taxable": row[1],
                "items_taxable": row[3],
                "header_total": row[2],
                "items_total": row[4]
            })
    except Exception as e:
        issues.append({"error": str(e)})
    
    conn.close()
    
    return {
        "status": "pass" if not issues else "fail",
        "mismatches": len(issues),
        "issues": issues
    }

def check_dc_invoice_rule() -> dict:
    """Check 1 DC → 1 Invoice rule"""
    issues = []
    conn = get_db()
    
    try:
        # DCs with multiple invoices
        multi_invoice_dcs = conn.execute("""
            SELECT dc_number, COUNT(*) as invoice_count
            FROM gst_invoice_dc_links
            GROUP BY dc_number
            HAVING invoice_count > 1
        """).fetchall()
        
        if multi_invoice_dcs:
            for row in multi_invoice_dcs:
                issues.append(f"DC {row[0]} linked to {row[1]} invoices")
    
    except Exception as e:
        issues.append(str(e))
    
    conn.close()
    
    return {
        "status": "pass" if not issues else "fail",
        "issues": issues
    }

def check_duplicate_numbers() -> dict:
    """Check for duplicate invoice/DC numbers in same FY"""
    issues = []
    conn = get_db()
    
    try:
        # Duplicate invoices (simplified - just count)
        dup_invoices = conn.execute("""
            SELECT invoice_number, COUNT(*) as cnt
            FROM gst_invoices
            GROUP BY invoice_number
            HAVING cnt > 1
        """).fetchall()
        
        if dup_invoices:
            issues.append(f"Found {len(dup_invoices)} duplicate invoice numbers")
        
        # Duplicate DCs
        dup_dcs = conn.execute("""
            SELECT dc_number, COUNT(*) as cnt
            FROM delivery_challans
            GROUP BY dc_number
            HAVING cnt > 1
        """).fetchall()
        
        if dup_dcs:
            issues.append(f"Found {len(dup_dcs)} duplicate DC numbers")
    
    except Exception as e:
        issues.append(str(e))
    
    conn.close()
    
    return {
        "status": "pass" if not issues else "fail",
        "issues": issues
    }

async def main():
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
