from typing import List, Dict, Any, Optional
import sqlite3
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ReportsService:
    """
    Business logic for generating reports.
    Encapsulates SQL queries and data transformations.
    """
    
    def get_reconciliation_report(self, db: sqlite3.Connection, po_number: Optional[int] = None) -> List[Dict[str, Any]]:
        """PO vs DC vs Invoice Status"""
        query = """
            SELECT 
                po.po_number,
                po.po_date,
                po.supplier_name,
                poi.po_item_no,
                poi.material_code,
                poi.material_description,
                poi.ord_qty,
                COALESCE(SUM(dci.dispatch_qty), 0) as dispatched_qty,
                poi.ord_qty - COALESCE(SUM(dci.dispatch_qty), 0) as pending_qty
            FROM purchase_orders po
            JOIN purchase_order_items poi ON po.po_number = poi.po_number
            LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
        """
        
        params = []
        if po_number:
            query += " WHERE po.po_number = ?"
            params.append(po_number)
            
        query += """
            GROUP BY po.po_number, poi.po_item_no
            ORDER BY po.po_date DESC, poi.po_item_no
        """
        
        rows = db.execute(query, params).fetchall()
        return [dict(row) for row in rows]

    def get_pending_dcs(self, db: sqlite3.Connection) -> List[Dict[str, Any]]:
        """DCs created but not yet invoiced"""
        rows = db.execute("""
            SELECT 
                dc.dc_number,
                dc.dc_date,
                dc.po_number,
                dc.consignee_name,
                dc.created_at
            FROM delivery_challans dc
            LEFT JOIN gst_invoice_dc_links link ON dc.dc_number = link.dc_number
            WHERE link.id IS NULL
            ORDER BY dc.dc_date DESC
        """).fetchall()
        return [dict(row) for row in rows]

    def get_invoice_summary(self, db: sqlite3.Connection, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Invoice listing + Totals.
        Optimized to use SQL for aggregation.
        """
        base_query = "FROM gst_invoices"
        conditions = []
        params = []
        
        if start_date:
            conditions.append("invoice_date >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("invoice_date <= ?")
            params.append(end_date)
            
        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)
            
        # 1. Get List
        list_query = f"""
            SELECT 
                invoice_number,
                invoice_date,
                customer_gstin,
                place_of_supply,
                taxable_value,
                cgst,
                sgst,
                igst,
                total_invoice_value,
                created_at
            {base_query}
            ORDER BY invoice_date DESC
        """
        invoices = [dict(row) for row in db.execute(list_query, params).fetchall()]
        
        # 2. Get Aggregates (SQL is faster/safer for large datasets)
        agg_query = f"""
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(taxable_value), 0) as total_taxable,
                COALESCE(SUM(cgst), 0) as total_cgst,
                COALESCE(SUM(sgst), 0) as total_sgst,
                COALESCE(SUM(igst), 0) as total_igst,
                COALESCE(SUM(total_invoice_value), 0) as total_invoice
            {base_query}
        """
        agg_row = db.execute(agg_query, params).fetchone()
        
        summary = {
            "invoice_count": agg_row["count"],
            "total_taxable_value": agg_row["total_taxable"],
            "total_cgst": agg_row["total_cgst"],
            "total_sgst": agg_row["total_sgst"],
            "total_igst": agg_row["total_igst"],
            "total_invoice_value": agg_row["total_invoice"]
        }
        
        return {"invoices": invoices, "summary": summary}

    def get_supplier_summary(self, db: sqlite3.Connection) -> List[Dict[str, Any]]:
        rows = db.execute("""
            SELECT 
                supplier_name,
                COUNT(po_number) as po_count,
                SUM(po_value) as total_po_value,
                MAX(po_date) as last_po_date
            FROM purchase_orders
            WHERE supplier_name IS NOT NULL
            GROUP BY supplier_name
            ORDER BY total_po_value DESC
        """).fetchall()
        return [dict(row) for row in rows]

    def get_monthly_summary(self, db: sqlite3.Connection, year: int) -> Dict[str, Any]:
        """Aggregate stats by month"""
        # POs
        pos = db.execute("""
            SELECT strftime('%m', po_date) as month, COUNT(*) as count, SUM(po_value) as total_value
            FROM purchase_orders
            WHERE strftime('%Y', po_date) = ?
            GROUP BY month ORDER BY month
        """, (str(year),)).fetchall()
        
        # DCs
        dcs = db.execute("""
            SELECT strftime('%m', dc_date) as month, COUNT(*) as count
            FROM delivery_challans
            WHERE strftime('%Y', dc_date) = ?
            GROUP BY month ORDER BY month
        """, (str(year),)).fetchall()
        
        # Invoices
        invoices = db.execute("""
            SELECT strftime('%m', invoice_date) as month, COUNT(*) as count, SUM(total_invoice_value) as total_value
            FROM gst_invoices
            WHERE strftime('%Y', invoice_date) = ?
            GROUP BY month ORDER BY month
        """, (str(year),)).fetchall()

        # In a real service, we might want to merge these into a single list of objects
        # But keeping format consistent with original for now.
        # Actually the original returned None? No, it seemed truncated in the `view_file`.
        # Oh, the original implementation in `reports.py` returns NOTHING (implicit None) for `monthly_summary`?
        # Let me check `view_file` output Step 568...
        # Line 192 ends the query execution, then function ends at 194. It returns None!
        # That's a BUG in the original code! I must fix it.
        
        return {
            "pos": [dict(row) for row in pos],
            "dcs": [dict(row) for row in dcs],
            "invoices": [dict(row) for row in invoices]
        }

    def get_dashboard_insights(self, db: sqlite3.Connection) -> List[Dict[str, Any]]:
        insights = []
        
        # Check 1: Old Pending Items (> 14 days)
        pending_old = db.execute("""
            SELECT COUNT(*) 
            FROM purchase_orders po
            JOIN purchase_order_items poi ON po.po_number = poi.po_number
            LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
            WHERE (poi.ord_qty - COALESCE(dci.dispatch_qty, 0)) > 0
            AND date(po.po_date) < date('now', '-14 days')
        """).fetchone()[0]
        
        if pending_old > 0:
            insights.append({
                "type": "warning",
                "text": f"⚠️ {pending_old} items are pending for over 14 days.",
                "action": "view_pending"
            })

        # Check 2: Uninvoiced Challans
        uninvoiced = db.execute("""
            SELECT COUNT(*) 
            FROM delivery_challans dc
            LEFT JOIN gst_invoice_dc_links link ON dc.dc_number = link.dc_number
            WHERE link.id IS NULL
        """).fetchone()[0]
        
        if uninvoiced > 0:
            insights.append({
                "type": "error",
                "text": f"📉 {uninvoiced} challans are pending invoicing.",
                "action": "view_uninvoiced"
            })
        else:
            insights.append({
                "type": "success",
                "text": "✅ Billing efficiency is excellent (No pending invoices).",
                "action": "view_summary"
            })
            
        return insights

    def get_trends(self, db: sqlite3.Connection, range_type: str = "year") -> List[Dict[str, Any]]:
        year = datetime.now().year
        # CTE for months
        data = db.execute("""
            WITH months AS (
                SELECT '01' as m UNION SELECT '02' UNION SELECT '03' UNION SELECT '04'
                UNION SELECT '05' UNION SELECT '06' UNION SELECT '07' UNION SELECT '08'
                UNION SELECT '09' UNION SELECT '10' UNION SELECT '11' UNION SELECT '12'
            )
            SELECT 
                m.m as month,
                COALESCE(SUM(po.po_value), 0) as ordered_value,
                COALESCE(SUM(inv.total_invoice_value), 0) as invoiced_value
            FROM months m
            LEFT JOIN purchase_orders po ON strftime('%m', po.po_date) = m.m AND strftime('%Y', po.po_date) = ?
            LEFT JOIN gst_invoices inv ON strftime('%m', inv.invoice_date) = m.m AND strftime('%Y', inv.invoice_date) = ?
            GROUP BY m.m
            ORDER BY m.m
        """, (str(year), str(year))).fetchall()
        
        return [dict(row) for row in data]

    def get_smart_table(self, db: sqlite3.Connection, filter_text: Optional[str] = None) -> List[Dict[str, Any]]:
        query = """
            SELECT 
                po.po_number,
                po.po_date,
                poi.po_item_no,
                poi.material_description,
                poi.ord_qty,
                COALESCE(SUM(dci.dispatch_qty), 0) as dispatched_qty,
                (poi.ord_qty - COALESCE(SUM(dci.dispatch_qty), 0)) as pending_qty,
                CAST((julianday('now') - julianday(po.po_date)) AS INTEGER) as age_days,
                CASE 
                    WHEN (poi.ord_qty - COALESCE(SUM(dci.dispatch_qty), 0)) > 0 THEN 'Pending'
                    ELSE 'Completed'
                END as status
            FROM purchase_orders po
            JOIN purchase_order_items poi ON po.po_number = poi.po_number
            LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
        """
        
        # Filtering logic could be added here if filter_text is passed
        # Currently just basic grouping
        
        query += """
            GROUP BY po.po_number, poi.po_item_no
            ORDER BY po.po_date DESC, poi.po_item_no
        """
        
        rows = db.execute(query).fetchall()
        return [dict(row) for row in rows]

reports_service = ReportsService()
