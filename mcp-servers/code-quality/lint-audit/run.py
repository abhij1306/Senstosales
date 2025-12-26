import subprocess
import json
import sys
import os

def run_lint_audit():
    results = {"frontend": "Pending", "backend": "Pending"}
    
    # 1. Frontend ESLint
    print("Running Frontend ESLint...")
    try:
        # Using local eslint with shared config if available, or just default
        cmd = "npx eslint frontend/ --format json"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        results["frontend"] = "Failed" if result.returncode != 0 else "Passed"
        if result.returncode != 0:
            print("Frontend Lint Issues Found:")
            print(result.stdout[:500] + "..." if len(result.stdout) > 500 else result.stdout)
    except Exception as e:
        results["frontend"] = f"Error: {e}"

    # 2. Backend Ruff
    print("\nRunning Backend Ruff...")
    try:
        cmd = "ruff check backend/"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        results["backend"] = "Failed" if result.returncode != 0 else "Passed"
        if result.returncode != 0:
            print("Backend Lint Issues Found:")
            print(result.stdout[:500] + "..." if len(result.stdout) > 500 else result.stdout)
    except Exception as e:
        results["backend"] = f"Error: {e}"

    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run_lint_audit()
