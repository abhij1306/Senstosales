from fastapi import APIRouter, Depends, Query
import sqlite3
import logging
from app.db import get_db
from app.core.utils import get_financial_year

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/check-duplicate")
def check_duplicate_number(
    type: str = Query(..., regex="^(DC|Invoice)$"),
    number: str = Query(...),
    date: str = Query(...),
    db: sqlite3.Connection = Depends(get_db),
):
    """
    Check if a DC or Invoice number already exists within the same financial year.
    """
    fy = get_financial_year(date)

    # Financial year boundaries (April 1st to March 31st)
    year_start = fy.split("-")[0]
    full_year_start = f"{year_start}-04-01"

    # Next year's March 31st
    year_end = f"20{fy.split('-')[1]}"
    full_year_end = f"{year_end}-03-31"

    exists = False

    if type == "DC":
        query = """
            SELECT 1 FROM delivery_challans 
            WHERE dc_number = ? 
            AND dc_date >= ? AND dc_date <= ?
        """
        exists = (
            db.execute(query, (number, full_year_start, full_year_end)).fetchone()
            is not None
        )
    else:
        query = """
            SELECT 1 FROM gst_invoices 
            WHERE invoice_number = ? 
            AND invoice_date >= ? AND invoice_date <= ?
        """
        exists = (
            db.execute(query, (number, full_year_start, full_year_end)).fetchone()
            is not None
        )

    return {"exists": exists, "number": number, "type": type, "financial_year": fy}
