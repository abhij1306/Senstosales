"""
Date utility functions
"""
import re
from datetime import datetime

def normalize_date(val):
    """Normalize date to dd/mm/yyyy format"""
    if not val:
        return ""

    s = str(val).strip().upper()

    # Pass through YYYY-MM-DD
    if re.match(r'^\d{4}-\d{2}-\d{2}$', s):
        return s

    # dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy or dd mm yyyy
    m = re.search(r'(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{2,4})', s)
    if m:
        d, mth, y = m.groups()
        if len(y) == 2:
            y = "20" + y
        return f"{int(y)}-{int(mth):02d}-{int(d):02d}"

    # dd-MMM-yy or dd-MMM-yyyy or dd.MMM.yyyy or dd MMM yyyy
    m = re.search(r'(\d{1,2})[\/\-\.\s]([A-Z]{3})[\/\-\.\s](\d{2,4})', s)
    if m:
        d, mon, y = m.groups()
        if len(y) == 2:
            y = "20" + y
        try:
            dt = datetime.strptime(f"{d}-{month}-{y}", "%d-%b-%Y")
            return dt.strftime("%Y-%m-%d")
        except:
             # Fix for MMM logic - use mon
             try:
                dt = datetime.strptime(f"{d}-{mon}-{y}", "%d-%b-%Y")
                return dt.strftime("%Y-%m-%d")
             except:
                return ""

    return ""
