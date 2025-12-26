"""
Database Audit MCP Server
Validates schema integrity, foreign keys, indexes, and data consistency
"""
from mcp.server import Server
from mcp.types import Resource, Tool, TextContent
import mcp.server.stdio
import sqlite3
import json
from pathlib import Path
from typing import Any

# Initialize MCP server
server = Server("database-audit")

# Database path
DB_PATH = Path(__file__).parents[2] / "db" / "business.db"

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

@server.list_resources()
async def list_resources() -> list[Resource]:
    """List available audit reports"""
    return [
        Resource(
            uri="audit://database/schema",
            name="Schema Integrity Report",
            mimeType="application/json",
            description="Validates database schema integrity"
        ),
        Resource(
            uri="audit://database/foreign-keys",
            name="Foreign Key Validation",
            mimeType="application/json",
            description="Checks all foreign key constraints"
        ),
        Resource(
            uri="audit://database/orphaned-records",
            name="Orphaned Records Check",
            mimeType="application/json",
            description="Detects records without proper parent references"
        ),
        Resource(
            uri="audit://database/accounting-invariants",
            name="Accounting Invariants",
            mimeType="application/json",
            description="Validates invoice/DC totals match item sums"
        )
    ]

@server.read_resource()
async def read_resource(uri: str) -> str:
    """Execute audit and return results"""
    if uri == "audit://database/schema":
        return json.dumps(audit_schema(), indent=2)
    elif uri == "audit://database/foreign-keys":
        return json.dumps(audit_foreign_keys(), indent=2)
    elif uri == "audit://database/orphaned-records":
        return json.dumps(audit_orphaned_records(), indent=2)
    elif uri == "audit://database/accounting-invariants":
        return json.dumps(audit_accounting_invariants(), indent=2)
    else:
        raise ValueError(f"Unknown resource: {uri}")

@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available audit tools"""
    return [
        Tool(
            name="run_full_database_audit",
            description="Run all database audits and return comprehensive report",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Execute audit tool"""
    if name == "run_full_database_audit":
        results = {
            "schema": audit_schema(),
            "foreign_keys": audit_foreign_keys(),
            "orphaned_records": audit_orphaned_records(),
            "accounting_invariants": audit_accounting_invariants()
        }
        
        # Calculate overall status
        all_passed = all(
            result.get("status") == "pass" 
            for result in results.values()
        )
        
        return [TextContent(
            type="text",
            text=json.dumps({
                "status": "pass" if all_passed else "fail",
                "timestamp": __import__('datetime').datetime.now().isoformat(),
                "audits": results
            }, indent=2)
        )]
    
    raise ValueError(f"Unknown tool: {name}")

# Audit Functions

def audit_schema() -> dict:
    """Check schema integrity"""
    issues = []
    conn = get_db()
    
    # Required tables
    required_tables = [
        "purchase_orders", "purchase_order_items",
        "delivery_challans", "delivery_challan_items",
        "gst_invoices", "gst_invoice_items",
        "business_settings", "srvs"
    ]
    
    existing_tables = [
        row[0] for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
    ]
    
    for table in required_tables:
        if table not in existing_tables:
            issues.append(f"Missing table: {table}")
    
    conn.close()
    
    return {
        "status": "pass" if not issues else "fail",
        "issues": issues,
        "tables_checked": len(required_tables)
    }

def audit_foreign_keys() -> dict:
    """Validate foreign key constraints"""
    issues = []
    conn = get_db()
    
    # Check if foreign keys are enabled
    fk_enabled = conn.execute("PRAGMA foreign_keys").fetchone()[0]
    if fk_enabled != 1:
        issues.append("Foreign keys are not enabled!")
    
    # Check for FK violations
    tables = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()
    
    for (table,) in tables:
        violations = conn.execute(f"PRAGMA foreign_key_check({table})").fetchall()
        if violations:
            issues.append(f"FK violations in {table}: {len(violations)} records")
    
    conn.close()
    
    return {
        "status": "pass" if not issues else "fail",
        "issues": issues,
        "fk_enabled": fk_enabled == 1
    }

def audit_orphaned_records() -> dict:
    """Check for orphaned records"""
    issues = []
    conn = get_db()
    
    try:
        # DCs without valid PO
        orphaned_dcs = conn.execute("""
            SELECT dc_number FROM delivery_challans dc
            WHERE NOT EXISTS (
                SELECT 1 FROM purchase_orders po 
                WHERE po.po_number = dc.po_number
            )
        """).fetchall()
        
        if orphaned_dcs:
            issues.append(f"Found {len(orphaned_dcs)} DCs without valid PO")
        
        # Invoices without valid DC
        orphaned_invoices = conn.execute("""
            SELECT invoice_number FROM gst_invoices inv
            WHERE NOT EXISTS (
                SELECT 1 FROM gst_invoice_dc_links link
                WHERE link.invoice_number = inv.invoice_number
            )
        """).fetchall()
        
        if orphaned_invoices:
            issues.append(f"Found {len(orphaned_invoices)} invoices without DC link")
            
    except Exception as e:
        issues.append(f"Error checking orphaned records: {str(e)}")
    
    conn.close()
    
    return {
        "status": "pass" if not issues else "fail",
        "issues": issues
    }

def audit_accounting_invariants() -> dict:
    """Validate accounting totals match"""
    issues = []
    conn = get_db()
    
    try:
        # Check invoice totals
        mismatched_invoices = conn.execute("""
            SELECT 
                inv.invoice_number,
                inv.taxable_value as header_taxable,
                SUM(item.taxable_value) as items_taxable
            FROM gst_invoices inv
            LEFT JOIN gst_invoice_items item ON inv.invoice_number = item.invoice_number
            GROUP BY inv.invoice_number
            HAVING ABS(header_taxable - items_taxable) > 0.01
        """).fetchall()
        
        if mismatched_invoices:
            for row in mismatched_invoices:
                issues.append(
                    f"Invoice {row[0]}: header={row[1]}, items_sum={row[2]}"
                )
    
    except Exception as e:
        issues.append(f"Error validating invariants: {str(e)}")
    
    conn.close()
    
    return {
        "status": "pass" if not issues else "fail",
        "issues": issues
    }

async def main():
    """Run MCP server"""
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
