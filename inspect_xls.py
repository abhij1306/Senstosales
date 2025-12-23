import pandas as pd
import os

files = [
    "download_formats/DC12.xls",
    "download_formats/GST_INV_11.xls",
    "download_formats/SUMMARY_March 2019(from monthly sale).xls"
]

base_path = "c:\\Users\\abhij\\.gemini\\antigravity\\scratch\\SenstoSales"

for f in files:
    path = os.path.join(base_path, f)
    print(f"\n--- Analyzing {f} ---")
    try:
        # read_excel uses xlrd for .xls by default if installed
        df = pd.read_excel(path, header=None)
        print("Shape:", df.shape)
        print("First 20 rows:")
        print(df.head(20).to_string())
    except Exception as e:
        print(f"Error reading {f}: {e}")
