import uvicorn
import os
import sys
import multiprocessing
import traceback

# Add the directory containing this script to sys.path
# This ensures we can import 'app' correctly
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

if __name__ == "__main__":
    # Essential for PyInstaller + multiprocessing
    multiprocessing.freeze_support()
    
    # Run the server
    # We use string import "app.main:app" if possible, but passing the app object directly 
    # is often safer with PyInstaller to avoid import string issues, 
    # UNLESS the app is inside a package.
    
    # However, "app.main:app" requires 'app' to be a package in python path.
    # Since we added current_dir to sys.path, and 'app' is a folder there, it should work.
    
    print("Starting SenstoSales Server on http://localhost:8000")
    print("Press Ctrl+C to stop.")
    
    try:
        from app.main import app
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    except Exception as e:
        error_msg = f"Failed to start server: {e}\n\nFull traceback:\n{traceback.format_exc()}"
        print(error_msg)
        
        # Write to error log
        try:
            with open("error.log", "w") as f:
                f.write(error_msg)
            print("\nError details written to error.log")
        except:
            pass
            
        input("Press Enter to exit...")
