"""
Pydantic Models for API Request/Response
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

# ============================================================
# PURCHASE ORDER MODELS
# ============================================================

class POHeader(BaseModel):
    """Purchase Order Header"""
    po_number: int
    po_date: Optional[str] = None
    supplier_name: Optional[str] = None
    supplier_code: Optional[str] = None
    supplier_phone: Optional[str] = None
    supplier_fax: Optional[str] = None
    supplier_email: Optional[str] = None
    department_no: Optional[int] = None
    enquiry_no: Optional[str] = None
    enquiry_date: Optional[str] = None
    quotation_ref: Optional[str] = None
    quotation_date: Optional[str] = None
    rc_no: Optional[str] = None
    order_type: Optional[str] = None
    po_status: Optional[str] = None
    tin_no: Optional[str] = None
    ecc_no: Optional[str] = None
    mpct_no: Optional[str] = None
    po_value: Optional[float] = None
    fob_value: Optional[float] = None
    ex_rate: Optional[float] = None
    currency: Optional[str] = None
    net_po_value: Optional[float] = None
    amend_no: Optional[int] = 0
    inspection_by: Optional[str] = None
    inspection_at: Optional[str] = None
    issuer_name: Optional[str] = None
    issuer_designation: Optional[str] = None
    issuer_phone: Optional[str] = None
    remarks: Optional[str] = None

class POItem(BaseModel):
    """Purchase Order Item"""
    po_item_no: int
    material_code: Optional[str] = None
    material_description: Optional[str] = None
    drg_no: Optional[str] = None
    mtrl_cat: Optional[int] = None
    unit: Optional[str] = None
    po_rate: Optional[float] = None
    ord_qty: Optional[float] = None
    rcd_qty: Optional[float] = None
    item_value: Optional[float] = None
    hsn_code: Optional[str] = None

class POListItem(BaseModel):
    """Purchase Order List Item (Summary)"""
    po_number: int
    po_date: Optional[str] = None
    supplier_name: Optional[str] = None
    po_value: Optional[float] = None
    amend_no: Optional[int] = 0
    created_at: Optional[str] = None

class PODetail(BaseModel):
    """Purchase Order Detail (Full)"""
    header: POHeader
    items: List[POItem]

# ============================================================
# DELIVERY CHALLAN MODELS
# ============================================================

class DCCreate(BaseModel):
    """Create Delivery Challan"""
    dc_number: str
    dc_date: str
    po_number: Optional[int] = None
    department_no: Optional[int] = None
    consignee_name: Optional[str] = None
    consignee_gstin: Optional[str] = None
    consignee_address: Optional[str] = None
    inspection_company: Optional[str] = None
    eway_bill_no: Optional[str] = None
    vehicle_no: Optional[str] = None
    lr_no: Optional[str] = None
    transporter: Optional[str] = None
    mode_of_transport: Optional[str] = None
    remarks: Optional[str] = None

class DCListItem(BaseModel):
    """Delivery Challan List Item"""
    dc_number: str
    dc_date: str
    po_number: Optional[int] = None
    consignee_name: Optional[str] = None
    created_at: Optional[str] = None

# ============================================================
# INVOICE MODELS
# ============================================================

class InvoiceCreate(BaseModel):
    """Create Invoice"""
    invoice_number: str
    invoice_date: str
    linked_dc_numbers: Optional[str] = None
    po_numbers: Optional[str] = None
    customer_gstin: Optional[str] = None
    place_of_supply: Optional[str] = None
    taxable_value: Optional[float] = None
    cgst: Optional[float] = 0
    sgst: Optional[float] = 0
    igst: Optional[float] = 0
    total_invoice_value: Optional[float] = None
    remarks: Optional[str] = None

class InvoiceListItem(BaseModel):
    """Invoice List Item"""
    invoice_number: str
    invoice_date: str
    po_numbers: Optional[str] = None
    total_invoice_value: Optional[float] = None
    created_at: Optional[str] = None

# ============================================================
# DASHBOARD MODELS
# ============================================================

class DashboardSummary(BaseModel):
    """Dashboard KPIs"""
    total_pos: int
    total_dcs: int
    total_invoices: int
    total_po_value: Optional[float] = 0

class ActivityItem(BaseModel):
    """Recent Activity Item"""
    type: str  # "PO", "DC", "Invoice"
    number: str
    date: str
    description: str
    created_at: str
