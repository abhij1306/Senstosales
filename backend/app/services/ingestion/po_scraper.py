"""
PO HTML Parser
Extracts PO header and line items from HTML files
"""
import logging
import re
from typing import Any, Dict, List

from bs4 import BeautifulSoup


logger = logging.getLogger(__name__)

RX_LABEL_ONLY = re.compile(r'^[A-Z\s/-]{3,}$')
RX_DRG = re.compile(
    r'DRG(?:[\s\.]*NO[\s\.]*|[\s\.]+)[\:\-]?\s*([A-Z0-9][A-Z0-9\.\-]*)',
    re.IGNORECASE
)

def clean(text):
    return re.sub(r"\s+", " ", text or "").strip()

def has_value(text):
    return bool(text and any(c.isalnum() for c in text))

def to_int(val):
    try:
        if val is None:
            return None
        v = re.sub(r"[^\d]", "", str(val))
        return int(v) if v else None
    except Exception:
        return None

def to_float(val):
    try:
        if val is None:
            return None
        v = re.sub(r"[^\d.\-]", "", str(val))
        return float(v) if v else None
    except Exception:
        return None

def normalize_date(val):
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
    # dd-MMM-yy
    m = re.search(r'(\d{1,2})[\/\-]([A-Z]{3})[\/\-](\d{2,4})', s)
    if m:
        d, mon, y = m.groups()
        if len(y) == 2:
            y = "20" + y
        return f"{s}" # Let backend normalizer handle this specifics if needed, or stick to simple
    return s

def extract_po_header(soup: BeautifulSoup) -> Dict[str, Any]:
    tables = soup.find_all("table")
    header = {}

    def find_value(label_rx, prefer="below"):
        for table in tables:
            rows = table.find_all("tr")
            for r_idx, row in enumerate(rows):
                cells = row.find_all("td")
                for c_idx, cell in enumerate(cells):
                    cell_text = clean(cell.get_text())

                    if not re.search(label_rx, cell_text, re.IGNORECASE):
                        continue

                    inline = re.search(
                        rf"{label_rx}[:\.]?\s*(.+)",
                        cell_text,
                        re.IGNORECASE
                    )
                    if inline and has_value(inline.group(1)):
                        return clean(inline.group(1))

                    if prefer == "adjacent" and c_idx + 1 < len(cells):
                        val = clean(cells[c_idx + 1].get_text())
                        if has_value(val):
                            return val

                    if r_idx + 1 < len(rows):
                        below_cells = rows[r_idx + 1].find_all("td")
                        if c_idx < len(below_cells):
                            val = clean(below_cells[c_idx].get_text())
                            if has_value(val) and not RX_LABEL_ONLY.match(val):
                                return val
        return ""

    # Inline fields
    for k, rx in {
        "TIN NO": r"TIN\s+NO",
        "ECC NO": r"ECC\s+NO",
        "MPCT NO": r"MPCT\s+NO",
        "PHONE": r"PHONE",
        "FAX": r"FAX",
        "EMAIL": r"EMAIL",
        "WEBSITE": r"WEBSITE"
    }.items():
        header[k] = find_value(rx)

    # Below-cell fields
    for k, rx in {
        "PURCHASE ORDER": r"^PURCHASE\s+ORDER$",
        "PO DATE": r"PO\s+DATE",
        "ENQUIRY": r"ENQUIRY",
        "SUPP CODE": r"SUPP\s+CODE",
        "ORD-TYPE": r"ORD-TYPE",
        "DVN": r"DVN",
        "QUOTATION": r"QUOTATION",
        "QUOT-DATE": r"QUOT-DATE",
        "PO STATUS": r"PO\s+STATUS",
        "AMEND NO": r"AMEND\s+NO",
        "PO-VALUE": r"PO-VALUE",
        "RC NO": r"RC\s+NO",
        "EX RATE": r"EX\s+RATE",
        "CURRENCY": r"CURRENCY",
        "FOB VALUE": r"FOB\s+VALUE",
        "NET PO VAL": r"NET\s+PO\s+VAL",
        "ENQ DATE": r"ENQ\s+DATE",
        "REMARKS": r"REMARKS",
        "TOTAL VALUE": r"TOTAL\s+VALUE",
        "SUPP NAME M/S": r"^SUPP\s+NAME\s+M/S$"
    }.items():
        header[k] = find_value(rx, prefer="below")

    # Adjacent-only fields
    for k, rx in {
        "INSPECTION BY": r"INSPECTION\s+BY",
        "NAME": r"^NAME$",
        "DESIGNATION": r"DESIGNATION",
        "PHONE NO": r"^PHONE\s+NO$"
    }.items():
        header[k] = find_value(rx, prefer="adjacent")

    # DRG
    header["DRG"] = ""
    for table in tables:
        m = RX_DRG.search(table.get_text(" ", strip=True))
        if m:
            header["DRG"] = m.group(1)
            break

    return header

def extract_items(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    tables = soup.find_all("table")
    item_table = next(
        (t for t in tables if t.find(string=re.compile("MATERIAL CODE", re.I))),
        None
    )
    if not item_table:
        return []

    rows = item_table.find_all("tr")
    header_idx = next(
        (i for i, r in enumerate(rows) if r.find(string=re.compile("MATERIAL CODE", re.I))),
        None
    )
    if header_idx is None:
        return []

    # Extract DRG from header (it's a PO-level field)
    drg_no = ""
    for table in tables:
        m = RX_DRG.search(table.get_text(" ", strip=True))
        if m:
            drg_no = m.group(1)
            break

    description_text = ""
    for row in rows[header_idx + 1:]:
        cols = [clean(td.get_text()) for td in row.find_all("td")]
        if 1 <= len(cols) <= 4:
            text = " ".join(cols).strip()
            if len(text) > 30:
                description_text = text
                break

    items = []
    
    for row in rows[header_idx + 1:]:
        cols = [clean(td.get_text()) for td in row.find_all("td")]
        
        if len(cols) <= 4:
            continue
        
        if len(cols) < 8:
            continue
            
        if not cols[0] or not any(c.isdigit() for c in cols[0]):
            continue
            
        items.append({
            "PO ITM": to_int(cols[0]),
            "MATERIAL CODE": cols[1],
            "DESCRIPTION": description_text,
            "DRG": drg_no,
            "MTRL CAT": to_int(cols[2]) if len(cols) > 2 else None,
            "UNIT": cols[3] if len(cols) > 3 else "",
            "PO RATE": to_float(cols[4]) if len(cols) > 4 else None,
            "ORD QTY": to_int(cols[5]) if len(cols) > 5 else None,
            "RCD QTY": to_int(cols[6]) if len(cols) > 6 else None,
            "ITEM VALUE": to_float(cols[7]) if len(cols) > 7 else None,
            "LOT NO": to_int(cols[8]) if len(cols) > 8 else None,
            "DELY QTY": to_int(cols[9]) if len(cols) > 9 else None,
            "DELY DATE": normalize_date(cols[10]) if len(cols) > 10 else "",
            "ENTRY ALLOW DATE": normalize_date(cols[11]) if len(cols) > 11 else "",
            "DEST CODE": to_int(cols[12]) if len(cols) > 12 else None,
        })

    return items
