"""
Reports Router
Provides various business reports via ReportsService
"""
from fastapi import APIRouter, Depends, Query
from app.db import get_db
from typing import Optional
import sqlite3
from datetime import datetime

from app.services.reports_service import reports_service

router = APIRouter()

@router.get("/po-dc-invoice-reconciliation")
def po_dc_invoice_reconciliation(
    po_number: Optional[int] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """PO-DC-Invoice Reconciliation Report"""
    return reports_service.get_reconciliation_report(db, po_number)


@router.get("/dc-without-invoice")
def dc_without_invoice(db: sqlite3.Connection = Depends(get_db)):
    """DCs that haven't been invoiced yet"""
    return reports_service.get_pending_dcs(db)


@router.get("/invoice-summary")
def invoice_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """Invoice Summary Report with GST breakdown"""
    return reports_service.get_invoice_summary(db, start_date, end_date)


@router.get("/supplier-summary")
def supplier_summary(db: sqlite3.Connection = Depends(get_db)):
    """Supplier-wise PO summary"""
    return reports_service.get_supplier_summary(db)


@router.get("/monthly-summary")
def monthly_summary(
    year: int = Query(default=datetime.now().year),
    db: sqlite3.Connection = Depends(get_db)
):
    """Monthly summary of POs, DCs, and Invoices"""
    return reports_service.get_monthly_summary(db, year)


@router.get("/insight-strip")
def insight_strip(db: sqlite3.Connection = Depends(get_db)):
    """Generate high-impact insights for the dashboard"""
    return reports_service.get_dashboard_insights(db)


@router.get("/trends")
def trends(
    range: str = "year",
    db: sqlite3.Connection = Depends(get_db)
):
    """Get sales vs dispatch vs invoice trends"""
    return reports_service.get_trends(db, range)


@router.get("/smart-table")
def smart_table(
    filter: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """Unified Smart Table Data"""
    return reports_service.get_smart_table(db, filter)

