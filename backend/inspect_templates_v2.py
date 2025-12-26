import pandas as pd
import os

# Set pandas display options to ensure we see everything
pd.set_option("display.max_rows", 100)
pd.set_option("display.max_columns", 100)
pd.set_option("display.width", 1000)

files = [
    r"C:\Users\abhij\Downloads\doc samples\DC75.xls",
    r"C:\Users\abhij\Downloads\doc samples\GC5.xls",
    r"C:\Users\abhij\Downloads\doc samples\GST_INV_31.xls",
    r"C:\Users\abhij\Downloads\doc samples\SUMMARY_12-02-22.xls",
]


def print_grid(f):
    try:
        df = pd.read_excel(f, header=None, nrows=40)
        print(f"\n--- {os.path.basename(f)} ({df.shape}) ---")

        # Iterate over rows and print non-null values with their coordinates
        for r_idx, row in df.iterrows():
            row_vals = []
            for c_idx, val in row.items():
                if pd.notna(val) and str(val).strip() != "":
                    # Convert column index to Excel letter (0->A, 1->B, etc)
                    col_str = ""
                    n = c_idx
                    while n >= 0:
                        col_str = chr(n % 26 + 65) + col_str
                        n = n // 26 - 1
                        if n < 0:
                            break

                    row_vals.append(f"[{col_str}{r_idx + 1}: {str(val).strip()}]")

            if row_vals:
                print(f"Row {r_idx + 1}: " + " | ".join(row_vals))

    except Exception as e:
        print(f"Error reading {f}: {e}")


for f in files:
    print_grid(f)
