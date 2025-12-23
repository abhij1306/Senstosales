import os
import shutil
import subprocess
import sys

def run_command(command, cwd=None):
    print(f"Running: {command}")
    try:
        subprocess.check_call(command, shell=True, cwd=cwd)
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        sys.exit(1)

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    backend_dir = os.path.join(root_dir, "backend")
    frontend_out = os.path.join(frontend_dir, "out")
    backend_static = os.path.join(backend_dir, "static")
    
    print(f"Root Directory: {root_dir}")
    
    # 1. Check if frontend/out exists
    if not os.path.exists(frontend_out):
        print("Frontend 'out' directory not found. Building frontend...")
        run_command("npm run build", cwd=frontend_dir)
    else:
        print("Frontend 'out' directory found. Skipping build (delete 'out' to force rebuild).")

    # 2. Sync Static Files
    print(f"Syncing static files from {frontend_out} to {backend_static}...")
    if os.path.exists(backend_static):
        shutil.rmtree(backend_static)
        
    shutil.copytree(frontend_out, backend_static)
    print("Static files synced.")

    # 3. PyInstaller
    print("Running PyInstaller...")
    # --add-data format: source;dest (Windows)
    static_data = f"{backend_static};static"
    
    # We need to include other backend folders if they contain non-python files (e.g. templates?), 
    # but strictly speaking Python files are bundled.
    # However, 'backend/app' folder structure must be preserved if imports rely on it.
    # PyInstaller usually handles imports well.
    
    # Hidden imports often needed for uvicorn/fastapi
    hidden_imports = [
        "uvicorn.logging",
        "uvicorn.loops",
        "uvicorn.loops.auto",
        "uvicorn.protocols",
        "uvicorn.protocols.http",
        "uvicorn.protocols.http.auto",
        "uvicorn.lifespan",
        "uvicorn.lifespan.on",
        "engineio.async_drivers.eventlet", 
        "engineio.async_drivers.gevent", 
        "engineio.async_drivers.threading",
        "email_validator",
        "pydantic.deprecated", # sometimes needed
        "pydantic.deprecated.decorator"
    ]
    
    hidden_imports_args = " ".join([f"--hidden-import {mod}" for mod in hidden_imports])
    
    # Migrations
    migrations_dir = os.path.join(root_dir, "migrations")
    
    pyinstaller_cmd = (
        f"pyinstaller --noconfirm --name SenstoSales --clean --onefile "
        f"--add-data \"{backend_static};static\" "
        f"--add-data \"{migrations_dir};migrations\" "
        f"{hidden_imports_args} "
        f"--distpath \"{os.path.join(root_dir, 'dist')}\" " 
        f"--workpath \"{os.path.join(root_dir, 'build')}\" "
        f"\"{os.path.join(backend_dir, 'entry_point.py')}\""
    )
    
    run_command(pyinstaller_cmd, cwd=root_dir)
    
    print("Build Complete! Executable is in 'dist' folder.")

if __name__ == "__main__":
    main()
