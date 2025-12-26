"""
FastAPI Main Application
Production Configuration
"""

from app.core.config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Import Routers
from app.routers import (
    health,
    dashboard,
    po,
    dc,
    invoice,
    settings as settings_router,
    po_notes,
    reports,
    srv,
    common,
)

# Setup structured logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME, description="SenstoSales ERP API", version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include Routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(po.router, prefix="/api/po", tags=["Purchase Orders"])
app.include_router(dc.router, prefix="/api/dc", tags=["Delivery Challans"])
app.include_router(invoice.router, prefix="/api/invoice", tags=["Invoices"])
app.include_router(srv.router, prefix="/api/srv", tags=["SRVs"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["Settings"])
app.include_router(po_notes.router, prefix="/api/po-notes", tags=["PO Notes"])
app.include_router(common.router, prefix="/api/common", tags=["Common"])


@app.get("/")
def root():
    return {"status": "active", "version": "2.0.0"}
