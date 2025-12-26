"""
Reports Router - Unified Deterministic Reporting
Routes requests to report_service and handles file exports.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.db import get_db
from app.services import report_service
import sqlite3
import pandas as pd
import io
from typing import Optional

router = APIRouter()


def export_df_to_excel(df: pd.DataFrame, filename: str) -> StreamingResponse:
    """Helper to stream DataFrame as Excel"""
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
        df.to_excel(writer, index=False, sheet_name="Report")
        # Auto-adjust columns
        worksheet = writer.sheets["Report"]
        for i, col in enumerate(df.columns):
            width = max(df[col].astype(str).map(len).max(), len(col)) + 4
            worksheet.set_column(i, i, width)

    output.seek(0)
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@router.get("/reconciliation")
def get_reconciliation_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    export: bool = False,
    db: sqlite3.Connection = Depends(get_db),
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
    db: sqlite3.Connection = Depends(get_db),
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
    db: sqlite3.Connection = Depends(get_db),
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
    # Drop rows where dc_number is null to prevent phantom rows
    df_clean = df.dropna(subset=['dc_number'])
    return df_clean.fillna("").to_dict(orient="records")


@router.get("/register/invoice")
def get_invoice_register(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    export: bool = False,
    db: sqlite3.Connection = Depends(get_db),
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
    # Drop rows where invoice_number is null to prevent phantom rows
    df_clean = df.dropna(subset=['invoice_number'])
    return df_clean.fillna("").to_dict(orient="records")


@router.get("/register/po")
def download_po_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db),
):
    """Download PO Register as Excel"""
    try:
        # Default to last 30 days if not provided
        if not start_date or not end_date:
            end = datetime.now()
            start = end - timedelta(days=30)
            start_date = start.strftime("%Y-%m-%d")
            end_date = end.strftime("%Y-%m-%d")

        data = report_service.get_po_register(start_date, end_date, db)

        date_str = f"{start_date or 'ALL'}_to_{end_date or 'ALL'}"
        from app.services.excel_service import ExcelService

        return ExcelService.generate_dispatch_summary(
            date_str, data.to_dict(orient="records"), db
        )  # Assuming generate_dispatch_summary can handle this data
    except Exception as e:
        logger.error(f"Failed to generate PO Register: {e}")
        raise internal_error(str(e), e)


@router.get("/pending")
def get_pending_items(export: bool = False, db: sqlite3.Connection = Depends(get_db)):
    """Pending PO Items"""
    df = report_service.get_pending_po_items(db)
    if export:
        try:
            from app.services.excel_service import ExcelService

            # Assuming ExcelService has a method for pending items report
            return ExcelService.generate_pending_items_report(
                df, "Pending_PO_Items.xlsx", db
            )
        except Exception as e:
            logger.error(f"Failed to generate Pending PO Items report: {e}")
            raise internal_error(str(e), e)
    # Drop rows where po_number or material_description is null
    df_clean = df.dropna(subset=['po_number', 'material_description'])
    return df_clean.fillna("").to_dict(orient="records")


@router.get("/kpis")
def get_dashboard_kpis(db: sqlite3.Connection = Depends(get_db)):
    """Quick KPIs for dashboard (Legacy support)"""
    # Simple deterministic KPIs
    try:
        pending_count = db.execute(
            "SELECT COUNT(*) FROM purchase_order_items WHERE pending_qty > 0"
        ).fetchone()[0]
        uninvoiced_dc = db.execute("""
            SELECT COUNT(*) FROM delivery_challans dc
            LEFT JOIN gst_invoice_dc_links l ON dc.dc_number = l.dc_number
            WHERE l.dc_number IS NULL
        """).fetchone()[0]

        return {
            "pending_items": pending_count,
            "uninvoiced_dcs": uninvoiced_dc,
            "system_status": "Healthy",
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/daily-dispatch")
def get_daily_dispatch_report(
    date: Optional[str] = None,
    export: bool = False,
    db: sqlite3.Connection = Depends(get_db),
):
    """Daily Dispatch Summary matching strict template"""
    if not date:
        from datetime import datetime

        date = datetime.now().strftime("%Y-%m-%d")

    # Fetch data - logically this is similar to DC items for a date
    # Joining DCs and Items
    query = """
        SELECT 
            poi.material_description as description,
            dci.dispatch_qty as quantity,
            poi.unit,
            dci.no_of_packets as packets,
            dc.po_number,
            dc.dc_number,
            l.invoice_number,
            dc.consignee_name as destination,
            -- GEMC is on Invoice table, not DC. Pull from linked invoice if any.
            (SELECT i.gemc_number FROM gst_invoices i WHERE i.invoice_number = l.invoice_number) as gemc_number
        FROM delivery_challans dc
        JOIN delivery_challan_items dci ON dc.dc_number = dci.dc_number
        JOIN purchase_order_items poi ON dci.po_item_id = poi.id
        LEFT JOIN gst_invoice_dc_links l ON dc.dc_number = l.dc_number
        WHERE date(dc.dc_date) = date(?)
        ORDER BY dc.created_at
    """
    rows = db.execute(query, (date,)).fetchall()
    results = [dict(row) for row in rows]

    if export:
        try:
            from app.services.excel_service import ExcelService

            return ExcelService.generate_dispatch_summary(date, results)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

    return results


@router.get("/guarantee-certificate")
def get_guarantee_certificate(dc_number: str, db: sqlite3.Connection = Depends(get_db)):
    """Generate Guarantee Certificate for a specific DC"""
    # Fetch DC header
    dc_row = db.execute(
        "SELECT * FROM delivery_challans WHERE dc_number = ?", (dc_number,)
    ).fetchone()
    if not dc_row:
        raise HTTPException(status_code=404, detail="DC not found")
    header = dict(dc_row)

    # Fetch DC items
    items_rows = db.execute(
        """
        SELECT 
            poi.material_item_no as po_item_no,
            poi.material_description as description,
            dci.dispatch_qty as quantity,
            poi.unit
        FROM delivery_challan_items dci
        JOIN purchase_order_items poi ON dci.po_item_id = poi.id
        WHERE dci.dc_number = ?
    """,
        (dc_number,),
    ).fetchall()
    items = [dict(row) for row in items_rows]

    # Fetch PO details
    po_row = db.execute(
        "SELECT po_date FROM purchase_orders WHERE po_number = ?",
        (header["po_number"],),
    ).fetchone()
    if po_row:
        header["po_date"] = po_row[0]

    from app.services.excel_service import ExcelService

    return ExcelService.generate_guarantee_certificate(header, items)
