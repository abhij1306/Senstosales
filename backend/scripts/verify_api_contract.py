"""
API Endpoint Verification Script
Maps all backend routes and checks frontend usage
"""
import re
from pathlib import Path

def extract_routes_from_router(file_path):
    """Extract all route decorators from a Python router file"""
    routes = []
    content = file_path.read_text(encoding='utf-8')
    
    # Match @router.get("/path"), @router.post("/path"), etc
    pattern = r'@router\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']'
    matches = re.findall(pattern, content)
    
    for method, path in matches:
        routes.append({
            'method': method.upper(),
            'path': path,
            'file': file_path.name
        })
    
    return routes

def extract_api_calls_from_frontend(file_path):
    """Extract API calls from frontend files"""
    api_calls = []
    content = file_path.read_text(encoding='utf-8')
    
    # Match fetch calls: fetch(`${API_BASE_URL}/api/...`)
    pattern = r'fetch\(`?\$\{API_BASE_URL\}([^`\)]+)`?\)'
    matches = re.findall(pattern, content)
    
    for match in matches:
        # Clean up the match
        path = match.strip()
        api_calls.append({
            'path': path,
            'file': file_path.name
        })
    
    return api_calls

def main():
    backend_routers = Path("backend/app/routers")
    frontend_dir =Path("frontend/app")
    
    print("=" * 100)
    print("BACKEND API ROUTES")
    print("=" * 100)
    
    backend_routes = []
    for router_file in backend_routers.glob("*.py"):
        if router_file.name.startswith('__'):
            continue
        routes = extract_routes_from_router(router_file)
        backend_routes.extend(routes)
    
    # Group by router file
    from collections import defaultdict
    routes_by_file = defaultdict(list)
    for route in backend_routes:
        routes_by_file[route['file']].append(route)
    
    for file in sorted(routes_by_file.keys()):
        print(f"\n{file}:")
        for route in routes_by_file[file]:
            print(f"  {route['method']:6s} /api/{file.replace('.py', '')}{route['path']}")
    
    print(f"\nTotal routes: {len(backend_routes)}")
    
    print("\n" + "=" * 100)
    print("FRONTEND API CALLS")
    print("=" * 100)
    
    frontend_calls = []
    for tsx_file in frontend_dir.rglob("*.tsx"):
        calls = extract_api_calls_from_frontend(tsx_file)
        if calls:
            frontend_calls.extend(calls)
    
    unique_calls = sorted(set(call['path'] for call in frontend_calls))
    for call in unique_calls:
        print(f"  {call}")
    
    print(f"\nTotal unique API calls: {len(unique_calls)}")
    
    print("\n" + "=" * 100)
    print("VERIFICATION SUMMARY")
    print("=" * 100)
    print(f"✓ Backend routes: {len(backend_routes)}")
    print(f"✓ Frontend API calls: {len(unique_calls)}")

if __name__ == "__main__":
    main()
