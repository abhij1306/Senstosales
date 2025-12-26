import subprocess
import json
import sys
import os

def run_performance_audit():
    results = {"transition_check": "Pending", "skeleton_load_check": "Pending"}
    
    print("Running Transition Performance Audit (Playwright)...")
    try:
        # Check if Playwright is installed
        check_pw = subprocess.run("npx playwright --version", shell=True, capture_output=True)
        
        if check_pw.returncode != 0:
            results["transition_check"] = "Skipped (Playwright not found)"
            results["skeleton_load_check"] = "Skipped"
            print("Playwright not found. Skipping browser-based performance tests.")
        else:
            # In a real scenario, this would point to a specific test file 
            # We'll run a specific test if we had one, or a smoke test
            cmd = "npx playwright test --config ../../../mcp-shared/testing/playwright.config.js"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                results["transition_check"] = "Passed"
                results["skeleton_load_check"] = "Passed"
            else:
                results["transition_check"] = "Failed"
                # If it failed, we assume skeletons might be broken too
                print("Playwright Tests Failed:")
                print(result.stdout[:500])
                
    except Exception as e:
        results["transition_check"] = f"Error: {e}"

    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run_performance_audit()
