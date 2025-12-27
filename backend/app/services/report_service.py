"""
Report Service Layer
Centralizes all report generation logic ensuring deterministic output.
Phase 4 Requirement: No AI, purely SQL-based.
"""

import sqlite3
import pandas as pd


def get_po_reconciliation_by_date(
    start_date: str, end_date: str, db: sqlite3.Connection
) -> pd.DataFrame:
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
      
      -- Subquery for Total Dispatched
      COALESCE((
        SELECT SUM(dci.dispatch_qty) 
        FROM delivery_challan_items dci 
        WHERE dci.po_item_id = poi.id
      ), 0) as total_dispatched,
      
      -- Subquery for Total Accepted/Rejected/Received
      COALESCE((
        SELECT SUM(srvi.accepted_qty)
        FROM srv_items srvi
        JOIN srvs s ON srvi.srv_number = s.srv_number
        WHERE CAST(srvi.po_number AS TEXT) = CAST(poi.po_number AS TEXT) 
          AND srvi.po_item_no = poi.po_item_no
          AND s.is_active = 1
      ), 0) as total_accepted,

      COALESCE((
        SELECT SUM(srvi.rejected_qty)
        FROM srv_items srvi
        JOIN srvs s ON srvi.srv_number = s.srv_number
        WHERE CAST(srvi.po_number AS TEXT) = CAST(poi.po_number AS TEXT) 
          AND srvi.po_item_no = poi.po_item_no
          AND s.is_active = 1
      ), 0) as total_rejected

    FROM purchase_order_items poi
    JOIN purchase_orders po ON poi.po_number = po.po_number
    WHERE po.po_date BETWEEN ? AND ?
       OR EXISTS (
         SELECT 1 FROM delivery_challans dc 
         WHERE dc.po_number = po.po_number AND dc.dc_date BETWEEN ? AND ?
       )
    ORDER BY poi.po_number, poi.po_item_no;
    """

    # Use pandas for easy DataFrame handling
    try:
        df = pd.read_sql_query(query, db, params=[start_date, end_date, start_date, end_date])
        # Add a calculated 'total_received' column for the frontend
        df['total_received'] = df['total_accepted'] + df['total_rejected']
        # Ensure numeric types
        for col in ['ordered_qty', 'total_dispatched', 'total_accepted', 'total_rejected', 'total_received']:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        return df
    except Exception as e:
        print(f"Error generating PO reconciliation report: {e}")
        return pd.DataFrame()


def get_monthly_sales_summary(
    start_date: str, end_date: str, db: sqlite3.Connection
) -> pd.DataFrame:
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


def get_dc_register(
    start_date: str, end_date: str, db: sqlite3.Connection
) -> pd.DataFrame:
    """
    Generate DC Register.
    """
    query = """
    SELECT 
        dc.dc_number,
        dc.dc_date,
        dc.po_number,
        dc.consignee_name,
        COUNT(dci.id) as item_count,
        SUM(dci.dispatch_qty) as total_qty,
        SUM(dci.dispatch_qty * poi.po_rate) as total_value
    FROM delivery_challans dc
    LEFT JOIN delivery_challan_items dci ON dc.dc_number = dci.dc_number
    LEFT JOIN purchase_order_items poi ON dci.po_item_id = poi.id
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


def get_invoice_register(
    start_date: str, end_date: str, db: sqlite3.Connection
) -> pd.DataFrame:
    """
    Detailed Invoice Register
    """
    query = """
    SELECT 
        invoice_number,
        invoice_date,
        linked_dc_numbers,
        po_numbers,
        customer_gstin,
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


def get_po_register(
    start_date: str, end_date: str, db: sqlite3.Connection
) -> pd.DataFrame:
    """
    Summary of POs with totals.
    """
    query = """
    SELECT 
        po.po_number,
        po.po_date,
        SUM(poi.ord_qty) as total_ordered,
        COALESCE(SUM(dci.dispatch_qty), 0) as total_dispatched,
        SUM(poi.pending_qty) as pending_qty,
        CASE 
            WHEN SUM(poi.pending_qty) <= 0 THEN 'Completed'
            WHEN COALESCE(SUM(dci.dispatch_qty), 0) > 0 THEN 'In Progress'
            ELSE 'Pending'
        END as status
    FROM purchase_orders po
    JOIN purchase_order_items poi ON po.po_number = poi.po_number
    LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
    WHERE po.po_date BETWEEN ? AND ?
    GROUP BY po.po_number, po.po_date
    ORDER BY po.po_date DESC;
    """
    try:
        df = pd.read_sql_query(query, db, params=[start_date, end_date])
        return df
    except Exception as e:
        print(f"Error generating PO Register: {e}")
        return pd.DataFrame()
