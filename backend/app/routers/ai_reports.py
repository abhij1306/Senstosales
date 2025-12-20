"""
AI-Powered Report Endpoints
Provides computed aggregations for AI summary generation
"""
from fastapi import APIRouter, Depends, HTTPException
from app.db import get_db
from typing import Literal
import sqlite3
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

@router.get("/monthly-summary")
def get_monthly_summary(
    period: Literal["month", "quarter", "year"] = "month",
    db: sqlite3.Connection = Depends(get_db)
):
    """
    Monthly Summary Report - Aggregated metrics with PO breakdown
    Returns computed data for AI summary generation
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
        end_date_str = today.strftime('%Y-%m-%d')
        
        # Overall metrics
        metrics_query = """
            SELECT 
                COALESCE(SUM(poi.ord_qty), 0) as total_ordered_qty,
                COALESCE(SUM(dci.dispatch_qty), 0) as total_dispatched_qty,
                COALESCE(SUM(poi.ord_qty) - SUM(dci.dispatch_qty), 0) as pending_qty
            FROM purchase_order_items poi
            LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
            JOIN purchase_orders po ON poi.po_number = po.po_number
            WHERE po.po_date >= ?
        """
        metrics_row = db.execute(metrics_query, (start_date_str,)).fetchone()
        
        # Total invoiced value
        invoiced_query = """
            SELECT COALESCE(SUM(total_invoice_value), 0)
            FROM gst_invoices
            WHERE invoice_date >= ?
        """
        invoiced_row = db.execute(invoiced_query, (start_date_str,)).fetchone()
        
        total_ordered = float(metrics_row[0] or 0)
        total_dispatched = float(metrics_row[1] or 0)
        pending_qty = float(metrics_row[2] or 0)
        total_invoiced = float(invoiced_row[0] or 0)
        efficiency_pct = round((total_dispatched / total_ordered * 100), 1) if total_ordered > 0 else 0.0
        
        # PO breakdown
        po_breakdown_query = """
            SELECT 
                po.po_number,
                po.supplier_name,
                SUM(poi.ord_qty) as ordered,
                COALESCE(SUM(dci.dispatch_qty), 0) as dispatched,
                SUM(poi.ord_qty) - COALESCE(SUM(dci.dispatch_qty), 0) as pending
            FROM purchase_orders po
            JOIN purchase_order_items poi ON po.po_number = poi.po_number
            LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
            WHERE po.po_date >= ?
            GROUP BY po.po_number, po.supplier_name
            ORDER BY pending DESC
        """
        po_rows = db.execute(po_breakdown_query, (start_date_str,)).fetchall()
        
        return {
            "period": period,
            "start_date": start_date_str,
            "end_date": end_date_str,
            "metrics": {
                "total_ordered_qty": int(total_ordered),
                "total_dispatched_qty": int(total_dispatched),
                "total_invoiced_value": total_invoiced,
                "pending_qty": int(pending_qty),
                "efficiency_pct": efficiency_pct
            },
            "po_breakdown": [
                {
                    "po_number": row[0],
                    "supplier_name": row[1],
                    "ordered": int(row[2]),
                    "dispatched": int(row[3]),
                    "pending": int(row[4]),
                    "percentage_of_total": round((row[4] / pending_qty * 100), 1) if pending_qty > 0 else 0
                }
                for row in po_rows
            ]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pending-analysis")
def get_pending_analysis(
    period: Literal["month", "quarter", "year"] = "month",
    db: sqlite3.Connection = Depends(get_db)
):
    """
    Pending Analysis Report - Detailed breakdown by PO with age buckets
    """
    try:
        # Calculate date range
        today = datetime.now()
        if period == "month":
            start_date = today.replace(day=1)
        elif period == "quarter":
            quarter_month = ((today.month - 1) // 3) * 3 + 1
            start_date = today.replace(month=quarter_month, day=1)
        else:
            start_date = today.replace(month=1, day=1)
        
        start_date_str = start_date.strftime('%Y-%m-%d')
        
        # Pending by PO with age
        pending_query = """
            SELECT 
                po.po_number,
                po.supplier_name,
                SUM(poi.ord_qty) - COALESCE(SUM(dci.dispatch_qty), 0) as pending_qty,
                CAST(julianday('now') - julianday(po.po_date) AS INTEGER) as age_days,
                po.po_date
            FROM purchase_orders po
            JOIN purchase_order_items poi ON po.po_number = poi.po_number
            LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
            WHERE po.po_date >= ?
            GROUP BY po.po_number, po.supplier_name, po.po_date
            HAVING pending_qty > 0
            ORDER BY pending_qty DESC
        """
        pending_rows = db.execute(pending_query, (start_date_str,)).fetchall()
        
        total_pending = sum(row[2] for row in pending_rows)
        
        # Age buckets
        age_0_7 = sum(row[2] for row in pending_rows if row[3] <= 7)
        age_8_30 = sum(row[2] for row in pending_rows if 8 <= row[3] <= 30)
        age_30_plus = sum(row[2] for row in pending_rows if row[3] > 30)
        
        return {
            "total_pending_qty": int(total_pending),
            "by_po": [
                {
                    "po_number": row[0],
                    "supplier_name": row[1],
                    "pending_qty": int(row[2]),
                    "age_days": row[3],
                    "po_date": row[4],
                    "percentage_of_total": round((row[2] / total_pending * 100), 1) if total_pending > 0 else 0
                }
                for row in pending_rows
            ],
            "age_buckets": {
                "0_7_days": int(age_0_7),
                "8_30_days": int(age_8_30),
                "30_plus_days": int(age_30_plus)
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/billing-lag")
def get_billing_lag(
    period: Literal["month", "quarter", "year"] = "month",
    db: sqlite3.Connection = Depends(get_db)
):
    """
    Billing & Lag Report - Uninvoiced DCs and invoice lag statistics
    """
    try:
        # Calculate date range
        today = datetime.now()
        if period == "month":
            start_date = today.replace(day=1)
        elif period == "quarter":
            quarter_month = ((today.month - 1) // 3) * 3 + 1
            start_date = today.replace(month=quarter_month, day=1)
        else:
            start_date = today.replace(month=1, day=1)
        
        start_date_str = start_date.strftime('%Y-%m-%d')
        
        # Uninvoiced DCs
        uninvoiced_query = """
            SELECT 
                dc.dc_number,
                dc.dc_date,
                dc.po_number,
                CAST(julianday('now') - julianday(dc.dc_date) AS INTEGER) as age_days
            FROM delivery_challans dc
            LEFT JOIN gst_invoices i ON dc.dc_number = i.linked_dc_numbers
            WHERE i.invoice_number IS NULL
              AND dc.dc_date >= ?
            ORDER BY dc.dc_date DESC
        """
        uninvoiced_rows = db.execute(uninvoiced_query, (start_date_str,)).fetchall()
        
        # Invoice lag statistics
        lag_query = """
            SELECT 
                CAST(julianday(i.invoice_date) - julianday(dc.dc_date) AS INTEGER) as lag_days
            FROM gst_invoices i
            JOIN delivery_challans dc ON i.linked_dc_numbers = dc.dc_number
            WHERE i.invoice_date >= ?
              AND i.invoice_date IS NOT NULL
              AND dc.dc_date IS NOT NULL
        """
        lag_rows = db.execute(lag_query, (start_date_str,)).fetchall()
        
        lag_values = [row[0] for row in lag_rows if row[0] is not None]
        avg_lag = round(sum(lag_values) / len(lag_values), 1) if lag_values else 0.0
        
        # Lag distribution
        zero_lag = sum(1 for lag in lag_values if lag == 0)
        lag_1_7 = sum(1 for lag in lag_values if 1 <= lag <= 7)
        lag_8_plus = sum(1 for lag in lag_values if lag > 7)
        
        return {
            "uninvoiced_dcs": [
                {
                    "dc_number": row[0],
                    "dc_date": row[1],
                    "po_number": row[2],
                    "age_days": row[3]
                }
                for row in uninvoiced_rows
            ],
            "avg_lag_days": avg_lag,
            "lag_distribution": {
                "zero_lag": zero_lag,
                "1_7_days": lag_1_7,
                "8_plus_days": lag_8_plus
            },
            "total_invoiced_dcs": len(lag_values)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))




@router.get("/po-health-summary")
def get_po_health_summary(
    period: Literal["month", "quarter", "year"] = "month",
    db: sqlite3.Connection = Depends(get_db)
):
    """
    PO Health Summary Report - One row per PO with complete status
    PRIMARY REPORT: POs are the analytical anchor
    """
    try:
        # Calculate date range
        today = datetime.now()
        if period == "month":
            start_date = today.replace(day=1)
        elif period == "quarter":
            quarter_month = ((today.month - 1) // 3) * 3 + 1
            start_date = today.replace(month=quarter_month, day=1)
        else:
            start_date = today.replace(month=1, day=1)
        
        start_date_str = start_date.strftime('%Y-%m-%d')
        
        # PO-level health metrics
        po_health_query = """
            SELECT 
                po.po_number,
                po.supplier_name,
                po.po_date,
                po.po_value,
                SUM(poi.ord_qty) as total_ordered_qty,
                COALESCE(SUM(dci.dispatch_qty), 0) as dispatched_qty,
                SUM(poi.ord_qty) - COALESCE(SUM(dci.dispatch_qty), 0) as pending_qty,
                CAST(julianday('now') - julianday(po.po_date) AS INTEGER) as po_age_days,
                CASE 
                    WHEN COALESCE(SUM(dci.dispatch_qty), 0) = 0 THEN 'NOT_STARTED'
                    WHEN COALESCE(SUM(dci.dispatch_qty), 0) < SUM(poi.ord_qty) THEN 'PARTIALLY_DISPATCHED'
                    ELSE 'FULLY_DISPATCHED'
                END as fulfillment_status,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM gst_invoices i 
                        WHERE i.po_numbers LIKE '%' || po.po_number || '%'
                    ) THEN 'INVOICED'
                    ELSE 'NOT_INVOICED'
                END as invoice_status
            FROM purchase_orders po
            JOIN purchase_order_items poi ON po.po_number = poi.po_number
            LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
            WHERE po.po_date >= ?
            GROUP BY po.po_number, po.supplier_name, po.po_date, po.po_value
            ORDER BY pending_qty DESC, po_age_days DESC
        """
        po_rows = db.execute(po_health_query, (start_date_str,)).fetchall()
        
        # Summary stats
        total_pos = len(po_rows)
        not_started = sum(1 for row in po_rows if row[8] == 'NOT_STARTED')
        partially_dispatched = sum(1 for row in po_rows if row[8] == 'PARTIALLY_DISPATCHED')
        fully_dispatched = sum(1 for row in po_rows if row[8] == 'FULLY_DISPATCHED')
        
        return {
            "period": period,
            "summary": {
                "total_pos": total_pos,
                "not_started": not_started,
                "partially_dispatched": partially_dispatched,
                "fully_dispatched": fully_dispatched
            },
            "pos": [
                {
                    "po_number": row[0],
                    "supplier_name": row[1],
                    "po_date": row[2],
                    "po_value": float(row[3] or 0),
                    "ordered_qty": int(row[4]),
                    "dispatched_qty": int(row[5]),
                    "pending_qty": int(row[6]),
                    "po_age_days": row[7],
                    "fulfillment_status": row[8],
                    "invoice_status": row[9],
                    "fulfillment_pct": round((row[5] / row[4] * 100), 1) if row[4] > 0 else 0
                }
                for row in po_rows
            ]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/po-aging-risk")
def get_po_aging_risk(
    period: Literal["month", "quarter", "year"] = "month",
    db: sqlite3.Connection = Depends(get_db)
):
    """
    PO Aging & Risk Report - Age buckets with pending quantity distribution
    """
    try:
        # Calculate date range
        today = datetime.now()
        if period == "month":
            start_date = today.replace(day=1)
        elif period == "quarter":
            quarter_month = ((today.month - 1) // 3) * 3 + 1
            start_date = today.replace(month=quarter_month, day=1)
        else:
            start_date = today.replace(month=1, day=1)
        
        start_date_str = start_date.strftime('%Y-%m-%d')
        
        # POs with age and pending
        aging_query = """
            SELECT 
                po.po_number,
                CAST(julianday('now') - julianday(po.po_date) AS INTEGER) as age_days,
                SUM(poi.ord_qty) - COALESCE(SUM(dci.dispatch_qty), 0) as pending_qty
            FROM purchase_orders po
            JOIN purchase_order_items poi ON po.po_number = poi.po_number
            LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
            WHERE po.po_date >= ?
            GROUP BY po.po_number, po.po_date
            HAVING pending_qty > 0
        """
        aging_rows = db.execute(aging_query, (start_date_str,)).fetchall()
        
        # Categorize by age buckets (handle None values)
        bucket_0_7 = [(row[0], row[2]) for row in aging_rows if row[1] is not None and row[1] <= 7]
        bucket_8_30 = [(row[0], row[2]) for row in aging_rows if row[1] is not None and 8 <= row[1] <= 30]
        bucket_30_plus = [(row[0], row[2]) for row in aging_rows if row[1] is not None and row[1] > 30]
        
        total_pending = sum(row[2] for row in aging_rows if row[2] is not None)
        
        return {
            "period": period,
            "age_buckets": {
                "0_7_days": {
                    "po_count": len(bucket_0_7),
                    "pending_qty": sum(qty for _, qty in bucket_0_7),
                    "percentage": round((sum(qty for _, qty in bucket_0_7) / total_pending * 100), 1) if total_pending > 0 else 0,
                    "pos": [po for po, _ in bucket_0_7]
                },
                "8_30_days": {
                    "po_count": len(bucket_8_30),
                    "pending_qty": sum(qty for _, qty in bucket_8_30),
                    "percentage": round((sum(qty for _, qty in bucket_8_30) / total_pending * 100), 1) if total_pending > 0 else 0,
                    "pos": [po for po, _ in bucket_8_30]
                },
                "30_plus_days": {
                    "po_count": len(bucket_30_plus),
                    "pending_qty": sum(qty for _, qty in bucket_30_plus),
                    "percentage": round((sum(qty for _, qty in bucket_30_plus) / total_pending * 100), 1) if total_pending > 0 else 0,
                    "pos": [po for po, _ in bucket_30_plus]
                }
            },
            "total_pending_qty": int(total_pending)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/po-fulfillment-efficiency")
def get_po_fulfillment_efficiency(
    period: Literal["month", "quarter", "year"] = "month",
    db: sqlite3.Connection = Depends(get_db)
):
    """
    PO Fulfillment Efficiency Report - Fulfillment % per PO
    """
    try:
        # Calculate date range
        today = datetime.now()
        if period == "month":
            start_date = today.replace(day=1)
        elif period == "quarter":
            quarter_month = ((today.month - 1) // 3) * 3 + 1
            start_date = today.replace(month=quarter_month, day=1)
        else:
            start_date = today.replace(month=1, day=1)
        
        start_date_str = start_date.strftime('%Y-%m-%d')
        
        # Fulfillment % per PO
        efficiency_query = """
            SELECT 
                po.po_number,
                po.supplier_name,
                SUM(poi.ord_qty) as ordered,
                COALESCE(SUM(dci.dispatch_qty), 0) as dispatched,
                CAST((COALESCE(SUM(dci.dispatch_qty), 0) * 100.0 / SUM(poi.ord_qty)) AS INTEGER) as fulfillment_pct
            FROM purchase_orders po
            JOIN purchase_order_items poi ON po.po_number = poi.po_number
            LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
            WHERE po.po_date >= ?
            GROUP BY po.po_number, po.supplier_name
            ORDER BY fulfillment_pct DESC
        """
        efficiency_rows = db.execute(efficiency_query, (start_date_str,)).fetchall()
        
        # Find best/worst
        best_po = efficiency_rows[0] if efficiency_rows else None
        worst_po = efficiency_rows[-1] if efficiency_rows else None
        zero_fulfillment = [row for row in efficiency_rows if row[4] == 0]
        
        return {
            "period": period,
            "pos": [
                {
                    "po_number": row[0],
                    "supplier_name": row[1],
                    "ordered": int(row[2]),
                    "dispatched": int(row[3]),
                    "fulfillment_pct": row[4]
                }
                for row in efficiency_rows
            ],
            "insights": {
                "best_po": {
                    "po_number": best_po[0] if best_po else None,
                    "fulfillment_pct": best_po[4] if best_po else 0
                },
                "worst_po": {
                    "po_number": worst_po[0] if worst_po else None,
                    "fulfillment_pct": worst_po[4] if worst_po else 0
                },
                "zero_fulfillment_count": len(zero_fulfillment),
                "zero_fulfillment_pos": [row[0] for row in zero_fulfillment]
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/po-dependency-analysis")
def get_po_dependency_analysis(
    period: Literal["month", "quarter", "year"] = "month",
    db: sqlite3.Connection = Depends(get_db)
):
    """
    PO Dependency Analysis - DC and Invoice coverage per PO
    Shows which POs are blocking billing
    """
    try:
        # Calculate date range
        today = datetime.now()
        if period == "month":
            start_date = today.replace(day=1)
        elif period == "quarter":
            quarter_month = ((today.month - 1) // 3) * 3 + 1
            start_date = today.replace(month=quarter_month, day=1)
        else:
            start_date = today.replace(month=1, day=1)
        
        start_date_str = start_date.strftime('%Y-%m-%d')
        
        # PO coverage analysis
        coverage_query = """
            SELECT 
                po.po_number,
                po.supplier_name,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM delivery_challan_items dci
                        JOIN purchase_order_items poi ON dci.po_item_id = poi.id
                        WHERE poi.po_number = po.po_number
                    ) THEN 'HAS_DC'
                    ELSE 'NO_DC'
                END as dc_status,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM gst_invoices i 
                        WHERE i.po_numbers LIKE '%' || po.po_number || '%'
                    ) THEN 'HAS_INVOICE'
                    ELSE 'NO_INVOICE'
                END as invoice_status
            FROM purchase_orders po
            WHERE po.po_date >= ?
        """
        coverage_rows = db.execute(coverage_query, (start_date_str,)).fetchall()
        
        # Categorize
        no_dc = [row for row in coverage_rows if row[2] == 'NO_DC']
        dc_but_no_invoice = [row for row in coverage_rows if row[2] == 'HAS_DC' and row[3] == 'NO_INVOICE']
        fully_invoiced = [row for row in coverage_rows if row[3] == 'HAS_INVOICE']
        
        return {
            "period": period,
            "coverage": {
                "no_dc": {
                    "count": len(no_dc),
                    "pos": [{"po_number": row[0], "supplier": row[1]} for row in no_dc]
                },
                "dc_but_no_invoice": {
                    "count": len(dc_but_no_invoice),
                    "pos": [{"po_number": row[0], "supplier": row[1]} for row in dc_but_no_invoice]
                },
                "fully_invoiced": {
                    "count": len(fully_invoiced),
                    "pos": [{"po_number": row[0], "supplier": row[1]} for row in fully_invoiced]
                }
            },
            "total_pos": len(coverage_rows)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class GenerateSummaryRequest(BaseModel):
    report_type: Literal["monthly_summary", "pending_analysis", "billing_lag", "po_health", "po_aging", "po_efficiency", "po_dependency"]
    period: str
    data: dict

@router.post("/generate-summary")
async def generate_ai_summary(
    request: GenerateSummaryRequest,
    db: sqlite3.Connection = Depends(get_db)
):
    """
    Generate AI summary from report data using LLM
    PO-CENTRIC: All summaries reference PO numbers explicitly
    """
    try:
        import os
        import httpx
        
        # Get API key
        api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            return {
                "summary": "AI summary unavailable: No API key configured.",
                "error": "missing_api_key"
            }
        
        # Build PO-centric prompts
        if request.report_type == "po_health":
            summary_data = request.data.get("summary", {})
            pos = request.data.get("pos", [])
            top_pending = pos[0] if pos else None
            
            prompt = f"""Analyze PO data: {summary_data.get('total_pos', 0)} total, {summary_data.get('not_started', 0)} not started, {summary_data.get('partially_dispatched', 0)} in progress, {summary_data.get('fully_dispatched', 0)} completed. Top pending: PO {top_pending['po_number'] if top_pending else 'N/A'} ({top_pending['pending_qty'] if top_pending else 0:,} units, {top_pending['po_age_days'] if top_pending else 0} days old). Write 1-2 concise sentences: identify main issue and what needs attention."""

        elif request.report_type == "po_aging":
            buckets = request.data.get("age_buckets", {})
            bucket_30_plus = buckets.get("30_plus_days", {})
            
            prompt = f"""Aging: {buckets.get('0_7_days', {}).get('pending_qty', 0):,} units (0-7d), {buckets.get('8_30_days', {}).get('pending_qty', 0):,} units (8-30d), {bucket_30_plus.get('pending_qty', 0):,} units 30+ days ({bucket_30_plus.get('percentage', 0)}%). Write 1 sentence: where backlog is concentrated and if it's concerning."""

        elif request.report_type == "po_efficiency":
            insights = request.data.get("insights", {})
            zero_count = insights.get("zero_fulfillment_count", 0)
            best_po = insights.get("best_po", {})
            worst_po = insights.get("worst_po", {})
            
            prompt = f"""Dispatch: Best PO {best_po.get('po_number', 'N/A')} ({best_po.get('fulfillment_pct', 0)}%), Worst PO {worst_po.get('po_number', 'N/A')} ({worst_po.get('fulfillment_pct', 0)}%), {zero_count} POs with zero dispatch. Write 1-2 sentences: performance status and action needed."""

        elif request.report_type == "po_dependency":
            coverage = request.data.get("coverage", {})
            no_dc = coverage.get("no_dc", {}).get("count", 0)
            dc_no_inv = coverage.get("dc_but_no_invoice", {}).get("count", 0)
            
            prompt = f"""Pipeline: {no_dc} POs awaiting dispatch, {dc_no_inv} POs awaiting invoice. Write 1 sentence: where the bottleneck is and next action."""

        else:  # Original reports (monthly_summary, etc.)
            # Keep existing prompts for non-PO reports
            metrics = request.data.get("metrics", {})
            prompt = f"""You are analyzing sales data for a manufacturing company.

Period: {request.period}
Metrics:
- Total Ordered: {metrics.get('total_ordered_qty', 0):,} units
- Total Dispatched: {metrics.get('total_dispatched_qty', 0):,} units
- Total Invoiced: ₹{metrics.get('total_invoiced_value', 0):,.2f}
- Pending: {metrics.get('pending_qty', 0):,} units
- Efficiency: {metrics.get('efficiency_pct', 0)}%

Generate a 2-3 sentence summary that:
1. States the key finding
2. Identifies the primary issue
3. Avoids speculation

Be factual. If data is missing, state it clearly."""

        # Call LLM
        if "GROQ_API_KEY" in os.environ:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 200
            }
        else:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": "meta-llama/llama-3.1-8b-instruct:free",
                "messages": [{"role": "user", "content": prompt}]
            }
        
        async with httpx.AsyncClient(trust_env=False) as client:
            response = await client.post(url, headers=headers, json=payload, timeout=30.0)
            response.raise_for_status()
            result = response.json()
            summary = result["choices"][0]["message"]["content"].strip()
        
        return {"summary": summary}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "summary": f"AI summary unavailable due to error: {str(e)}",
            "error": str(e)
        }
