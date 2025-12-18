import streamlit as st
from datetime import datetime, timedelta

def render_reports():
    st.markdown("## Reports & Analytics")
    st.markdown("---")
    
    # Date range selector (global for all reports)
    col1, col2, col3 = st.columns([2, 2, 4])
    with col1:
        start_date = st.date_input("From Date", value=datetime.now() - timedelta(days=30))
    with col2:
        end_date = st.date_input("To Date", value=datetime.now())
    
    st.markdown("---")
    
    # Report Categories
    st.markdown("### Select Report Category")
    
    tab1, tab2, tab3, tab4 = st.tabs(["📦 Purchase Orders", "🚚 Delivery Challans", "📄 GST Reports", "💰 Financial"])
    
    with tab1:
        render_po_reports_section(start_date, end_date)
    
    with tab2:
        render_dc_reports_section(start_date, end_date)
    
    with tab3:
        render_gst_reports_section(start_date, end_date)
    
    with tab4:
        render_financial_reports_section(start_date, end_date)


def render_po_reports_section(start_date, end_date):
    st.markdown("#### Purchase Order Reports")
    
    report_type = st.selectbox(
        "Select Report Type",
        ["PO Summary by Vendor", "PO Summary by Date Range", "Pending Deliveries", "PO Value Analysis"]
    )
    
    if st.button("Generate Report", type="primary", use_container_width=True):
        if report_type == "PO Summary by Vendor":
            from src.reports.po_reports import generate_po_by_vendor
            generate_po_by_vendor(start_date, end_date)
        elif report_type == "PO Summary by Date Range":
            from src.reports.po_reports import generate_po_by_date
            generate_po_by_date(start_date, end_date)
        elif report_type == "Pending Deliveries":
            from src.reports.po_reports import generate_pending_deliveries
            generate_pending_deliveries()
        elif report_type == "PO Value Analysis":
            from src.reports.po_reports import generate_po_value_analysis
            generate_po_value_analysis(start_date, end_date)


def render_dc_reports_section(start_date, end_date):
    st.markdown("#### Delivery Challan Reports")
    
    report_type = st.selectbox(
        "Select Report Type",
        ["DC Summary by Date", "DC by PO Report", "Dispatch Tracking"]
    )
    
    if st.button("Generate Report", type="primary", use_container_width=True, key="dc_report_btn"):
        if report_type == "DC Summary by Date":
            from src.reports.dc_reports import generate_dc_by_date
            generate_dc_by_date(start_date, end_date)
        elif report_type == "DC by PO Report":
            from src.reports.dc_reports import generate_dc_by_po
            generate_dc_by_po(start_date, end_date)
        elif report_type == "Dispatch Tracking":
            from src.reports.dc_reports import generate_dispatch_tracking
            generate_dispatch_tracking(start_date, end_date)


def render_gst_reports_section(start_date, end_date):
    st.markdown("#### GST Reports")
    
    report_type = st.selectbox(
        "Select Report Type",
        ["GST Summary by Period", "Tax Liability Report", "Invoice Register", "HSN-wise Summary"]
    )
    
    if st.button("Generate Report", type="primary", use_container_width=True, key="gst_report_btn"):
        if report_type == "GST Summary by Period":
            from src.reports.gst_reports import generate_gst_summary
            generate_gst_summary(start_date, end_date)
        elif report_type == "Tax Liability Report":
            from src.reports.gst_reports import generate_tax_liability
            generate_tax_liability(start_date, end_date)
        elif report_type == "Invoice Register":
            from src.reports.gst_reports import generate_invoice_register
            generate_invoice_register(start_date, end_date)
        elif report_type == "HSN-wise Summary":
            from src.reports.gst_reports import generate_hsn_summary
            generate_hsn_summary(start_date, end_date)


def render_financial_reports_section(start_date, end_date):
    st.markdown("#### Financial Reports")
    
    st.info("Financial reports coming soon! This will include revenue analysis, vendor payments, and profitability metrics.")
