import pandas as pd
import os

path = "c:\\Users\\abhij\\.gemini\\antigravity\\scratch\\SenstoSales\\download_formats\\SUMMARY_March 2019(from monthly sale).xls"

print(f"\n--- Analyzing {path} ---")
try:
    df = pd.read_excel(path, header=None)
    print("Shape:", df.shape)
    print("First 30 rows:")
    print(df.head(30).to_string())
except Exception as e:
    print(f"Error reading file: {e}")
