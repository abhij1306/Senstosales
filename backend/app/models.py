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
    supplier_gstin: Optional[str] = None
    supplier_code: Optional[str] = None
    supplier_phone: Optional[str] = None
    supplier_fax: Optional[str] = None
    supplier_email: Optional[str] = None
    department_no: Optional[int] = None
    
    # Reference Info
    enquiry_no: Optional[str] = None
    enquiry_date: Optional[str] = None
    quotation_ref: Optional[str] = None
    quotation_date: Optional[str] = None
    rc_no: Optional[str] = None
    order_type: Optional[str] = None
    po_status: Optional[str] = None
    
    # Financials & Tax
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
    consignee_name: Optional[str] = None
    consignee_address: Optional[str] = None

class PODelivery(BaseModel):
    """Purchase Order Delivery Schedule"""
    id: Optional[str] = None
    lot_no: Optional[int] = None
    delivered_quantity: Optional[float] = None
    dely_date: Optional[str] = None
    entry_allow_date: Optional[str] = None
    dest_code: Optional[int] = None

class POItem(BaseModel):
    """Purchase Order Item"""
    id: Optional[str] = None
    po_item_no: int
    material_code: Optional[str] = None
    material_description: Optional[str] = None
    drg_no: Optional[str] = None
    mtrl_cat: Optional[int] = None
    unit: Optional[str] = None
    po_rate: Optional[float] = None
    ordered_quantity: Optional[float] = None
    received_quantity: Optional[float] = 0  # Sum from SRVs
    rejected_quantity: Optional[float] = 0  # Sum from SRVs (NEW)
    item_value: Optional[float] = None
    hsn_code: Optional[str] = None
    delivered_quantity: Optional[float] = 0
    pending_quantity: Optional[float] = None
    deliveries: List['PODelivery'] = []

class POListItem(BaseModel):
    """Purchase Order List Item (Summary)"""
    po_number: int
    po_date: Optional[str] = None
    supplier_name: Optional[str] = None
    po_value: Optional[float] = None
    amend_no: Optional[int] = 0
    po_status: Optional[str] = None
    linked_dc_numbers: Optional[str] = None
    total_ordered_quantity: float = 0.0
    total_dispatched_quantity: float = 0.0
    total_received_quantity: float = 0.0
    total_rejected_quantity: float = 0.0
    total_pending_quantity: float = 0.0
    created_at: Optional[str] = None

class POStats(BaseModel):
    """PO Page KPIs"""
    open_orders_count: int
    pending_approval_count: int
    total_value_ytd: float
    total_value_change: float # Mock percentage change

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
    status: Optional[str] = "Pending"
    total_value: float = 0.0
    created_at: Optional[str] = None

class DCStats(BaseModel):
    """Delivery Challan KPIs"""
    total_challans: int
    total_challans_change: float = 0.0
    pending_delivery: int
    completed_delivery: int
    completed_change: float = 0.0

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
    linked_dc_numbers: Optional[str] = None  # Added
    customer_gstin: Optional[str] = None     # Added
    taxable_value: Optional[float] = None    # Added
    total_invoice_value: Optional[float] = None
    created_at: Optional[str] = None

class InvoiceStats(BaseModel):
    """Invoice Page KPIs"""
    total_invoiced: float
    pending_payments: float
    gst_collected: float
    total_invoiced_change: float  # Percentage change 
    pending_payments_count: int
    gst_collected_change: float

# ============================================================
# DASHBOARD MODELS
# ============================================================

class DashboardSummary(BaseModel):
    """Dashboard KPIs"""
    total_sales_month: float
    sales_growth: float
    pending_pos: int
    new_pos_today: int
    active_challans: int
    active_challans_growth: str # e.g. "Stable"
    total_po_value: float
    po_value_growth: float
    # Global Reconciliation Totals
    total_ordered: float = 0
    total_delivered: float = 0
    total_received: float = 0

class ActivityItem(BaseModel):
    """Recent Activity Item"""
    type: str  # "PO", "DC", "Invoice"
    number: str
    date: str
    description: str
    created_at: str

# ============================================================
# SRV (STORES RECEIPT VOUCHER) MODELS
# ============================================================

class SRVHeader(BaseModel):
    """SRV Header"""
    srv_number: str
    srv_date: str
    po_number: str
    srv_status: Optional[str] = "Received"
    po_found: Optional[bool] = True  # Whether PO exists in database
    file_hash: Optional[str] = None
    is_active: Optional[bool] = True
    created_at: Optional[str] = None

class SRVItem(BaseModel):
    """SRV Item"""
    id: Optional[int] = None
    po_item_no: int
    lot_no: Optional[int] = None
    received_qty: float
    rejected_qty: float
    order_qty: Optional[float] = 0
    challan_qty: Optional[float] = 0
    accepted_qty: Optional[float] = 0
    unit: Optional[str] = None
    challan_no: Optional[str] = None
    challan_date: Optional[str] = None
    invoice_no: Optional[str] = None
    invoice_date: Optional[str] = None
    div_code: Optional[str] = None
    pmir_no: Optional[str] = None
    finance_date: Optional[str] = None
    cnote_no: Optional[str] = None
    cnote_date: Optional[str] = None
    remarks: Optional[str] = None

class SRVDetail(BaseModel):
    """SRV Detail (Full)"""
    header: SRVHeader
    items: List[SRVItem]

class SRVListItem(BaseModel):
    """SRV List Item (Summary)"""
    srv_number: str
    srv_date: str
    po_number: str
    total_received_qty: float = 0.0
    total_rejected_qty: float = 0.0
    po_found: Optional[bool] = True  # Whether PO exists in database
    warning_message: Optional[str] = None  # Warning if PO not found
    created_at: Optional[str] = None

class SRVStats(BaseModel):
    """SRV Page KPIs"""
    total_srvs: int
    total_received_qty: float
    total_rejected_qty: float
    rejection_rate: float  # Percentage
    missing_po_count: int  # Count of SRVs with PO not found

# ============================================================
# SETTINGS MODELS
# ============================================================

class Settings(BaseModel):
    """Business Settings"""
    supplier_name: Optional[str] = None
    supplier_description: Optional[str] = None
    supplier_address: Optional[str] = None
    supplier_gstin: Optional[str] = None
    supplier_contact: Optional[str] = None
    supplier_state: Optional[str] = None
    supplier_state_code: Optional[str] = None
    
    buyer_name: Optional[str] = None
    buyer_address: Optional[str] = None
    buyer_gstin: Optional[str] = None
    buyer_state: Optional[str] = None
    buyer_state_code: Optional[str] = None
    buyer_place_of_supply: Optional[str] = None
    buyer_designation: Optional[str] = None

class SettingsUpdate(BaseModel):
    """Partial Update of Settings"""
    key: str
    value: str
