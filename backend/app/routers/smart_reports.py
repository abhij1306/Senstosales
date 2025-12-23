"""
Smart Reports API Endpoints
Provides aggregated data for AI-driven reports
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from app.db import get_db
from typing import Optional, Literal
import sqlite3
from datetime import datetime, timedelta
import json

router = APIRouter()

@router.get("/kpis")
def get_kpis(
    period: Literal["month", "quarter", "year"] = "month",
    db: sqlite3.Connection = Depends(get_db)
):
    """
    Get all KPIs - Returns ONLY numbers
    """
    try:
        # Calculate date range
        today = datetime.now()
        if period == "month":
            start_date = today.replace(day=1)
        elif period == "quarter":
            quarter_month = ((today.month - 1) // 3) * 3 + 1
            start_date = today.replace(month=quarter_month, day=1)
        else:  # year
            start_date = today.replace(month=1, day=1)
        
        start_date_str = start_date.strftime('%Y-%m-%d')
        
        # 1. Efficiency % = (total_dispatched / total_ordered) * 100
        eff_query = """
            SELECT 
                COALESCE(SUM(poi.ord_qty), 0) as total_ordered,
                COALESCE(SUM(dci.dispatch_qty), 0) as total_dispatched
            FROM purchase_order_items poi
            LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
            JOIN purchase_orders po ON poi.po_number = po.po_number
            WHERE po.po_date >= ?
        """
        eff_row = db.execute(eff_query, (start_date_str,)).fetchone()
        total_ordered = float(eff_row[0] or 0)
        total_dispatched = float(eff_row[1] or 0)
        efficiency_pct = round((total_dispatched / total_ordered * 100), 1) if total_ordered > 0 else 0.0
        
        # 2. Sales Total = SUM(invoice_amount)
        sales_query = """
            SELECT COALESCE(SUM(total_invoice_value), 0) as total_sales
            FROM gst_invoices
            WHERE invoice_date >= ?
        """
        sales_row = db.execute(sales_query, (start_date_str,)).fetchone()
        sales_total = float(sales_row[0] or 0)
        
        # 3. Pending Qty = SUM(ordered - dispatched)
        pending_query = """
            SELECT 
                COALESCE(SUM(poi.ord_qty), 0) as total_ordered,
                COALESCE(SUM(dci.dispatch_qty), 0) as total_dispatched
            FROM purchase_order_items poi
            LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
            JOIN purchase_orders po ON poi.po_number = po.po_number
            WHERE po.po_date >= ?
        """
        pending_row = db.execute(pending_query, (start_date_str,)).fetchone()
        pending_qty = int((pending_row[0] or 0) - (pending_row[1] or 0))
        
        # 4. Avg Lag (Days) = AVG(invoice_date - dc_date)
        lag_query = """
            SELECT AVG(julianday(i.invoice_date) - julianday(dc.dc_date)) as avg_lag
            FROM gst_invoices i
            JOIN delivery_challans dc ON i.linked_dc_numbers = dc.dc_number
            WHERE i.invoice_date >= ?
              AND i.invoice_date IS NOT NULL
              AND dc.dc_date IS NOT NULL
        """
        lag_row = db.execute(lag_query, (start_date_str,)).fetchone()
        avg_lag_days = round(float(lag_row[0] or 0), 1)
        
        # 5a. Uninvoiced DCs
        uninvoiced_query = """
            SELECT COUNT(DISTINCT dc.dc_number)
            FROM delivery_challans dc
            LEFT JOIN gst_invoices i ON dc.dc_number = i.linked_dc_numbers
            WHERE i.invoice_number IS NULL
              AND dc.dc_date >= ?
        """
        uninvoiced_row = db.execute(uninvoiced_query, (start_date_str,)).fetchone()
        uninvoiced_dcs = int(uninvoiced_row[0] or 0)
        
        # 5b. Overdue POs (30+ days with pending)
        overdue_query = """
            SELECT COUNT(DISTINCT po.po_number)
            FROM purchase_orders po
            WHERE po.po_date >= ?
              AND julianday('now') - julianday(po.po_date) > 30
              AND EXISTS (
                  SELECT 1 FROM purchase_order_items poi
                  LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
                  WHERE poi.po_number = po.po_number
                  GROUP BY poi.id
                  HAVING COALESCE(SUM(poi.ord_qty), 0) > COALESCE(SUM(dci.dispatch_qty), 0)
              )
        """
        overdue_row = db.execute(overdue_query, (start_date_str,)).fetchone()
        overdue_pos = int(overdue_row[0] or 0)
        
        return {
            "efficiency_pct": efficiency_pct,
            "sales_total": sales_total,
            "pending_qty": pending_qty,
            "avg_lag_days": avg_lag_days,
            "alerts": {
                "uninvoiced_dcs": uninvoiced_dcs,
                "overdue_pos": overdue_pos
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/summary")
def get_summary(
    range: Literal["month", "quarter", "year"] = "month",
    metric: str = "sales",
    db: sqlite3.Connection = Depends(get_db)
):
    """
    Get aggregated summary metrics
    """
    # Calculate date range
    today = datetime.now()
    if range == "month":
        start_date = today.replace(day=1)
    elif range == "quarter":
        quarter_month = ((today.month - 1) // 3) * 3 + 1
        start_date = today.replace(month=quarter_month, day=1)
    else:  # year
        start_date = today.replace(month=1, day=1)
    
    if metric == "sales":
        query = """
            SELECT 
                COUNT(DISTINCT i.invoice_number) as total_invoices,
                SUM(i.total_amount) as total_revenue,
                AVG(i.total_amount) as avg_invoice_value,
                COUNT(DISTINCT po.po_number) as unique_pos
            FROM invoices i
            LEFT JOIN delivery_challans dc ON i.dc_number = dc.dc_number
            LEFT JOIN purchase_orders po ON dc.po_number = po.po_number
            WHERE i.invoice_date >= ?
        """
        result = db.execute(query, (start_date.strftime('%Y-%m-%d'),)).fetchone()
        
        return {
            "period": range,
            "metric": "sales",
            "total_invoices": result[0] or 0,
            "total_revenue": float(result[1] or 0),
            "avg_invoice_value": float(result[2] or 0),
            "unique_pos": result[3] or 0,
            "start_date": start_date.strftime('%Y-%m-%d'),
            "end_date": today.strftime('%Y-%m-%d')
        }
    
    return {"error": "Metric not supported"}

@router.get("/fulfillment")
def get_fulfillment(
    range: Literal["month", "quarter", "year"] = "month",
    po_number: Optional[int] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """
    PO vs Delivered vs Pending analysis
    """
    today = datetime.now()
    if range == "month":
        start_date = today.replace(day=1)
    elif range == "quarter":
        quarter_month = ((today.month - 1) // 3) * 3 + 1
        start_date = today.replace(month=quarter_month, day=1)
    else:
        start_date = today.replace(month=1, day=1)
    
    query = """
        SELECT 
            po.po_number,
            po.supplier_name,
            SUM(poi.ord_qty) as total_ordered,
            COALESCE(SUM(dci.dispatch_qty), 0) as total_dispatched,
            SUM(poi.ord_qty) - COALESCE(SUM(dci.dispatch_qty), 0) as pending,
            CAST((COALESCE(SUM(dci.dispatch_qty), 0) * 100.0 / SUM(poi.ord_qty)) AS INTEGER) as fulfillment_pct
        FROM purchase_orders po
        JOIN purchase_order_items poi ON po.po_number = poi.po_number
        LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
        WHERE po.po_date >= ?
    """
    
    params = [start_date.strftime('%Y-%m-%d')]
    
    if po_number:
        query += " AND po.po_number = ?"
        params.append(po_number)
    
    query += " GROUP BY po.po_number ORDER BY pending DESC"
    
    rows = db.execute(query, params).fetchall()
    
    return {
        "period": range,
        "data": [
            {
                "po_number": row[0],
                "supplier": row[1],
                "ordered": row[2],
                "dispatched": row[3],
                "pending": row[4],
                "fulfillment_pct": row[5]
            }
            for row in rows
        ]
    }

@router.get("/pending")
def get_pending(db: sqlite3.Connection = Depends(get_db)):
    """
    Get all pending dispatch items
    """
    query = """
        SELECT 
            po.po_number,
            poi.po_item_no,
            poi.material_description,
            poi.ord_qty,
            COALESCE(SUM(dci.dispatch_qty), 0) as dispatched,
            poi.ord_qty - COALESCE(SUM(dci.dispatch_qty), 0) as pending,
            CAST((julianday('now') - julianday(po.po_date)) AS INTEGER) as age_days,
            po.supplier_name
        FROM purchase_orders po
        JOIN purchase_order_items poi ON po.po_number = poi.po_number
        LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
        GROUP BY po.po_number, poi.po_item_no
        HAVING pending > 0
        ORDER BY age_days DESC, pending DESC
        LIMIT 100
    """
    
    rows = db.execute(query).fetchall()
    
    return {
        "total_pending_items": len(rows),
        "items": [
            {
                "po_number": row[0],
                "item_no": row[1],
                "description": row[2],
                "ordered": row[3],
                "dispatched": row[4],
                "pending": row[5],
                "age_days": row[6],
                "supplier": row[7]
            }
            for row in rows
        ]
    }

@router.get("/item-wise")
def get_item_wise(db: sqlite3.Connection = Depends(get_db)):
    """
    Item-wise analysis
    """
    query = """
        SELECT 
            poi.material_description,
            poi.material_code,
            COUNT(DISTINCT po.po_number) as po_count,
            SUM(poi.ord_qty) as total_ordered,
            COALESCE(SUM(dci.dispatch_qty), 0) as total_dispatched,
            SUM(poi.ord_qty) - COALESCE(SUM(dci.dispatch_qty), 0) as pending
        FROM purchase_order_items poi
        JOIN purchase_orders po ON poi.po_number = po.po_number
        LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
        GROUP BY poi.material_description, poi.material_code
        ORDER BY total_ordered DESC
        LIMIT 50
    """
    
    rows = db.execute(query).fetchall()
    
    return {
        "items": [
            {
                "description": row[0],
                "code": row[1],
                "po_count": row[2],
                "ordered": row[3],
                "dispatched": row[4],
                "pending": row[5]
            }
            for row in rows
        ]
    }

@router.get("/exports")
def get_exports(db: sqlite3.Connection = Depends(get_db)):
    """
    Get recent report exports
    TODO: Implement real exports tracking table
    """
    # Return empty until exports table is implemented
    return {"exports": []}

@router.get("/date-summary")
def get_date_summary(
    entity: Literal["po", "challan", "invoice"],
    start_date: str,
    end_date: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """
    Get date-wise summary for PO/Challan/Invoice
    
    Args:
        entity: Type of summary (po | challan | invoice)
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
    
    Returns:
        {
            "entity": "po",
            "period": {"start": "...", "end": "..."},
            "rows": [...],
            "totals": {...}
        }
    """
    try:
        if entity == "po":
            # PO Summary: Filter by po_date
            # Database stores dates as DD/MM/YYYY, need to convert for comparison
            query = """
                SELECT 
                    po.po_number,
                    po.po_date,
                    COALESCE(SUM(poi.ord_qty), 0) as total_ordered,
                    COALESCE(SUM(dci.dispatch_qty), 0) as total_dispatched,
                    COALESCE(SUM(poi.ord_qty), 0) - COALESCE(SUM(dci.dispatch_qty), 0) as pending_qty,
                    CASE 
                        WHEN COALESCE(SUM(dci.dispatch_qty), 0) = 0 THEN 'Not Started'
                        WHEN COALESCE(SUM(dci.dispatch_qty), 0) >= COALESCE(SUM(poi.ord_qty), 0) THEN 'Completed'
                        ELSE 'In Progress'
                    END as status,
                    po.supplier_name
                FROM purchase_orders po
                LEFT JOIN purchase_order_items poi ON po.po_number = poi.po_number
                LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
                WHERE date(substr(po.po_date, 7, 4) || '-' || substr(po.po_date, 4, 2) || '-' || substr(po.po_date, 1, 2)) 
                      BETWEEN date(?) AND date(?)
                GROUP BY po.po_number, po.po_date, po.supplier_name
                ORDER BY date(substr(po.po_date, 7, 4) || '-' || substr(po.po_date, 4, 2) || '-' || substr(po.po_date, 1, 2)) DESC
            """
            rows = db.execute(query, (start_date, end_date)).fetchall()
            
            # Calculate totals
            total_pos = len(rows)
            total_ordered = sum(row[2] for row in rows)
            total_dispatched = sum(row[3] for row in rows)
            total_pending = sum(row[4] for row in rows)
            
            return {
                "entity": "po",
                "period": {"start": start_date, "end": end_date},
                "rows": [
                    {
                        "po_number": row[0],
                        "po_date": row[1],
                        "total_ordered": row[2],
                        "total_dispatched": row[3],
                        "pending_qty": row[4],
                        "status": row[5],
                        "supplier_name": row[6]
                    }
                    for row in rows
                ],
                "totals": {
                    "total_pos": total_pos,
                    "total_ordered": int(total_ordered),
                    "total_dispatched": int(total_dispatched),
                    "total_pending": int(total_pending)
                }
            }
            
        elif entity == "challan":
            # Challan Summary: Filter by dc_date
            # Database stores dates as YYYY-MM-DD (no conversion needed)
            query = """
                SELECT 
                    dc.dc_number,
                    dc.dc_date,
                    dc.po_number,
                    COALESCE(SUM(dci.dispatch_qty), 0) as dispatched_qty,
                    CASE 
                        WHEN i.invoice_number IS NOT NULL THEN 'Invoiced'
                        ELSE 'Not Invoiced'
                    END as invoice_status
                FROM delivery_challans dc
                LEFT JOIN delivery_challan_items dci ON dc.dc_number = dci.dc_number
                LEFT JOIN gst_invoices i ON dc.dc_number = i.linked_dc_numbers
                WHERE dc.dc_date BETWEEN ? AND ?
                GROUP BY dc.dc_number, dc.dc_date, dc.po_number, i.invoice_number
                ORDER BY dc.dc_date DESC
            """
            rows = db.execute(query, (start_date, end_date)).fetchall()
            
            # Calculate totals
            total_challans = len(rows)
            total_dispatched = sum(row[3] for row in rows)
            uninvoiced_count = sum(1 for row in rows if row[4] == 'Not Invoiced')
            
            return {
                "entity": "challan",
                "period": {"start": start_date, "end": end_date},
                "rows": [
                    {
                        "dc_number": row[0],
                        "dc_date": row[1],
                        "po_number": row[2],
                        "dispatched_qty": row[3],
                        "invoice_status": row[4]
                    }
                    for row in rows
                ],
                "totals": {
                    "total_challans": total_challans,
                    "total_dispatched": int(total_dispatched),
                    "uninvoiced_count": uninvoiced_count
                }
            }
            
        elif entity == "invoice":
            # Invoice Summary: Filter by invoice_date
            # Database stores dates as YYYY-MM-DD (no conversion needed)
            query = """
                SELECT 
                    i.invoice_number,
                    i.invoice_date,
                    i.linked_dc_numbers,
                    COALESCE(i.total_invoice_value, 0) as invoice_value,
                    po.supplier_name as party_name
                FROM gst_invoices i
                LEFT JOIN delivery_challans dc ON i.linked_dc_numbers = dc.dc_number
                LEFT JOIN purchase_orders po ON dc.po_number = po.po_number
                WHERE i.invoice_date BETWEEN ? AND ?
                ORDER BY i.invoice_date DESC
            """
            rows = db.execute(query, (start_date, end_date)).fetchall()
            
            # Calculate totals
            total_invoices = len(rows)
            total_value = sum(row[3] for row in rows)
            avg_value = total_value / total_invoices if total_invoices > 0 else 0
            
            return {
                "entity": "invoice",
                "period": {"start": start_date, "end": end_date},
                "rows": [
                    {
                        "invoice_number": row[0],
                        "invoice_date": row[1],
                        "linked_dc_numbers": row[2],
                        "invoice_value": float(row[3]),
                        "party_name": row[4]
                    }
                    for row in rows
                ],
                "totals": {
                    "total_invoices": total_invoices,
                    "total_value": float(total_value),
                    "avg_value": float(avg_value)
                }
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Invalid entity type: {entity}")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/date-summary/export")
def export_date_summary(
    entity: Literal["po", "challan", "invoice"],
    start_date: str,
    end_date: str,
    db: sqlite3.Connection = Depends(get_db)
):
    """
    Export date-wise summary to Excel using ExcelService.
    """
    from fastapi.responses import StreamingResponse
    from app.services.excel_service import ExcelService
    
    try:
        # Reuse the existing data fetching logic
        summary_data = get_date_summary(entity, start_date, end_date, db)
        rows = summary_data.get("rows", [])
        
        # Prepare filename
        filename = f"{entity.upper()}_Summary_{start_date}_to_{end_date}.xlsx"
        
        # Generate Excel
        excel_file = ExcelService.generate_date_summary_excel(entity, start_date, end_date, rows)
        
        return StreamingResponse(
            excel_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel

class GenerateReportRequest(BaseModel):
    report_type: str
    format: Literal["pdf", "xlsx", "docx"] = "pdf"

@router.post("/generate")
async def generate_report(
    request: GenerateReportRequest,
    db: sqlite3.Connection = Depends(get_db)
):
    """
    Generate a report file
    """
    # This will be implemented with actual file generation
    # For now, return success
    return {
        "success": True,
        "report_type": request.report_type,
        "format": request.format,
        "file_path": f"/exports/{request.report_type}_{datetime.now().strftime('%Y%m%d')}.{request.format}",
        "message": f"Report '{request.report_type}' generated successfully"
    }


@router.get("/insight-strip")
def get_insights(db: sqlite3.Connection = Depends(get_db)):
    """
    Get deterministic insights for the dashboard morning briefing.
    Returns a list of actionable insights sorted by priority.
    """
    insights = []
    
    try:
        # 1. New Orders Today
        new_pos = db.execute("""
            SELECT COUNT(*) FROM purchase_orders 
            WHERE date(created_at) = date('now')
        """).fetchone()[0]
        
        if new_pos > 0:
            insights.append({
                "type": "success",
                "text": f"{new_pos} new Purchase Order{'s' if new_pos > 1 else ''} received today.",
                "action": "view_pos"
            })
            
        # 2. Uninvoiced Challans (High Priority)
        uninvoiced = db.execute("""
            SELECT COUNT(DISTINCT dc.dc_number)
            FROM delivery_challans dc
            LEFT JOIN gst_invoices i ON dc.dc_number = i.linked_dc_numbers
            WHERE i.invoice_number IS NULL
        """).fetchone()[0]
        
        if uninvoiced > 0:
            insights.append({
                "type": "warning",
                "text": f"{uninvoiced} Delivery Challan{'s' if uninvoiced > 1 else ''} pending for invoicing.",
                "action": "view_uninvoiced"
            })
            
        # 3. Pending Dispatch Items
        pending_items = db.execute("""
            SELECT COUNT(poi.id)
            FROM purchase_order_items poi
            LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
            GROUP BY poi.id
            HAVING COALESCE(SUM(poi.ord_qty), 0) > COALESCE(SUM(dci.dispatch_qty), 0)
        """).fetchall()
        
        pending_count = len(pending_items)
        if pending_count > 0:
             insights.append({
                "type": "warning",
                "text": f"{pending_count} items pending dispatch across active POs.",
                "action": "view_pending"
            })

        # 4. Sales Milestone (Positive Reinforcement)
        sales_today = db.execute("""
            SELECT SUM(total_invoice_value) FROM gst_invoices 
            WHERE date(invoice_date) = date('now')
        """).fetchone()[0] or 0
        
        if sales_today > 0:
            insights.append({
                "type": "success",
                "text": f"Today's Sales: ₹{sales_today:,.2f}",
                "action": "view_invoices"
            })

        # Fallback if quiet day
        if not insights:
            insights.append({
                "type": "success",
                "text": "All operations are running smoothly. No urgent alerts.",
                "action": "view_reports"
            })
            
        return insights[:3] # Return top 3 most relevant
        
    except Exception as e:
        print(f"Error generating insights: {e}")
        return [{
            "type": "error",
            "text": "Could not load morning briefing.",
            "action": "none"
        }]
