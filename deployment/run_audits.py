"""
Audit Orchestrator
Runs all MCP audit servers and generates a comprehensive report
"""
import asyncio
import json
import sys
import importlib.util
from pathlib import Path
from datetime import datetime

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

def import_module_from_path(module_name: str, file_path: Path):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec and spec.loader:
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        return module
    return None

async def run_audit_server(server_name: str) -> dict:
    """Run a single audit server and collect results"""
    print(f"🔍 Running {server_name} audit...")
    
    server_dir = PROJECT_ROOT / "mcp-servers" / f"{server_name}-audit"
    server_file = server_dir / "server.py"
    
    if not server_file.exists():
        return {"error": f"Server file not found: {server_file}"}
        
    try:
        # Import the module safely
        module_name = f"mcp_servers.{server_name}_audit"
        module = import_module_from_path(module_name, server_file)
        
        if not module:
            return {"error": f"Failed to import module {module_name}"}
            
        # Execute audit functions based on server type
        results = {}
        
        if server_name == "database":
            results["schema"] = module.audit_schema()
            results["foreign_keys"] = module.audit_foreign_keys()
            results["orphaned_records"] = module.audit_orphaned_records()
            results["accounting_invariants"] = module.audit_accounting_invariants()
            
        elif server_name == "security":
            results["secrets"] = module.scan_secrets()
            results["sql_injection"] = module.check_sql_injection()
            results["cors"] = module.check_cors()
            
        elif server_name == "business":
             # Check if functions exist (some might be placeholders)
             if hasattr(module, 'check_invoice_totals'):
                 results["invoice_totals"] = module.check_invoice_totals()
             if hasattr(module, 'check_dc_invoice_rule'):
                 results["dc_invoice_rule"] = module.check_dc_invoice_rule()
             if hasattr(module, 'check_duplicate_numbers'):
                 results["duplicate_numbers"] = module.check_duplicate_numbers()

        elif server_name == "api":
            results["health"] = await module.audit_health()
            results["schemas"] = await module.audit_response_schemas()
            
        elif server_name == "lint":
             if hasattr(module, 'check_python_lint'):
                results["python"] = module.check_python_lint()
             if hasattr(module, 'check_typescript_lint'):
                results["typescript"] = module.check_typescript_lint()
             if hasattr(module, 'check_complexity'):
                results["complexity"] = module.check_complexity()

        elif server_name == "ui":
             if hasattr(module, 'check_accessibility'):
                results["accessibility"] = module.check_accessibility()
             if hasattr(module, 'check_components'):
                results["components"] = module.check_components()
                
        return results

    except Exception as e:
        import traceback
        return {"error": f"Failed to run {server_name}: {str(e)}\n{traceback.format_exc()}"}


async def main():
    """Run all audits and generate report"""
    print("=" * 60)
    print("🔍 SenstoSales ERP - Automated Audit Suite")
    print("=" * 60)
    print()
    
    servers = ["database", "security", "business", "api", "lint", "ui"]
    results = {}
    
    for server in servers:
        results[server] = await run_audit_server(server)
        print(f"  ✅ {server} completed")
        print()
    
    # Calculate summary
    total_checks = 0
    failed_checks = 0
    warnings = 0
    
    for server_name, server_results in results.items():
        if "error" in server_results:
            failed_checks += 1
            continue
            
        for check_name, check_result in server_results.items():
            if isinstance(check_result, dict):
                total_checks += 1
                status = check_result.get("status")
                if status == "fail":
                    failed_checks += 1
                elif status == "warning":
                    warnings += 1
    
    # Generate report
    report = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total_checks": total_checks,
            "passed": total_checks - failed_checks - warnings,
            "failed": failed_checks,
            "warnings": warnings,
            "overall_status": "PASS" if failed_checks == 0 else "FAIL"
        },
        "audits": results
    }
    
    # Save report
    report_file = PROJECT_ROOT / "audit_report.json"
    report_file.write_text(json.dumps(report, indent=2))
    
    # Print summary
    print("=" * 60)
    print("📊 AUDIT SUMMARY")
    print("=" * 60)
    print(f"Total Checks: {total_checks}")
    print(f"✅ Passed: {report['summary']['passed']}")
    print(f"⚠️  Warnings: {warnings}")
    print(f"❌ Failed: {failed_checks}")
    print()
    print(f"Overall Status: {report['summary']['overall_status']}")
    print(f"\nDetailed report saved to: {report_file}")
    print("=" * 60)
    
    # Exit with error code if any failures
    return 1 if failed_checks > 0 else 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
