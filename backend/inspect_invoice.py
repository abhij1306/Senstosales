import pandas as pd
import sys

# Force UTF-8 for stdout
sys.stdout.reconfigure(encoding="utf-8")

f = r"C:\Users\abhij\Downloads\doc samples\GST_INV_31.xls"

try:
    df = pd.read_excel(f, header=None, nrows=40)
    print(f"--- {f} ---")

    for r_idx, row in df.iterrows():
        row_vals = []
        for c_idx, val in row.items():
            if pd.notna(val) and str(val).strip() != "":
                col_str = chr(c_idx % 26 + 65)
                if c_idx >= 26:
                    col_str = chr(c_idx // 26 + 64) + col_str

                # Clean value of newlines for single line printing
                clean_val = str(val).strip().replace("\n", " ").replace("\r", "")
                row_vals.append(f"[{col_str}{r_idx + 1}: {clean_val}]")

        if row_vals:
            print(f"R{r_idx + 1}: " + " | ".join(row_vals))

except Exception as e:
    print(f"Error: {e}")
