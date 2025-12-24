"""
Report Service Layer
Centralizes all report generation logic ensuring deterministic output.
Phase 4 Requirement: No AI, purely SQL-based.
"""
import sqlite3
import pandas as pd
from datetime import datetime
from typing import List, Dict, Optional

def get_po_reconciliation_by_date(start_date: str, end_date: str, db: sqlite3.Connection) -> pd.DataFrame:
    """
    Generate PO vs Delivered vs Received vs Rejected report.
    Adapted from Master Prompt to match actual Schema.
    
    Schema Mapping:
    - purchase_order_items.ord_qty -> ordered_qty
    - srv_items JOIN on po_number, po_item_no (not id)
    """
    query = """
    SELECT 
      poi.po_number,
      poi.po_item_no,
      poi.material_description as item_description,
      poi.ord_qty as ordered_qty,
      
      -- Total Dispatched (from DC items)
      COALESCE(SUM(dci.dispatch_qty), 0) as total_dispatched,
      
      -- Total Accepted (from SRV items, active only)
      COALESCE(SUM(CASE WHEN s.is_active = 1 THEN srvi.accepted_qty ELSE 0 END), 0) as total_accepted,
      
      -- Total Rejected (from SRV items, active only)
      COALESCE(SUM(CASE WHEN s.is_active = 1 THEN srvi.rejected_qty ELSE 0 END), 0) as total_rejected,
      
      -- Total Received (Calculated)
      COALESCE(SUM(CASE WHEN s.is_active = 1 THEN (srvi.accepted_qty + srvi.rejected_qty) ELSE 0 END), 0) as total_received

    FROM purchase_order_items poi
    JOIN purchase_orders po ON poi.po_number = po.po_number
    
    -- Join DCs
    LEFT JOIN delivery_challan_items dci ON dci.po_item_id = poi.id
    LEFT JOIN delivery_challans dc ON dci.dc_number = dc.dc_number
    
    -- Join SRVs (Complex join due to schema)
    LEFT JOIN srv_items srvi ON srvi.po_number = poi.po_number AND srvi.po_item_no = poi.po_item_no
    LEFT JOIN srvs s ON srvi.srv_number = s.srv_number

    WHERE po.po_date BETWEEN ? AND ?
    GROUP BY poi.po_number, poi.po_item_no, poi.material_description, poi.ord_qty
    ORDER BY poi.po_number, poi.po_item_no;
    """
    
    # Use pandas for easy DataFrame handling as requested
    try:
        df = pd.read_sql_query(query, db, params=[start_date, end_date])
        return df
    except Exception as e:
        print(f"Error generating PO reconciliation report: {e}")
        return pd.DataFrame()

def get_monthly_sales_summary(start_date: str, end_date: str, db: sqlite3.Connection) -> pd.DataFrame:
    """
    Generate Monthly Sales Summary (Invoice Register essentially).
    """
    query = """
    SELECT 
        strftime('%Y-%m', invoice_date) as month,
        COUNT(invoice_number) as invoice_count,
        SUM(taxable_value) as total_taxable,
        SUM(cgst) as total_cgst,
        SUM(sgst) as total_sgst,
        SUM(igst) as total_igst,
        SUM(total_invoice_value) as total_value
    FROM gst_invoices
    WHERE invoice_date BETWEEN ? AND ?
    GROUP BY month
    ORDER BY month DESC;
    """
    try:
        df = pd.read_sql_query(query, db, params=[start_date, end_date])
        return df
    except Exception as e:
         print(f"Error generating Monthly Sales report: {e}")
         return pd.DataFrame()

def get_dc_register(start_date: str, end_date: str, db: sqlite3.Connection) -> pd.DataFrame:
    """
    Generate DC Register.
    """
    query = """
    SELECT 
        dc.dc_number,
        dc.dc_date,
        dc.po_number,
        dc.consignee_name,
        COUNT(*) as item_count,
        SUM(dci.dispatch_qty) as total_qty
    FROM delivery_challans dc
    LEFT JOIN delivery_challan_items dci ON dc.dc_number = dci.dc_number
    WHERE dc.dc_date BETWEEN ? AND ?
    GROUP BY dc.dc_number, dc.dc_date, dc.po_number, dc.consignee_name
    ORDER BY dc.dc_date DESC;
    """
    try:
        df = pd.read_sql_query(query, db, params=[start_date, end_date])
        return df
    except Exception as e:
         print(f"Error generating DC Register: {e}")
         return pd.DataFrame()

def get_invoice_register(start_date: str, end_date: str, db: sqlite3.Connection) -> pd.DataFrame:
    """
    Detailed Invoice Register
    """
    query = """
    SELECT 
        invoice_number,
        invoice_date,
        buyer_name,
        buyer_gstin,
        taxable_value,
        cgst,
        sgst,
        igst,
        total_invoice_value
    FROM gst_invoices
    WHERE invoice_date BETWEEN ? AND ?
    ORDER BY invoice_date DESC;
    """
    try:
        df = pd.read_sql_query(query, db, params=[start_date, end_date])
        return df
    except Exception as e:
         print(f"Error generating Invoice Register: {e}")
         return pd.DataFrame()

def get_pending_po_items(db: sqlite3.Connection) -> pd.DataFrame:
    """
    Get items where pending_qty > 0
    """
    query = """
    SELECT 
        po_number,
        po_item_no,
        material_description,
        ord_qty,
        pending_qty,
        (ord_qty - pending_qty) as delivered_qty
    FROM purchase_order_items
    WHERE pending_qty > 0
    ORDER BY po_number, po_item_no;
    """
    try:
        df = pd.read_sql_query(query, db)
        return df
    except Exception as e:
         print(f"Error generating Pending PO Items report: {e}")
         return pd.DataFrame()
