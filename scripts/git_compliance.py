#!/usr/bin/env python3
import sys
import subprocess
import re
import os

# --- Configuration ---
PROTECTED_BRANCHES = ['main', 'master', 'production']
MAX_FILE_SIZE_MB = 10
FORBIDDEN_PATTERNS = [
    (r'<<<<<<< HEAD', "Merge conflict marker"),
    (r'sk_live_[0-9a-zA-Z]{24}', "Potential Stripe Live Key"),
    (r'xox[baprs]-([0-9a-zA-Z]{10,48})', "Potential Slack Token"),
    (r'-----BEGIN PRIVATE KEY-----', "Private Key detected"),
    (r'NOCOMMIT', "NOCOMMIT marker found")
]

def run_cmd(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout.strip()

def get_current_branch():
    return run_cmd("git rev-parse --abbrev-ref HEAD")

def get_outgoing_files():
    # Helper: Get files that are different from remote
    # usage: git diff --name-only origin/<branch>..HEAD
    branch = get_current_branch()
    # Check if remote branch exists
    remote_exists = run_cmd(f"git ls-remote --heads origin {branch}")
    
    if remote_exists:
        return run_cmd(f"git diff --name-only origin/{branch}..HEAD").splitlines()
    else:
        # New branch, check all files in commit
        # This is strictly for pre-push, checking unpushed commits
        return run_cmd("git diff --name-only origin/main..HEAD").splitlines()

def check_branch_protection():
    branch = get_current_branch()
    if branch in PROTECTED_BRANCHES:
        print(f"❌ VIOLATION: Direct push to protected branch '{branch}' is forbidden.")
        print("   Please create a feature branch and use a Pull Request.")
        return False
    return True

def check_file_size(files):
    violations = []
    for f in files:
        if not os.path.exists(f): continue
        size_mb = os.path.getsize(f) / (1024 * 1024)
        if size_mb > MAX_FILE_SIZE_MB:
            violations.append(f"{f} ({size_mb:.2f} MB)")
    
    if violations:
        print(f"❌ VIOLATION: The following files exceed {MAX_FILE_SIZE_MB}MB Limit:")
        for v in violations:
            print(f"   - {v}")
        return False
    return True

def check_content_patterns(files):
    violations = []
    for f in files:
        if not os.path.exists(f) or os.path.isdir(f): continue
        # Skip checking binaries roughly
        try:
            with open(f, 'r', encoding='utf-8', errors='ignore') as file_content:
                content = file_content.read()
                for pattern, desc in FORBIDDEN_PATTERNS:
                    if re.search(pattern, content):
                        violations.append(f"{f}: {desc}")
        except:
            pass # Skip unreadable files

    if violations:
        print("❌ VIOLATION: Forbidden patterns detected:")
        for v in violations:
            print(f"   - {v}")
        return False
    return True

def main():
    print("🛡️  Running Git Governance Compliance Check...")
    
    passed = True
    
    # 1. Branch Check
    if not check_branch_protection():
        passed = False
        
    # Get outgoing files
    try:
        files = get_outgoing_files()
        if files:
            # 2. Size Check
            if not check_file_size(files):
                passed = False
            
            # 3. Content Check
            if not check_content_patterns(files):
                passed = False
    except Exception as e:
        print(f"⚠️ Warning: Could not fully scan outgoing files: {e}")

    if not passed:
        print("\n⛔ PUSH REJECTED by Governance Policy.")
        sys.exit(1)
        
    print("✅ Governance Checks Passed.")
    sys.exit(0)

if __name__ == "__main__":
    main()
