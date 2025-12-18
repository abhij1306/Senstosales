"""
Dashboard Router
Provides KPIs and recent activity
"""
from fastapi import APIRouter, Depends
from app.db import get_db
from app.models import DashboardSummary, ActivityItem
from typing import List
import sqlite3

router = APIRouter()

@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: sqlite3.Connection = Depends(get_db)):
    """Get dashboard KPIs"""
    
    # Count POs
    total_pos = db.execute("SELECT COUNT(*) as count FROM purchase_orders").fetchone()["count"]
    
    # Count DCs
    total_dcs = db.execute("SELECT COUNT(*) as count FROM delivery_challans").fetchone()["count"]
    
    # Count Invoices
    total_invoices = db.execute("SELECT COUNT(*) as count FROM gst_invoices").fetchone()["count"]
    
    # Total PO Value
    po_value_row = db.execute("SELECT SUM(po_value) as total FROM purchase_orders").fetchone()
    total_po_value = po_value_row["total"] if po_value_row["total"] else 0
    
    return DashboardSummary(
        total_pos=total_pos,
        total_dcs=total_dcs,
        total_invoices=total_invoices,
        total_po_value=total_po_value
    )

@router.get("/activity", response_model=List[ActivityItem])
def get_recent_activity(limit: int = 10, db: sqlite3.Connection = Depends(get_db)):
    """Get recent activity across all entities"""
    
    activities = []
    
    # Recent POs
    pos = db.execute("""
        SELECT po_number, po_date, supplier_name, created_at
        FROM purchase_orders
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,)).fetchall()
    
    for po in pos:
        activities.append(ActivityItem(
            type="PO",
            number=str(po["po_number"]),
            date=po["po_date"] or "",
            description=f"PO from {po['supplier_name'] or 'Unknown'}",
            created_at=po["created_at"]
        ))
    
    # Recent DCs
    dcs = db.execute("""
        SELECT dc_number, dc_date, consignee_name, created_at
        FROM delivery_challans
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,)).fetchall()
    
    for dc in dcs:
        activities.append(ActivityItem(
            type="DC",
            number=dc["dc_number"],
            date=dc["dc_date"],
            description=f"DC to {dc['consignee_name'] or 'Unknown'}",
            created_at=dc["created_at"]
        ))
    
    # Recent Invoices
    invoices = db.execute("""
        SELECT invoice_number, invoice_date, total_invoice_value, created_at
        FROM gst_invoices
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,)).fetchall()
    
    for inv in invoices:
        activities.append(ActivityItem(
            type="Invoice",
            number=inv["invoice_number"],
            date=inv["invoice_date"],
            description=f"Invoice ₹{inv['total_invoice_value'] or 0:.2f}",
            created_at=inv["created_at"]
        ))
    
    # Sort by created_at and limit
    activities.sort(key=lambda x: x.created_at, reverse=True)
    return activities[:limit]
