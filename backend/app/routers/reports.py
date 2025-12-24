"""
Reports Router - Unified Deterministic Reporting
Routes requests to report_service and handles file exports.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from app.db import get_db
from app.services import report_service
import sqlite3
import pandas as pd
import io
from typing import Optional, List

router = APIRouter()

def export_df_to_excel(df: pd.DataFrame, filename: str) -> StreamingResponse:
    """Helper to stream DataFrame as Excel"""
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Report')
        # Auto-adjust columns
        worksheet = writer.sheets['Report']
        for i, col in enumerate(df.columns):
            width = max(df[col].astype(str).map(len).max(), len(col)) + 4
            worksheet.set_column(i, i, width)
            
    output.seek(0)
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers=headers
    )

@router.get("/reconciliation")
def get_reconciliation_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    export: bool = False,
    db: sqlite3.Connection = Depends(get_db)
):
    """PO vs Delivered vs Received vs Rejected"""
    # Default to last 30 days if not provided
    if not start_date or not end_date:
        from datetime import datetime, timedelta
        end = datetime.now()
        start = end - timedelta(days=30)
        start_date = start.strftime("%Y-%m-%d")
        end_date = end.strftime("%Y-%m-%d")
    
    df = report_service.get_po_reconciliation_by_date(start_date, end_date, db)
    if export:
        return export_df_to_excel(df, f"PO_Reconciliation_{start_date}_{end_date}.xlsx")
    return df.fillna(0).to_dict(orient="records")

@router.get("/sales")
def get_sales_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    export: bool = False,
    db: sqlite3.Connection = Depends(get_db)
):
    """Monthly Sales Summary"""
    if not start_date or not end_date:
        from datetime import datetime, timedelta
        end = datetime.now()
        start = end - timedelta(days=30)
        start_date = start.strftime("%Y-%m-%d")
        end_date = end.strftime("%Y-%m-%d")
    
    df = report_service.get_monthly_sales_summary(start_date, end_date, db)
    if export:
        return export_df_to_excel(df, f"Monthly_Sales_{start_date}_{end_date}.xlsx")
    return df.fillna(0).to_dict(orient="records")

@router.get("/register/dc")
def get_dc_register(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    export: bool = False,
    db: sqlite3.Connection = Depends(get_db)
):
    """DC Register"""
    if not start_date or not end_date:
        from datetime import datetime, timedelta
        end = datetime.now()
        start = end - timedelta(days=30)
        start_date = start.strftime("%Y-%m-%d")
        end_date = end.strftime("%Y-%m-%d")
    
    df = report_service.get_dc_register(start_date, end_date, db)
    if export:
        return export_df_to_excel(df, f"DC_Register_{start_date}_{end_date}.xlsx")
    return df.fillna(0).to_dict(orient="records")

@router.get("/register/invoice")
def get_invoice_register(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    export: bool = False,
    db: sqlite3.Connection = Depends(get_db)
):
    """Invoice Register"""
    if not start_date or not end_date:
        from datetime import datetime, timedelta
        end = datetime.now()
        start = end - timedelta(days=30)
        start_date = start.strftime("%Y-%m-%d")
        end_date = end.strftime("%Y-%m-%d")
    
    df = report_service.get_invoice_register(start_date, end_date, db)
    if export:
        return export_df_to_excel(df, f"Invoice_Register_{start_date}_{end_date}.xlsx")
    return df.fillna(0).to_dict(orient="records")

@router.get("/pending")
def get_pending_items(
    export: bool = False,
    db: sqlite3.Connection = Depends(get_db)
):
    """Pending PO Items"""
    df = report_service.get_pending_po_items(db)
    if export:
        return export_df_to_excel(df, "Pending_PO_Items.xlsx")
    return df.fillna(0).to_dict(orient="records")

@router.get("/kpis")
def get_dashboard_kpis(db: sqlite3.Connection = Depends(get_db)):
    """Quick KPIs for dashboard (Legacy support)"""
    # Simple deterministic KPIs
    try:
        pending_count = db.execute("SELECT COUNT(*) FROM purchase_order_items WHERE pending_qty > 0").fetchone()[0]
        uninvoiced_dc = db.execute("""
            SELECT COUNT(*) FROM delivery_challans dc
            LEFT JOIN gst_invoice_dc_links l ON dc.dc_number = l.dc_number
            WHERE l.dc_number IS NULL
        """).fetchone()[0]
        
        return {
            "pending_items": pending_count,
            "uninvoiced_dcs": uninvoiced_dc,
            "system_status": "Healthy"
        }
    except Exception as e:
        return {"error": str(e)}

 
