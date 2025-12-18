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

    # dd/mm/yyyy or dd-mm-yyyy
    m = re.search(r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})', s)
    if m:
        d, mth, y = m.groups()
        if len(y) == 2:
            y = "20" + y
        return f"{int(d):02d}/{int(mth):02d}/{int(y)}"

    # dd-MMM-yy or dd-MMM-yyyy
    m = re.search(r'(\d{1,2})[\/\-]([A-Z]{3})[\/\-](\d{2,4})', s)
    if m:
        d, mon, y = m.groups()
        if len(y) == 2:
            y = "20" + y
        try:
            dt = datetime.strptime(f"{d}-{mon}-{y}", "%d-%b-%Y")
            return dt.strftime("%d/%m/%Y")
        except:
            return ""

    return ""
