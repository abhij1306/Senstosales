"""
SRV (Stores Receipt Voucher) Scraper Service
Parses SRV HTML files from buyers (BHEL, NTPC, etc.) and extracts structured data.
"""

from bs4 import BeautifulSoup
from typing import Dict, List, Optional
import re
from datetime import datetime


def scrape_srv_html(html_content: str) -> List[Dict]:
    """
    Parse SRV HTML and extract structured data for MULTIPLE SRVs.

    Args:
        html_content: Raw HTML string from SRV file

    Returns:
        List of dicts, each with structure:
        {
            "header": { ... },
            "items": [ ... ]
        }
    """
    soup = BeautifulSoup(html_content, "html.parser")

    # We need to find the main data table and group rows by SRV Number
    srv_groups = {}  # {srv_number: {header: {}, items: []}}

    tables = soup.find_all("table")
    for table in tables:
        # Get headers
        header_row = table.find("tr")
        if not header_row:
            continue

        headers = []
        for th in header_row.find_all(["th", "td"]):
            text = th.get_text(strip=True).upper()
            # Normalize whitespace: replace multiple spaces with single space
            text = " ".join(text.split())
            headers.append(text)

        # Check if this is the main table (has PO ITM, SRV NO, RECVD QTY etc)
        # Also check for "PO ITEM" or "SRV NO" variates
        header_set = set(headers)
        if ("PO ITM" in header_set or "PO ITEM" in header_set) and (
            "SRV NO" in header_set or "SRV NUMBER" in header_set
        ):
            # Process data rows
            rows = table.find_all("tr")[1:]  # Skip header

            for row in rows:
                cells = row.find_all("td")
                if len(cells) < 5 or (
                    len(cells) == 1 and cells[0].get_text(strip=True) == ""
                ):
                    continue

                # Parse the row
                # We need a temporary item extraction to get the SRV Number
                # We reuse parse_srv_item_row but we need to extract header info from it too

                # To do this cleanly, we'll manually extract SRV NO first
                # Map headers
                header_map = {h: i for i, h in enumerate(headers)}

                def get_cell_val(keys):
                    for key in keys:
                        if key in header_map and header_map[key] < len(cells):
                            return cells[header_map[key]].get_text(strip=True)
                    return None

                srv_number = get_cell_val(["SRV NO", "SRV", "SRV_NO"])

                # Validation: Skip header rows or invalid rows
                if not srv_number or srv_number in ["SRV NO", "SRV ITM", "SRV"]:
                    continue
                if not re.search(r"\d+", srv_number):
                    continue

                # Initialize group if not exists
                if srv_number not in srv_groups:
                    # Extract Header Info from this row
                    po_number_raw = get_cell_val(
                        ["PO NO", "PURCHASE ORDER", "PO_NO", "PO NUMBER"]
                    )
                    po_number = str(parse_int(po_number_raw)) if po_number_raw else None
                    srv_date = parse_date(get_cell_val(["SRV DATE", "DATE"]))

                    srv_groups[srv_number] = {
                        "header": {
                            "srv_number": srv_number,
                            "srv_date": srv_date,
                            "po_number": po_number,
                            "srv_status": "Received",
                            "po_found": True,  # Default, updated in ingestion
                        },
                        "items": [],
                    }

                # Extract Item
                item = parse_srv_item_row(cells, headers)
                if item and item.get("po_item_no") is not None:
                    srv_groups[srv_number]["items"].append(item)

    # Convert groups to list
    results = []
    for srv_num, data in srv_groups.items():
        results.append(data)

    return results


# Deprecated/Unused helper functions kept for compatibility if needed,
# but effectively replaced by the logic above.
# We can remove extract_srv_header and extract_srv_items entirely
# or keep them as stubs if other code imports them (unlikely).
# For cleanliness, I will allow them to remain but scrape_srv_html is the entry point.


def parse_srv_item_row(cells: List, headers: List[str]) -> Optional[Dict]:
    """Parse a single SRV item row."""
    item = {
        "po_item_no": None,
        "lot_no": None,
        "received_qty": 0,
        "rejected_qty": 0,
        "challan_no": None,
        "invoice_no": None,
    }

    try:
        # Map headers to cell indexes
        header_map = {}
        for idx, header in enumerate(headers):
            header_map[header] = idx

        # Helper to safely get cell text
        def get_val(keys):
            for key in keys:
                if key in header_map:
                    return cells[header_map[key]].get_text(strip=True)
            return None

        # Extract PO Item Number
        val = get_val(["PO ITM", "ITEM", "ITM", "PO_ITM", "PO ITEM"])
        if val:
            item["po_item_no"] = parse_int(val)
        elif len(cells) > 0:
            # Fallback to logic if header parsing completely failed but structure is known
            # But with the exact map this shouldn't be needed often
            try:
                item["po_item_no"] = parse_int(
                    cells[2].get_text(strip=True)
                )  # Index 2 is PO ITM usually
            except Exception:
                pass

        # Extract SRV Number (for internal grouping/validation)
        item["row_srv_number"] = get_val(["SRV NO", "SRV", "SRV_NO"])

        # Extract Lot Number (SUB ITM)
        item["lot_no"] = parse_int(get_val(["SUB ITM", "LOT NO", "LOT"]))

        # Extract Received Quantity
        item["received_qty"] = parse_decimal(
            get_val(["RECVD QTY", "RECEIVED QTY", "RCD QTY", "RECEIVED"])
        )

        # Extract Rejected Quantity
        item["rejected_qty"] = parse_decimal(
            get_val(["REJ QTY", "REJECTED QTY", "REJECTED"])
        )

        # Extract Accepted Quantity
        item["accepted_qty"] = parse_decimal(
            get_val(
                [
                    "ACCEPTED QTY",
                    "ACCPT QTY",
                    "ACCEPTED",
                    "ACCEPTED QUANTITY",
                    "OK QTY",
                    "QTY OK",
                ]
            )
        )

        # Extract Challan Number
        item["challan_no"] = (
            get_val(["CHALLAN NO", "CHALLAN", "DC NO", "DC NUMBER", "CHALLAN NUMBER"])
            or None
        )

        # Extract Challan Date
        item["challan_date"] = parse_date(
            get_val(["CHALLAN DATE", "CHALLAN DT", "DC DATE", "DC DT"])
        )

        # Extract Invoice Number (TAX INV)
        item["invoice_no"] = (
            get_val(
                [
                    "TAX INV",
                    "INVOICE NO",
                    "INV NO",
                    "TAX INVOICE NO",
                    "TAX INVOICE",
                    "GST INV NO",
                ]
            )
            or None
        )

        # Extract Invoice Date (TAX INV DT)
        item["invoice_date"] = parse_date(
            get_val(
                [
                    "TAX INV DT",
                    "INVOICE DATE",
                    "INV DT",
                    "TAX INVOICE DATE",
                    "TAX INV DATE",
                ]
            )
        )

        # Extract Unit
        item["unit"] = get_val(["UNIT", "UOM"]) or None

        # Extract Quantities
        item["order_qty"] = parse_decimal(
            get_val(
                ["ORDER QTY", "PO QTY", "ORDERED QTY", "PO QUANTITY", "ORDER QUANTITY"]
            )
        )
        item["challan_qty"] = parse_decimal(
            get_val(["CHALLAN QTY", "DC QTY", "DC QUANTITY", "CHALLAN QUANTITY"])
        )

        # Extract Extended Fields
        item["div_code"] = get_val(["DIV", "DIVISION"]) or None
        item["pmir_no"] = get_val(["PMIR NO", "PMIR"]) or None
        item["finance_date"] = parse_date(get_val(["FINANCE DT", "FINANCE DATE"]))
        item["cnote_no"] = get_val(["CNOTE NO.", "CNOTE NO", "CNOTE"]) or None
        item["cnote_date"] = parse_date(get_val(["CNOTE DATE", "CNOTE DT"]))

        return item

    except Exception as e:
        print(f"Error parsing SRV item row: {e}")
        return None


def parse_date(date_str: str) -> Optional[str]:
    """
    Convert date string to YYYY-MM-DD format.
    Handles formats: DD/MM/YYYY, DD-MM-YYYY, etc.
    """
    if not date_str or date_str == "-" or date_str == "":
        return None

    # Remove extra whitespace
    date_str = date_str.strip()

    # Try different date formats
    formats = [
        "%d/%m/%Y",  # 27/09/2025
        "%d-%m-%Y",  # 27-09-2025
        "%Y-%m-%d",  # 2025-09-27
        "%d.%m.%Y",  # 27.09.2025
        "%d %m %Y",  # 27 09 2025
        "%d/%m/%y",  # 27/09/25
        "%d-%m-%y",  # 27-09-25
        "%d.%m.%y",  # 27.09.25
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    # If no format matches, return as-is
    return date_str


def parse_int(value_str: str) -> Optional[int]:
    """Parse integer from string, handling empty values."""
    if value_str is None or value_str == "-" or value_str.strip() == "":
        return None

    try:
        # Remove any non-digit characters except the first minus sign
        cleaned = value_str.strip()
        return int(cleaned)
    except ValueError:
        return None


def parse_decimal(value_str: str) -> float:
    """Parse decimal/float from string, handling commas and empty values."""
    if not value_str or value_str == "-" or value_str == "":
        return 0.0

    try:
        # Remove commas and extra whitespace
        cleaned = value_str.replace(",", "").strip()
        return float(cleaned)
    except ValueError:
        return 0.0
