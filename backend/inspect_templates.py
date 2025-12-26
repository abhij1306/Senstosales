import pandas as pd
import os

files = [
    r"C:\Users\abhij\Downloads\doc samples\DC75.xls",
    r"C:\Users\abhij\Downloads\doc samples\GC5.xls",
    r"C:\Users\abhij\Downloads\doc samples\GST_INV_31.xls",
    r"C:\Users\abhij\Downloads\doc samples\SUMMARY_12-02-22.xls",
]

for f in files:
    print(f"\n--- INSPECTING: {os.path.basename(f)} ---")
    if not os.path.exists(f):
        print(f"File not found: {f}")
        continue

    try:
        # Try reading with pandas, header=None to get grid
        df = pd.read_excel(f, header=None, nrows=30)
        print(df.to_string())
    except Exception as e:
        print(f"Error reading {f}: {e}")
