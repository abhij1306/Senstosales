import streamlit as st
from config.database import get_connection

def render_gst_detail():
    if 'selected_invoice' not in st.session_state:
        st.error("No invoice selected")
        return
    
    invoice_number = st.session_state.selected_invoice
    
    # Back button
    if st.button("← Back to Invoices"):
        st.session_state.gst_action = 'list'
        del st.session_state.selected_invoice
        st.rerun()
    
    conn = get_connection()
    
    # Fetch invoice details
    invoice = conn.execute("""
        SELECT * FROM gst_invoices WHERE invoice_number = ?
    """, (invoice_number,)).fetchone()
    
    if not invoice:
        st.error("Invoice not found")
        conn.close()
        return
    
    # Header
    st.markdown(f"## Invoice: {invoice_number}")
    st.markdown("---")
    
    # Invoice Summary
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown("**Invoice Date**")
        st.text(invoice['invoice_date'])
        
        if invoice['place_of_supply']:
            st.markdown("**Place of Supply**")
            st.text(invoice['place_of_supply'])
    
    with col2:
        st.markdown("**Customer GSTIN**")
        st.text(invoice['customer_gstin'] or "N/A")
        
        st.markdown("**Linked DCs**")
        st.text(invoice['linked_dc_numbers'] or "None")
    
    with col3:
        st.markdown("**Created On**")
        st.text(invoice['created_at'][:19] if invoice['created_at'] else "N/A")
    
    st.markdown("---")
    
    # Financial Summary
    st.markdown("### Financial Summary")
    
    col1, col2, col3, col4, col5 = st.columns(5)
    col1.metric("Taxable Value", f"₹{invoice['taxable_value']:,.2f}" if invoice['taxable_value'] else "₹0.00")
    col2.metric("CGST", f"₹{invoice['cgst']:,.2f}" if invoice['cgst'] else "₹0.00")
    col3.metric("SGST", f"₹{invoice['sgst']:,.2f}" if invoice['sgst'] else "₹0.00")
    col4.metric("IGST", f"₹{invoice['igst']:,.2f}" if invoice['igst'] else "₹0.00")
    col5.metric("Total Invoice Value", f"₹{invoice['total_invoice_value']:,.2f}" if invoice['total_invoice_value'] else "₹0.00")
    
    st.markdown("---")
    
    # Linked Delivery Challans
    st.markdown("### Linked Delivery Challans")
    
    dc_links = conn.execute("""
        SELECT 
            gidl.dc_number,
            dc.dc_date,
            dc.po_number,
            po.supplier_name,
            dc.consignee_name,
            dc.vehicle_no,
            COUNT(dci.id) as item_count,
            SUM(dci.dispatch_qty * poi.po_rate) as dc_value
        FROM gst_invoice_dc_links gidl
        JOIN delivery_challans dc ON gidl.dc_number = dc.dc_number
        LEFT JOIN purchase_orders po ON dc.po_number = po.po_number
        LEFT JOIN delivery_challan_items dci ON dc.dc_number = dci.dc_number
        LEFT JOIN purchase_order_items poi ON dci.po_item_id = poi.id
        WHERE gidl.invoice_number = ?
        GROUP BY gidl.dc_number
    """, (invoice_number,)).fetchall()
    
    if dc_links:
        for dc in dc_links:
            with st.expander(f"📦 DC-{dc['dc_number']} | {dc['dc_date']} | ₹{dc['dc_value']:,.2f}" if dc['dc_value'] else f"📦 DC-{dc['dc_number']} | {dc['dc_date']}"):
                col1, col2 = st.columns(2)
                
                with col1:
                    st.markdown("**PO Number**")
                    st.text(f"PO-{dc['po_number']}")
                    
                    st.markdown("**Supplier**")
                    st.text(dc['supplier_name'] or "N/A")
                
                with col2:
                    st.markdown("**Consignee**")
                    st.text(dc['consignee_name'] or "N/A")
                    
                    st.markdown("**Vehicle**")
                    st.text(dc['vehicle_no'] or "N/A")
                
                st.markdown("---")
                st.markdown(f"**Items ({dc['item_count']})**")
                
                # Fetch DC items
                items = conn.execute("""
                    SELECT 
                        poi.material_code,
                        poi.material_description,
                        poi.unit,
                        poi.po_rate,
                        dci.dispatch_qty,
                        dci.hsn_code,
                        (dci.dispatch_qty * poi.po_rate) as item_value
                    FROM delivery_challan_items dci
                    JOIN purchase_order_items poi ON dci.po_item_id = poi.id
                    WHERE dci.dc_number = ?
                """, (dc['dc_number'],)).fetchall()
                
                if items:
                    # Item table header
                    h1, h2, h3, h4, h5, h6 = st.columns([2, 3, 1, 1, 1, 2])
                    h1.markdown("**Material**")
                    h2.markdown("**Description**")
                    h3.markdown("**HSN**")
                    h4.markdown("**Qty**")
                    h5.markdown("**Rate**")
                    h6.markdown("**Value**")
                    
                    for item in items:
                        c1, c2, c3, c4, c5, c6 = st.columns([2, 3, 1, 1, 1, 2])
                        c1.text(item['material_code'] or "N/A")
                        c2.text(item['material_description'] or "N/A")
                        c3.text(item['hsn_code'] or "N/A")
                        c4.text(f"{item['dispatch_qty']} {item['unit']}" if item['dispatch_qty'] else "0")
                        c5.text(f"₹{item['po_rate']:,.2f}" if item['po_rate'] else "₹0")
                        c6.text(f"₹{item['item_value']:,.2f}" if item['item_value'] else "₹0.00")
    else:
        st.info("No delivery challans linked to this invoice.")
    
    st.markdown("---")
    
    # HSN-wise Tax Breakdown
    st.markdown("### HSN-wise Tax Breakdown")
    
    hsn_data = conn.execute("""
        SELECT 
            dci.hsn_code,
            hsn.gst_rate,
            SUM(dci.dispatch_qty * poi.po_rate) as taxable_value,
            COUNT(DISTINCT dci.id) as item_count
        FROM gst_invoice_dc_links gidl
        JOIN delivery_challan_items dci ON gidl.dc_number = dci.dc_number
        JOIN purchase_order_items poi ON dci.po_item_id = poi.id
        LEFT JOIN hsn_master hsn ON dci.hsn_code = hsn.hsn_code
        WHERE gidl.invoice_number = ?
        GROUP BY dci.hsn_code
    """, (invoice_number,)).fetchall()
    
    if hsn_data:
        h1, h2, h3, h4, h5, h6 = st.columns([2, 1, 2, 2, 2, 2])
        h1.markdown("**HSN Code**")
        h2.markdown("**GST Rate**")
        h3.markdown("**Taxable Value**")
        h4.markdown("**CGST**")
        h5.markdown("**SGST**")
        h6.markdown("**Total Tax**")
        
        for hsn in hsn_data:
            c1, c2, c3, c4, c5, c6 = st.columns([2, 1, 2, 2, 2, 2])
            
            hsn_code = hsn['hsn_code'] or 'UNCLASSIFIED'
            gst_rate = hsn['gst_rate'] or 18
            taxable = hsn['taxable_value'] or 0
            
            tax_amount = taxable * (gst_rate / 100)
            cgst = tax_amount / 2
            sgst = tax_amount / 2
            
            c1.text(hsn_code)
            c2.text(f"{gst_rate}%")
            c3.text(f"₹{taxable:,.2f}")
            c4.text(f"₹{cgst:,.2f}")
            c5.text(f"₹{sgst:,.2f}")
            c6.text(f"₹{tax_amount:,.2f}")
    else:
        st.info("No HSN data available.")
    
    st.markdown("---")
    
    # Remarks
    if invoice['remarks']:
        st.markdown("### Remarks")
        st.text_area("", value=invoice['remarks'], disabled=True, label_visibility="collapsed")
    
    # Action buttons
    col1, col2, col3 = st.columns([1, 1, 4])
    with col1:
        if st.button("📄 Export PDF", use_container_width=True):
            st.info("PDF export feature coming soon!")
    with col2:
        if st.button("📊 Export Excel", use_container_width=True):
            st.info("Excel export feature coming soon!")
    
    conn.close()
