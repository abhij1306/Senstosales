import streamlit as st
from config.database import get_connection
from datetime import datetime

def render_gst_list():
    st.markdown("## GST Invoices")
    
    # Header area
    col1, col2 = st.columns([6, 2])
    with col2:
        if st.button("➕ Create Invoice", type="primary", use_container_width=True):
            st.session_state.gst_action = 'create'
            st.rerun()
            
    # Search and filters
    col1, col2 = st.columns([3, 2])
    with col1:
        search = st.text_input("🔍 Search Invoice Number, DC...", label_visibility="collapsed", placeholder="Search invoices...")
    with col2:
        date_filter = st.selectbox("Filter by Period", ["All Time", "This Month", "Last Month", "This Quarter", "Custom Range"])
    
    st.markdown("---")
    
    # Fetch invoices
    conn = get_connection()
    
    query = """
        SELECT 
            gi.*,
            COUNT(DISTINCT gidl.dc_number) as dc_count,
            GROUP_CONCAT(DISTINCT gidl.dc_number) as dc_list
        FROM gst_invoices gi
        LEFT JOIN gst_invoice_dc_links gidl ON gi.invoice_number = gidl.invoice_number
        GROUP BY gi.invoice_number
        ORDER BY gi.invoice_date DESC, gi.created_at DESC
    """
    
    invoices = conn.execute(query).fetchall()
    
    # Apply search filter
    if search:
        invoices = [inv for inv in invoices if 
                   search.lower() in str(inv['invoice_number']).lower() or 
                   (inv['dc_list'] and search.lower() in inv['dc_list'].lower())]
    
    # Apply date filter
    if date_filter != "All Time":
        from datetime import datetime, timedelta
        today = datetime.now()
        
        if date_filter == "This Month":
            start_date = today.replace(day=1).strftime('%Y-%m-%d')
            invoices = [inv for inv in invoices if inv['invoice_date'] >= start_date]
        elif date_filter == "Last Month":
            last_month = today.replace(day=1) - timedelta(days=1)
            start_date = last_month.replace(day=1).strftime('%Y-%m-%d')
            end_date = last_month.strftime('%Y-%m-%d')
            invoices = [inv for inv in invoices if start_date <= inv['invoice_date'] <= end_date]
        elif date_filter == "This Quarter":
            quarter_start_month = ((today.month - 1) // 3) * 3 + 1
            start_date = today.replace(month=quarter_start_month, day=1).strftime('%Y-%m-%d')
            invoices = [inv for inv in invoices if inv['invoice_date'] >= start_date]
    
    if not invoices:
        st.info("No GST invoices found. Create your first invoice from delivery challans.")
        conn.close()
        return
    
    # Summary metrics
    total_invoices = len(invoices)
    total_value = sum(inv['total_invoice_value'] or 0 for inv in invoices)
    total_tax = sum((inv['cgst'] or 0) + (inv['sgst'] or 0) + (inv['igst'] or 0) for inv in invoices)
    
    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Total Invoices", total_invoices)
    m2.metric("Total Invoice Value", f"₹{total_value:,.2f}")
    m3.metric("Total Tax", f"₹{total_tax:,.2f}")
    m4.metric("Avg Invoice Value", f"₹{total_value/total_invoices:,.2f}" if total_invoices > 0 else "₹0.00")
    
    st.markdown("---")
    
    # Table Header
    h1, h2, h3, h4, h5, h6 = st.columns([2, 2, 2, 2, 2, 2])
    h1.markdown("**Invoice No.**")
    h2.markdown("**Date**")
    h3.markdown("**Linked DCs**")
    h4.markdown("**Taxable Value**")
    h5.markdown("**Total Tax**")
    h6.markdown("**Invoice Value**")
    
    # Table Body
    for inv in invoices:
        with st.container():
            c1, c2, c3, c4, c5, c6 = st.columns([2, 2, 2, 2, 2, 2])
            
            if c1.button(inv['invoice_number'], key=f"inv_{inv['invoice_number']}"):
                st.session_state.selected_invoice = inv['invoice_number']
                st.session_state.gst_action = 'view'
                st.rerun()
            
            c2.text(inv['invoice_date'])
            
            dc_count = inv['dc_count'] or 0
            c3.text(f"{dc_count} DC(s)")
            
            c4.text(f"₹{inv['taxable_value']:,.2f}" if inv['taxable_value'] else "₹0.00")
            
            total_tax = (inv['cgst'] or 0) + (inv['sgst'] or 0) + (inv['igst'] or 0)
            c5.text(f"₹{total_tax:,.2f}")
            
            c6.text(f"₹{inv['total_invoice_value']:,.2f}" if inv['total_invoice_value'] else "₹0.00")
            
            st.markdown("<hr style='margin: 0.5rem 0; border-top: 1px solid #333333;'>", unsafe_allow_html=True)
    
    conn.close()
