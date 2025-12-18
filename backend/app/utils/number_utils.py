"""
Number utility functions
"""
import re

def to_int(val):
    """Convert value to integer, stripping non-numeric characters"""
    try:
        v = re.sub(r"[^\d]", "", str(val))
        return int(v) if v else None
    except:
        return None

def to_float(val):
    """Convert value to float, stripping non-numeric characters except decimal point"""
    try:
        v = re.sub(r"[^\d.\-]", "", str(val))
        return float(v) if v else None
    except:
        return None
