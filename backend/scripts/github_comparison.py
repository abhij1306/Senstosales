"""
GitHub Comparison Script
Compares current working directory with last committed state (HEAD)
Identifies all changes, deletions, and additions
"""

import subprocess
from pathlib import Path
from collections import defaultdict


def run_git_command(cmd):
    """Execute git command and return output"""
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, cwd=Path(__file__).parent.parent.parent
        )
        return result.stdout.strip()
    except Exception as e:
        print(f"Error running git command: {e}")
        return ""


def get_git_status():
    """Get current git status"""
    return run_git_command(["git", "status", "--short"])


def get_deleted_files():
    """List all deleted files compared to HEAD"""
    output = run_git_command(
        ["git", "diff", "--name-status", "--diff-filter=D", "HEAD"]
    )
    if not output:
        return []
    return [line.split("\t", 1)[1] for line in output.split("\n") if line]


def get_modified_files():
    """List all modified files compared to HEAD"""
    output = run_git_command(
        ["git", "diff", "--name-status", "--diff-filter=M", "HEAD"]
    )
    if not output:
        return []
    return [line.split("\t", 1)[1] for line in output.split("\n") if line]


def get_added_files():
    """List all new files (untracked)"""
    output = run_git_command(["git", "ls-files", "--others", "--exclude-standard"])
    if not output:
        return []
    return output.split("\n")


def get_diff_stats():
    """Get diff statistics"""
    return run_git_command(["git", "diff", "--stat", "HEAD"])


def categorize_files(files):
    """Categorize files by type"""
    categories = defaultdict(list)
    for file in files:
        if "backend/" in file:
            if "/routers/" in file:
                categories["Backend Routers"].append(file)
            elif "/services/" in file:
                categories["Backend Services"].append(file)
            elif "/models.py" in file or "/db.py" in file or "config.py" in file:
                categories["Backend Core"].append(file)
            else:
                categories["Backend Other"].append(file)
        elif "frontend/" in file:
            if "/components/" in file:
                categories["Frontend Components"].append(file)
            elif "/app/" in file:
                categories["Frontend Pages"].append(file)
            else:
                categories["Frontend Other"].append(file)
        elif "migrations/" in file:
            categories["Database Migrations"].append(file)
        elif "docs/" in file:
            categories["Documentation"].append(file)
        elif file.endswith(".py") and not file.startswith("backend/"):
            categories["Root Scripts"].append(file)
        else:
            categories["Other"].append(file)
    return categories


def main():
    print("=" * 100)
    print("GITHUB COMPARISON REPORT - Current vs HEAD (ad2b008)")
    print("=" * 100)

    # Get last commit info
    last_commit = run_git_command(["git", "log", "-1", "--oneline"])
    print(f"\nLast Commit: {last_commit}")

    # Deleted files
    deleted = get_deleted_files()
    print(f"\n{'=' * 100}")
    print(f"DELETED FILES ({len(deleted)} total)")
    print("=" * 100)

    deleted_cats = categorize_files(deleted)
    for category, files in sorted(deleted_cats.items()):
        print(f"\n{category} ({len(files)}):")
        for f in sorted(files):
            print(f"  - {f}")

    # Modified files
    modified = get_modified_files()
    print(f"\n{'=' * 100}")
    print(f"MODIFIED FILES ({len(modified)} total)")
    print("=" * 100)

    modified_cats = categorize_files(modified)
    for category, files in sorted(modified_cats.items()):
        print(f"\n{category} ({len(files)}):")
        for f in sorted(files):
            print(f"  - {f}")

    # New files (untracked)
    added = get_added_files()
    print(f"\n{'=' * 100}")
    print(f"NEW FILES - Untracked ({len(added)} total)")
    print("=" * 100)

    added_cats = categorize_files(added)
    for category, files in sorted(added_cats.items()):
        print(f"\n{category} ({len(files)}):")
        for f in sorted(files):
            print(f"  - {f}")

    # Summary statistics
    print(f"\n{'=' * 100}")
    print("SUMMARY STATISTICS")
    print("=" * 100)
    print(f"Deleted:  {len(deleted):3d} files")
    print(f"Modified: {len(modified):3d} files")
    print(f"New:      {len(added):3d} files")
    print(f"Total:    {len(deleted) + len(modified) + len(added):3d} changes")

    # Diff stats
    print(f"\n{'=' * 100}")
    print("DIFF STATISTICS")
    print("=" * 100)
    diff_stats = get_diff_stats()
    if diff_stats:
        print(diff_stats)
    else:
        print("No diff statistics available")

    print(f"\n{'=' * 100}")
    print("REGRESSION ANALYSIS")
    print("=" * 100)

    # Critical changes to flag
    critical_changes = []

    # Check database path changes
    if "backend/app/db.py" in modified:
        critical_changes.append("⚠️  Database path configuration modified (db.py)")

    # Check SRV routing
    if "frontend/app/srv/view/page.tsx" in deleted:
        critical_changes.append("⚠️  SRV view page deleted - verify [id] route exists")

    # Check for missing routers
    deleted_routers = [f for f in deleted if "routers/" in f]
    if deleted_routers:
        critical_changes.append(
            f"⚠️  {len(deleted_routers)} routers deleted - verify imports"
        )

    # New migrations
    new_migrations = [f for f in added if "migrations/" in f and f.endswith(".sql")]
    if new_migrations:
        critical_changes.append(
            f"✓ {len(new_migrations)} new migrations detected (expected)"
        )

    if critical_changes:
        for change in critical_changes:
            print(f"  {change}")
    else:
        print("  ✓ No critical regressions detected")

    print(f"\n{'=' * 100}")
    print("✓ Comparison complete")
    print("=" * 100)


if __name__ == "__main__":
    main()
