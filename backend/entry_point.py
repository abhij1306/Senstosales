import uvicorn
import os
import sys
import signal
import multiprocessing
import traceback

# Add the directory containing this script to sys.path
# This ensures we can import 'app' correctly
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from app.db import validate_database_path, verify_wal_mode

# Graceful shutdown handler
def shutdown_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    print(f"\nReceived signal {signum}. Shutting down gracefully...")
    sys.exit(0)

if __name__ == "__main__":
    # Essential for PyInstaller + multiprocessing
    multiprocessing.freeze_support()

    # Register signal handlers
    signal.signal(signal.SIGTERM, shutdown_handler)  # Docker/K8s stop
    signal.signal(signal.SIGINT, shutdown_handler)   # Ctrl+C

    print("=== SenstoSales ERP Backend ===")
    print("Initializing database...")
    validate_database_path()
    
    print("Starting server...")
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        error_msg = (
            f"Failed to start server: {e}\n\nFull traceback:\n{traceback.format_exc()}"
        )
        print(error_msg)

        # Write to error log
        try:
            with open("error.log", "w") as f:
                f.write(error_msg)
            print("\nError details written to error.log")
        except Exception:
            pass

        input("Press Enter to exit...")
