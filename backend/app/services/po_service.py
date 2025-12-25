"""
Purchase Order Service
Handles business logic, aggregation, and data retrieval for POs.
Separates concerns from the API router.
"""
import sqlite3
import logging
from typing import List, Optional, Dict, Any
from app.models import POListItem, PODetail, POHeader, POItem, POStats
from app.errors import not_found

logger = logging.getLogger(__name__)

class POService:
    """Service for Purchase Order business logic"""

    def get_stats(self, db: sqlite3.Connection) -> POStats:
        """Calculate PO Dashboard Statistics"""
        try:
            # Open Orders (Active)
            open_count = db.execute("SELECT COUNT(*) FROM purchase_orders WHERE po_status = 'Active'").fetchone()[0]
            
            # Pending Approval (Mock logic for now, using 'New' status)
            pending_count = db.execute("SELECT COUNT(*) FROM purchase_orders WHERE po_status = 'New' OR po_status IS NULL").fetchone()[0]
            
            # Total Value YTD (All POs for now)
            value_row = db.execute("SELECT SUM(po_value) FROM purchase_orders").fetchone()
            total_value = value_row[0] if value_row and value_row[0] else 0.0
            
            return POStats(
                open_orders_count=open_count,
                pending_approval_count=pending_count,
                total_value_ytd=total_value,
                total_value_change=0.0
            )
        except Exception as e:
            logger.error(f"Error calculating PO stats: {e}")
            # Fail gracefully for stats
            return POStats(
                open_orders_count=0, 
                pending_approval_count=0, 
                total_value_ytd=0.0, 
                total_value_change=0.0
            )

    def list_pos(self, db: sqlite3.Connection) -> List[POListItem]:
        """
        List all Purchase Orders with aggregated quantity details.
        Calculates ordered, dispatched, and pending quantities.
        """
        rows = db.execute("""
            SELECT po_number, po_date, supplier_name, po_value, amend_no, po_status, created_at
            FROM purchase_orders
            ORDER BY created_at DESC
        """).fetchall()
        
        results = []
        for row in rows:
            po_num = row['po_number']
            
            # Calculate Total Ordered Quantity
            ordered_row = db.execute("""
                SELECT SUM(ord_qty) FROM purchase_order_items WHERE po_number = ?
            """, (po_num,)).fetchone()
            total_ordered = ordered_row[0] if ordered_row and ordered_row[0] else 0.0

            # Calculate Total Dispatched Quantity
            # Link via PO Items to get specific dispatches for this PO
            dispatched_row = db.execute("""
                SELECT SUM(dci.dispatch_qty) 
                FROM delivery_challan_items dci
                JOIN purchase_order_items poi ON dci.po_item_id = poi.id
                WHERE poi.po_number = ?
            """, (po_num,)).fetchone()
            total_dispatched = dispatched_row[0] if dispatched_row and dispatched_row[0] else 0.0

            # Calculate Total pending (Derived)
            # Rule 3: pending_quantity is derived only, never persisted.
            total_pending = max(0, total_ordered - total_dispatched)
            
            # Calculate Total Items Count
            items_count_row = db.execute("SELECT COUNT(*) FROM purchase_order_items WHERE po_number = ?", (po_num,)).fetchone()
            total_items = items_count_row[0] if items_count_row else 0

            # Fetch linked DC numbers for reference
            dc_rows = db.execute("SELECT dc_number FROM delivery_challans WHERE po_number = ?", (po_num,)).fetchall()
            dc_nums = [r['dc_number'] for r in dc_rows]
            linked_dcs_str = ", ".join(dc_nums) if dc_nums else None

            # Calculate Total Received & Rejected (from SRVs)
            srv_agg_res = db.execute("""
                SELECT 
                    COALESCE(SUM(received_qty), 0),
                    COALESCE(SUM(rejected_qty), 0)
                FROM srv_items
                WHERE po_number = ?
            """, (po_num,)).fetchone()
            total_received = srv_agg_res[0] if srv_agg_res else 0.0
            total_rejected = srv_agg_res[1] if srv_agg_res else 0.0

            results.append(POListItem(
                po_number=row["po_number"],
                po_date=row["po_date"],
                supplier_name=row["supplier_name"],
                po_value=row["po_value"],
                amend_no=row["amend_no"],
                po_status=row["po_status"] or "New",
                linked_dc_numbers=linked_dcs_str,
                total_ordered_quantity=total_ordered,
                total_dispatched_quantity=total_dispatched,
                total_received_quantity=total_received,
                total_rejected_quantity=total_rejected,
                total_pending_quantity=total_pending,
                total_items_count=total_items,
                created_at=row["created_at"]
            ))
        
        return results

    def get_po_detail(self, db: sqlite3.Connection, po_number: int) -> PODetail:
        """
        Get full Purchase Order detail with items and delivery schedules.
        Includes SRV aggregated received/rejected quantities.
        """
        # Get header
        header_row = db.execute("""
            SELECT * FROM purchase_orders WHERE po_number = ?
        """, (po_number,)).fetchone()
        
        if not header_row:
            raise not_found(f"Purchase Order {po_number} not found", "PO")
        
        header_dict = dict(header_row)
        
        # Inject Consignee Details (Derived)
        # BHEL is the standard client, so we default to it if not explicit
        header_dict['consignee_name'] = "BHEL, Bhopal" 
        header_dict['consignee_address'] = header_dict.get('inspection_at') or "Piplani, Bhopal, Madhya Pradesh 462022"
        
        header = POHeader(**header_dict)
        
        # Get items with SRV aggregated data
        item_rows = db.execute("""
            SELECT id, po_item_no, material_code, material_description, drg_no, mtrl_cat,
                   unit, po_rate, ord_qty as ordered_quantity, rcd_qty as received_quantity, 
                   item_value, hsn_code
            FROM purchase_order_items
            WHERE po_number = ?
            ORDER BY po_item_no
        """, (po_number,)).fetchall()
        
        # For each item, get deliveries and SRV data
        items_with_deliveries = []
        for item_row in item_rows:
            item_dict = dict(item_row)
            item_id = item_dict['id']
            po_item_no = item_dict['po_item_no']
            
            # Get deliveries for this item
            delivery_rows = db.execute("""
                SELECT id, lot_no, dely_qty as delivered_quantity, dely_date, entry_allow_date, dest_code
                FROM purchase_order_deliveries
                WHERE po_item_id = ?
                ORDER BY lot_no
            """, (item_id,)).fetchall()
            
            deliveries = [dict(d) for d in delivery_rows]
            
            # Calculate per-item dispatched quantity
            dispatched_res = db.execute("""
                SELECT COALESCE(SUM(dispatch_qty), 0) FROM delivery_challan_items WHERE po_item_id = ?
            """, (item_id,)).fetchone()
            item_dispatched = dispatched_res[0] if dispatched_res else 0.0
            
            # Get SRV aggregated quantities for this item
            srv_res = db.execute("""
                SELECT 
                    COALESCE(SUM(received_qty), 0) as total_received,
                    COALESCE(SUM(rejected_qty), 0) as total_rejected
                FROM srv_items
                WHERE po_number = ? AND po_item_no = ?
            """, (po_number, po_item_no)).fetchone()
            
            srv_received = srv_res[0] if srv_res else 0.0
            srv_rejected = srv_res[1] if srv_res else 0.0
            
            # Update item with SRV quantities
            item_dict['received_quantity'] = srv_received
            item_dict['rejected_quantity'] = srv_rejected
            item_dict['delivered_quantity'] = item_dispatched
            
            # Calculate pending: Ordered - Delivered (dispatched)
            item_ordered = item_dict.get('ordered_quantity', 0)
            item_dict['pending_quantity'] = max(0, item_ordered - item_dispatched)
            
            item_with_deliveries = {**item_dict, 'deliveries': deliveries}
            items_with_deliveries.append(POItem(**item_with_deliveries))
        
        return PODetail(header=header, items=items_with_deliveries)

# Singleton instance
po_service = POService()
