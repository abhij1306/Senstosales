#!/usr/bin/env python3
import subprocess
import json
import os
import sys
from pathlib import Path

# Audit Registry
AUDITS = [
    {
        "name": "lint-audit",
        "category": "code-quality",
        "path": "code-quality/lint-audit/run.py"
    },
    {
        "name": "transition-audit",
        "category": "performance",
        "path": "performance/transition-audit/run.py"
    },
    # Add business-audit if we fix its run.py
]

def run_all():
    cwd = Path(__file__).parent
    files = list(cwd.rglob("run.py"))
    
    final_report = {}

    print(f"🔍 Found {len(AUDITS)} registered critical audits.\n")

    for audit in AUDITS:
        name = audit["name"]
        category = audit["category"]
        script_path = cwd / audit["path"]
        
        print(f"🚀 Running {category}/{name}...")
        
        if not script_path.exists():
            print(f"❌ Script not found: {script_path}")
            final_report[name] = {"status": "Missing", "error": "Script file missing"}
            continue

        try:
            # Execute the python script
            result = subprocess.run(
                [sys.executable, str(script_path)],
                cwd=cwd,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print(f"✅ {name} Completed Successfully")
                # Try to parse JSON output if script prints it
                try:
                    output_json = json.loads(result.stdout.strip().split('\n')[-1])
                    final_report[name] = {"status": "Passed", "details": output_json}
                except:
                    final_report[name] = {"status": "Passed", "output": result.stdout[:200]}
            else:
                print(f"⚠️ {name} Failed")
                final_report[name] = {"status": "Failed", "error": result.stderr[:500]}
                
        except Exception as e:
            print(f"❌ Execution Error: {e}")
            final_report[name] = {"status": "Error", "error": str(e)}
            
        print("-" * 40)

    # Save Report
    report_path = cwd / "critical_audit_report.json"
    with open(report_path, "w") as f:
        json.dump(final_report, f, indent=2)
    
    print(f"\n📄 Consolidated Report saved to: {report_path}")
    print(json.dumps(final_report, indent=2))

if __name__ == "__main__":
    run_all()
