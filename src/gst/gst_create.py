import streamlit as st
from config.database import get_connection
from datetime import datetime
import uuid

def render_gst_create():
    st.markdown("## Create GST Invoice")
    
    # Back button
    if st.button("← Back to Invoices"):
        st.session_state.gst_action = 'list'
        st.rerun()
    
    st.markdown("---")
    
    conn = get_connection()
    
    # Fetch unlinked delivery challans
    query = """
        SELECT 
            dc.dc_number,
            dc.dc_date,
            dc.po_number,
            po.supplier_name,
            dc.consignee_name,
            dc.consignee_gstin,
            COUNT(dci.id) as item_count,
            SUM(dci.dispatch_qty * poi.po_rate) as dc_value
        FROM delivery_challans dc
        LEFT JOIN purchase_orders po ON dc.po_number = po.po_number
        LEFT JOIN delivery_challan_items dci ON dc.dc_number = dci.dc_number
        LEFT JOIN purchase_order_items poi ON dci.po_item_id = poi.id
        WHERE dc.dc_number NOT IN (
            SELECT dc_number FROM gst_invoice_dc_links
        )
        GROUP BY dc.dc_number
        ORDER BY dc.dc_date DESC
    """
    
    available_dcs = conn.execute(query).fetchall()
    
    if not available_dcs:
        st.warning("No delivery challans available for invoicing. All DCs have been invoiced.")
        conn.close()
        return
    
    # Form
    with st.form("create_invoice_form"):
        st.markdown("### Invoice Details")
        
        col1, col2 = st.columns(2)
        with col1:
            invoice_date = st.date_input("Invoice Date", value=datetime.now())
        with col2:
            place_of_supply = st.text_input("Place of Supply", placeholder="e.g., Maharashtra")
        
        st.markdown("### Select Delivery Challans")
        
        # Display available DCs with checkboxes
        st.markdown("**Available Delivery Challans:**")
        
        selected_dcs = []
        
        for dc in available_dcs:
            col1, col2, col3, col4 = st.columns([1, 3, 3, 2])
            
            with col1:
                if st.checkbox("", key=f"dc_select_{dc['dc_number']}"):
                    selected_dcs.append(dc['dc_number'])
            
            with col2:
                st.text(f"DC-{dc['dc_number']}")
                st.caption(f"Date: {dc['dc_date']}")
            
            with col3:
                st.text(f"PO-{dc['po_number']}")
                st.caption(dc['supplier_name'])
            
            with col4:
                st.text(f"₹{dc['dc_value']:,.2f}" if dc['dc_value'] else "₹0.00")
                st.caption(f"{dc['item_count']} items")
        
        st.markdown("---")
        
        # Tax calculation preview
        if selected_dcs:
            st.markdown("### Tax Calculation Preview")
            
            # Calculate totals from selected DCs
            total_taxable = 0
            hsn_breakdown = {}
            customer_gstin = None
            
            for dc_num in selected_dcs:
                # Get DC items with HSN codes
                dc_items_query = """
                    SELECT 
                        dci.dispatch_qty,
                        poi.po_rate,
                        dci.hsn_code,
                        hsn.gst_rate,
                        dc.consignee_gstin
                    FROM delivery_challan_items dci
                    JOIN purchase_order_items poi ON dci.po_item_id = poi.id
                    LEFT JOIN hsn_master hsn ON dci.hsn_code = hsn.hsn_code
                    JOIN delivery_challans dc ON dci.dc_number = dc.dc_number
                    WHERE dci.dc_number = ?
                """
                
                items = conn.execute(dc_items_query, (dc_num,)).fetchall()
                
                for item in items:
                    if not customer_gstin and item['consignee_gstin']:
                        customer_gstin = item['consignee_gstin']
                    
                    item_value = (item['dispatch_qty'] or 0) * (item['po_rate'] or 0)
                    total_taxable += item_value
                    
                    hsn = item['hsn_code'] or 'UNCLASSIFIED'
                    gst_rate = item['gst_rate'] or 18  # Default 18% if not found
                    
                    if hsn not in hsn_breakdown:
                        hsn_breakdown[hsn] = {'value': 0, 'rate': gst_rate}
                    
                    hsn_breakdown[hsn]['value'] += item_value
            
            # Calculate taxes (assuming CGST+SGST for now, can be made dynamic)
            total_cgst = 0
            total_sgst = 0
            total_igst = 0
            
            for hsn, data in hsn_breakdown.items():
                tax_amount = data['value'] * (data['rate'] / 100)
                # Split equally between CGST and SGST (can add IGST logic based on place of supply)
                total_cgst += tax_amount / 2
                total_sgst += tax_amount / 2
            
            total_invoice_value = total_taxable + total_cgst + total_sgst + total_igst
            
            # Display breakdown
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Taxable Value", f"₹{total_taxable:,.2f}")
            col2.metric("CGST", f"₹{total_cgst:,.2f}")
            col3.metric("SGST", f"₹{total_sgst:,.2f}")
            col4.metric("Total Value", f"₹{total_invoice_value:,.2f}")
            
            st.markdown("**HSN-wise Breakdown:**")
            for hsn, data in hsn_breakdown.items():
                st.text(f"HSN {hsn}: ₹{data['value']:,.2f} @ {data['rate']}% GST")
        
        st.markdown("---")
        
        remarks = st.text_area("Remarks (Optional)", placeholder="Any additional notes...")
        
        submitted = st.form_submit_button("Create Invoice", type="primary", use_container_width=True)
        
        if submitted:
            if not selected_dcs:
                st.error("Please select at least one delivery challan.")
            else:
                # Generate invoice number
                invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
                
                try:
                    # Insert invoice
                    conn.execute("""
                        INSERT INTO gst_invoices (
                            invoice_number, invoice_date, linked_dc_numbers, 
                            po_numbers, customer_gstin, place_of_supply,
                            taxable_value, cgst, sgst, igst, total_invoice_value, remarks
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        invoice_number,
                        invoice_date.strftime('%Y-%m-%d'),
                        ','.join(selected_dcs),
                        '',  # Will be populated from DC links
                        customer_gstin,
                        place_of_supply,
                        total_taxable,
                        total_cgst,
                        total_sgst,
                        total_igst,
                        total_invoice_value,
                        remarks
                    ))
                    
                    # Link DCs to invoice
                    for dc_num in selected_dcs:
                        link_id = str(uuid.uuid4())
                        conn.execute("""
                            INSERT INTO gst_invoice_dc_links (id, invoice_number, dc_number)
                            VALUES (?, ?, ?)
                        """, (link_id, invoice_number, dc_num))
                    
                    conn.commit()
                    
                    st.success(f"✅ Invoice {invoice_number} created successfully!")
                    st.session_state.selected_invoice = invoice_number
                    st.session_state.gst_action = 'view'
                    
                    # Small delay to show success message
                    import time
                    time.sleep(1)
                    st.rerun()
                    
                except Exception as e:
                    conn.rollback()
                    st.error(f"Error creating invoice: {str(e)}")
    
    conn.close()
