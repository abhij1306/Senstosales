"""
SRV (Stores Receipt Voucher) Scraper Service
Parses SRV HTML files from buyers (BHEL, NTPC, etc.) and extracts structured data.
"""
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
import re
from datetime import datetime


def scrape_srv_html(html_content: str) -> Dict:
    """
    Parse SRV HTML and extract structured data.
    
    Args:
        html_content: Raw HTML string from SRV file
        
    Returns:
        dict with structure:
        {
            "header": {
                "srv_number": str,
                "srv_date": str (YYYY-MM-DD),
                "po_number": str
            },
            "items": [
                {
                    "po_item_no": int,
                    "lot_no": int,
                    "received_qty": float,
                    "rejected_qty": float,
                    "challan_no": str,
                    "invoice_no": str
                }
            ]
        }
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Extract header fields
    header = extract_srv_header(soup)
    
    # Extract SRV items from table
    items = extract_srv_items(soup)
    
    return {
        "header": header,
        "items": items
    }


def extract_srv_header(soup: BeautifulSoup) -> Dict:
    """Extract SRV header fields from HTML."""
    header = {
        "srv_number": None,
        "srv_date": None,
        "po_number": None
    }
    
    # Find all text in the document
    text_content = soup.get_text()
    
    # Extract SRV number (pattern: "SRVs Raised on PO <number>")
    srv_match = re.search(r'SRVs?\s+Raised\s+on\s+PO\s+(\d+)', text_content, re.IGNORECASE)
    if srv_match:
        header["po_number"] = srv_match.group(1)
    
    # Try alternative patterns for PO number
    if not header["po_number"]:
        po_match = re.search(r'PURCHASE\s+ORDER\s+(\d+)', text_content, re.IGNORECASE)
        if po_match:
            header["po_number"] = po_match.group(1)
    
    # Extract SRV details from tables
    tables = soup.find_all('table')
    for table in tables:
        rows = table.find_all('tr')
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 2:
                for i in range(len(cells) - 1):
                    key = cells[i].get_text(strip=True).upper()
                    value = cells[i + 1].get_text(strip=True)
                    
                    # SRV Number (may be labeled as PMR NO, SRV NO, etc.)
                    if 'PMR' in key and 'NO' in key and not header["srv_number"]:
                        header["srv_number"] = value
                    elif 'SRV' in key and 'NO' in key and not header["srv_number"]:
                        header["srv_number"] = value
                    
                    # SRV Date
                    if 'SRV' in key and 'DATE' in key and not header["srv_date"]:
                        header["srv_date"] = parse_date(value)
                    elif 'PMR' in key and 'DATE' in key and not header["srv_date"]:
                        header["srv_date"] = parse_date(value)
                    
                    # PO Number
                    if 'PO' in key and 'NO' in key and not header["po_number"]:
                        # Extract just the number
                        po_match = re.search(r'\d+', value)
                        if po_match:
                            header["po_number"] = po_match.group(0)
    
    return header


def extract_srv_items(soup: BeautifulSoup) -> List[Dict]:
    """Extract SRV items from the items table."""
    items = []
    
    # Find the main items table (look for headers like "PO ITM", "RCD QTY", etc.)
    tables = soup.find_all('table')
    
    for table in tables:
        headers = []
        header_row = table.find('tr')
        if header_row:
            header_cells = header_row.find_all(['th', 'td'])
            headers = [cell.get_text(strip=True).upper() for cell in header_cells]
            
            # Check if this looks like an SRV items table
            if any('RCD' in h or 'RECEIVED' in h for h in headers):
                # This is likely the items table
                rows = table.find_all('tr')[1:]  # Skip header row
                
                for row in rows:
                    cells = row.find_all('td')
                    if len(cells) < 5:  # Need at least a few columns
                        continue
                    
                    item = parse_srv_item_row(cells, headers)
                    if item and item.get('po_item_no'):
                        items.append(item)
    
    return items


def parse_srv_item_row(cells: List, headers: List[str]) -> Optional[Dict]:
    """Parse a single SRV item row."""
    item = {
        "po_item_no": None,
        "lot_no": None,
        "received_qty": 0,
        "rejected_qty": 0,
        "challan_no": None,
        "invoice_no": None
    }
    
    try:
        # Map headers to cell indexes
        header_map = {}
        for idx, header in enumerate(headers):
            header_map[header] = idx
        
        # Extract PO Item Number (PO ITM, ITEM NO, etc.)
        for key in ['PO ITM', 'ITEM', 'ITM', 'PO_ITM']:
            if key in header_map:
                item["po_item_no"] = parse_int(cells[header_map[key]].get_text(strip=True))
                break
        
        # If no header match, try first column
        if not item["po_item_no"] and len(cells) > 0:
            item["po_item_no"] = parse_int(cells[0].get_text(strip=True))
        
        # Extract Lot Number
        for key in ['LOT NO', 'LOT', 'SUB ITM']:
            if key in header_map:
                item["lot_no"] = parse_int(cells[header_map[key]].get_text(strip=True))
                break
        
        # Extract Received Quantity (RCD QTY, RECEIVED, ACCEPTED)
        for key in ['RCD QTY', 'RECEIVED', 'ACCEPTED', 'RCVD QTY']:
            if key in header_map:
                item["received_qty"] = parse_decimal(cells[header_map[key]].get_text(strip=True))
                break
        
        # Extract Rejected Quantity (REJ QTY, REJECTED)
        for key in ['REJ QTY', 'REJECTED', 'REJECT']:
            if key in header_map:
                item["rejected_qty"] = parse_decimal(cells[header_map[key]].get_text(strip=True))
                break
        
        # Extract Challan Number
        for key in ['CHALLAN NO', 'CHALLAN', 'DC', 'DC NO']:
            if key in header_map:
                item["challan_no"] = cells[header_map[key]].get_text(strip=True) or None
                break
        
        # Extract Invoice Number
        for key in ['TAX INV', 'INVOICE', 'INV NO', 'TAX INV NO']:
            if key in header_map:
                item["invoice_no"] = cells[header_map[key]].get_text(strip=True) or None
                break
        
        return item
        
    except Exception as e:
        print(f"Error parsing SRV item row: {e}")
        return None


def parse_date(date_str: str) -> Optional[str]:
    """
    Convert date string to YYYY-MM-DD format.
    Handles formats: DD/MM/YYYY, DD-MM-YYYY, etc.
    """
    if not date_str or date_str == '-' or date_str == '':
        return None
    
    # Remove extra whitespace
    date_str = date_str.strip()
    
    # Try different date formats
    formats = [
        '%d/%m/%Y',  # 27/09/2025
        '%d-%m-%Y',  # 27-09-2025
        '%Y-%m-%d',  # 2025-09-27 (already correct)
        '%d.%m.%Y',  # 27.09.2025
        '%d %m %Y',  # 27 09 2025
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            continue
    
    # If no format matches, return as-is
    return date_str


def parse_int(value_str: str) -> Optional[int]:
    """Parse integer from string, handling empty values."""
    if not value_str or value_str == '-' or value_str == '':
        return None
    
    try:
        # Remove any non-digit characters except the first minus sign
        cleaned = value_str.strip()
        return int(cleaned)
    except ValueError:
        return None


def parse_decimal(value_str: str) -> float:
    """Parse decimal/float from string, handling commas and empty values."""
    if not value_str or value_str == '-' or value_str == '':
        return 0.0
    
    try:
        # Remove commas and extra whitespace
        cleaned = value_str.replace(',', '').strip()
        return float(cleaned)
    except ValueError:
        return 0.0
