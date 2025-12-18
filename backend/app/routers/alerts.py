"""
Alerts Router - Smart Alerts System
"""
from fastapi import APIRouter, Depends
from app.db import get_db
from app.logging_config import log_business_event
from typing import List
import sqlite3
import uuid
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/")
def list_alerts(
    acknowledged: bool = False,
    db: sqlite3.Connection = Depends(get_db)
):
    """List all alerts, optionally filter by acknowledged status"""
    
    rows = db.execute("""
        SELECT * FROM alerts
        WHERE is_acknowledged = ?
        ORDER BY created_at DESC
        LIMIT 50
    """, (1 if acknowledged else 0,)).fetchall()
    
    return [dict(row) for row in rows]

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Acknowledge an alert"""
    
    db.execute("""
        UPDATE alerts
        SET is_acknowledged = 1, acknowledged_at = ?
        WHERE id = ?
    """, (datetime.utcnow().isoformat(), alert_id))
    
    db.commit()
    log_business_event("ACKNOWLEDGE", "ALERT", alert_id)
    
    return {"success": True}

@router.post("/generate")
def generate_alerts(db: sqlite3.Connection = Depends(get_db)):
    """
    Generate alerts based on business rules
    This can be called manually or via scheduled task
    """
    
    alerts_created = []
    
    # Alert 1: PO fully dispatched but not invoiced
    fully_dispatched = db.execute("""
        SELECT 
            po.po_number,
            po.supplier_name,
            SUM(poi.ord_qty) as total_ordered,
            COALESCE(SUM(dci.dispatch_qty), 0) as total_dispatched
        FROM purchase_orders po
        JOIN purchase_order_items poi ON po.po_number = poi.po_number
        LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
        GROUP BY po.po_number
        HAVING total_ordered = total_dispatched
    """).fetchall()
    
    for row in fully_dispatched:
        po_number = row["po_number"]
        
        # Check if already invoiced
        invoiced = db.execute("""
            SELECT COUNT(*) as count
            FROM gst_invoices
            WHERE po_numbers LIKE ?
        """, (f"%{po_number}%",)).fetchone()
        
        if invoiced["count"] == 0:
            # Check if alert already exists
            existing = db.execute("""
                SELECT id FROM alerts
                WHERE entity_type = 'PO' AND entity_id = ? AND alert_type = 'FULLY_DISPATCHED_NOT_INVOICED'
                AND is_acknowledged = 0
            """, (str(po_number),)).fetchone()
            
            if not existing:
                alert_id = str(uuid.uuid4())
                db.execute("""
                    INSERT INTO alerts (id, alert_type, entity_type, entity_id, message, severity)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    alert_id,
                    "FULLY_DISPATCHED_NOT_INVOICED",
                    "PO",
                    str(po_number),
                    f"PO {po_number} ({row['supplier_name']}) is fully dispatched but not yet invoiced",
                    "warning"
                ))
                alerts_created.append(alert_id)
    
    # Alert 2: DC without invoice after 7 days
    old_dcs = db.execute("""
        SELECT dc.dc_number, dc.dc_date, dc.consignee_name
        FROM delivery_challans dc
        LEFT JOIN gst_invoice_dc_links link ON dc.dc_number = link.dc_number
        WHERE link.id IS NULL
        AND dc.dc_date < date('now', '-7 days')
    """).fetchall()
    
    for row in old_dcs:
        existing = db.execute("""
            SELECT id FROM alerts
            WHERE entity_type = 'DC' AND entity_id = ? AND alert_type = 'DC_NOT_INVOICED'
            AND is_acknowledged = 0
        """, (row["dc_number"],)).fetchone()
        
        if not existing:
            alert_id = str(uuid.uuid4())
            db.execute("""
                INSERT INTO alerts (id, alert_type, entity_type, entity_id, message, severity)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                alert_id,
                "DC_NOT_INVOICED",
                "DC",
                row["dc_number"],
                f"DC {row['dc_number']} ({row['consignee_name']}) created {row['dc_date']} but not yet invoiced",
                "warning"
            ))
            alerts_created.append(alert_id)
    
    # Alert 3: DC created without PO
    orphan_dcs = db.execute("""
        SELECT dc_number, consignee_name
        FROM delivery_challans
        WHERE po_number IS NULL
    """).fetchall()
    
    for row in orphan_dcs:
        existing = db.execute("""
            SELECT id FROM alerts
            WHERE entity_type = 'DC' AND entity_id = ? AND alert_type = 'DC_WITHOUT_PO'
            AND is_acknowledged = 0
        """, (row["dc_number"],)).fetchone()
        
        if not existing:
            alert_id = str(uuid.uuid4())
            db.execute("""
                INSERT INTO alerts (id, alert_type, entity_type, entity_id, message, severity)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                alert_id,
                "DC_WITHOUT_PO",
                "DC",
                row["dc_number"],
                f"DC {row['dc_number']} ({row['consignee_name']}) created without PO link",
                "info"
            ))
            alerts_created.append(alert_id)
    
    db.commit()
    log_business_event("GENERATE", "ALERTS", f"batch_{len(alerts_created)}", metadata={"count": len(alerts_created)})
    
    return {
        "success": True,
        "alerts_created": len(alerts_created),
        "alert_ids": alerts_created
    }
