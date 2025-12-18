import streamlit as st
from config.database import get_connection
import pandas as pd
from src.reports.export_utils import export_to_excel, export_to_csv

def generate_dc_by_date(start_date, end_date):
    """Generate DC summary by date"""
    st.markdown("---")
    st.markdown("### DC Summary by Date")
    
    conn = get_connection()
    
    query = """
        SELECT 
            dc.dc_date,
            COUNT(DISTINCT dc.dc_number) as dc_count,
            COUNT(DISTINCT dc.po_number) as po_count,
            COUNT(dci.id) as total_items,
            SUM(dci.dispatch_qty * poi.po_rate) as total_dispatch_value
        FROM delivery_challans dc
        LEFT JOIN delivery_challan_items dci ON dc.dc_number = dci.dc_number
        LEFT JOIN purchase_order_items poi ON dci.po_item_id = poi.id
        WHERE dc.dc_date BETWEEN ? AND ?
        GROUP BY dc.dc_date
        ORDER BY dc.dc_date DESC
    """
    
    data = conn.execute(query, (start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))).fetchall()
    conn.close()
    
    if not data:
        st.info("No delivery challans found for the selected date range.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(data, columns=[
        'Date', 'DC Count', 'PO Count', 'Total Items', 'Dispatch Value'
    ])
    
    # Metrics
    total_dcs = df['DC Count'].sum()
    total_value = df['Dispatch Value'].sum()
    
    col1, col2, col3 = st.columns(3)
    col1.metric("Total DCs", total_dcs)
    col2.metric("Total Dispatch Value", f"₹{total_value:,.2f}" if total_value else "₹0.00")
    col3.metric("Avg DC Value", f"₹{total_value/total_dcs:,.2f}" if total_dcs > 0 else "₹0.00")
    
    st.markdown("---")
    
    # Format for display
    df['Dispatch Value'] = df['Dispatch Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    # Export options
    col1, col2 = st.columns(2)
    with col1:
        if st.button("📊 Export to Excel", key="dc_date_excel"):
            export_to_excel(df, f"DC_by_Date_{start_date}_{end_date}.xlsx")
    with col2:
        if st.button("📄 Export to CSV", key="dc_date_csv"):
            export_to_csv(df, f"DC_by_Date_{start_date}_{end_date}.csv")


def generate_dc_by_po(start_date, end_date):
    """Generate DC summary by PO"""
    st.markdown("---")
    st.markdown("### DC by Purchase Order")
    
    conn = get_connection()
    
    query = """
        SELECT 
            dc.po_number,
            po.po_date,
            po.supplier_name,
            COUNT(DISTINCT dc.dc_number) as dc_count,
            COUNT(dci.id) as total_items_dispatched,
            SUM(dci.dispatch_qty * poi.po_rate) as total_dispatch_value,
            MIN(dc.dc_date) as first_dispatch,
            MAX(dc.dc_date) as last_dispatch
        FROM delivery_challans dc
        JOIN purchase_orders po ON dc.po_number = po.po_number
        LEFT JOIN delivery_challan_items dci ON dc.dc_number = dci.dc_number
        LEFT JOIN purchase_order_items poi ON dci.po_item_id = poi.id
        WHERE dc.dc_date BETWEEN ? AND ?
        GROUP BY dc.po_number
        ORDER BY dc.po_number DESC
    """
    
    data = conn.execute(query, (start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))).fetchall()
    conn.close()
    
    if not data:
        st.info("No delivery challans found for the selected date range.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(data, columns=[
        'PO Number', 'PO Date', 'Supplier', 'DC Count', 'Items Dispatched',
        'Dispatch Value', 'First Dispatch', 'Last Dispatch'
    ])
    
    # Metrics
    total_pos = len(df)
    total_dcs = df['DC Count'].sum()
    total_value = df['Dispatch Value'].sum()
    
    col1, col2, col3 = st.columns(3)
    col1.metric("POs with Dispatches", total_pos)
    col2.metric("Total DCs", total_dcs)
    col3.metric("Total Value", f"₹{total_value:,.2f}" if total_value else "₹0.00")
    
    st.markdown("---")
    
    # Format for display
    df['Dispatch Value'] = df['Dispatch Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    # Export options
    col1, col2 = st.columns(2)
    with col1:
        if st.button("📊 Export to Excel", key="dc_po_excel"):
            export_to_excel(df, f"DC_by_PO_{start_date}_{end_date}.xlsx")
    with col2:
        if st.button("📄 Export to CSV", key="dc_po_csv"):
            export_to_csv(df, f"DC_by_PO_{start_date}_{end_date}.csv")


def generate_dispatch_tracking(start_date, end_date):
    """Generate detailed dispatch tracking report"""
    st.markdown("---")
    st.markdown("### Dispatch Tracking Report")
    
    conn = get_connection()
    
    query = """
        SELECT 
            dc.dc_number,
            dc.dc_date,
            dc.po_number,
            po.supplier_name,
            poi.material_code,
            poi.material_description,
            dci.dispatch_qty,
            poi.unit,
            poi.po_rate,
            (dci.dispatch_qty * poi.po_rate) as item_value,
            dc.vehicle_no,
            dc.eway_bill_no
        FROM delivery_challan_items dci
        JOIN delivery_challans dc ON dci.dc_number = dc.dc_number
        JOIN purchase_order_items poi ON dci.po_item_id = poi.id
        JOIN purchase_orders po ON dc.po_number = po.po_number
        WHERE dc.dc_date BETWEEN ? AND ?
        ORDER BY dc.dc_date DESC, dc.dc_number
    """
    
    data = conn.execute(query, (start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))).fetchall()
    conn.close()
    
    if not data:
        st.info("No dispatch records found for the selected date range.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(data, columns=[
        'DC Number', 'DC Date', 'PO Number', 'Supplier', 'Material Code',
        'Description', 'Dispatch Qty', 'Unit', 'Rate', 'Value', 'Vehicle', 'E-way Bill'
    ])
    
    # Metrics
    total_items = len(df)
    total_value = df['Value'].sum()
    unique_dcs = df['DC Number'].nunique()
    
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Items", total_items)
    col2.metric("Unique DCs", unique_dcs)
    col3.metric("Total Value", f"₹{total_value:,.2f}" if total_value else "₹0.00")
    col4.metric("Avg Item Value", f"₹{total_value/total_items:,.2f}" if total_items > 0 else "₹0.00")
    
    st.markdown("---")
    
    # Format for display
    df['Rate'] = df['Rate'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['Value'] = df['Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    # Export options
    col1, col2 = st.columns(2)
    with col1:
        if st.button("📊 Export to Excel", key="dispatch_excel"):
            export_to_excel(df, f"Dispatch_Tracking_{start_date}_{end_date}.xlsx")
    with col2:
        if st.button("📄 Export to CSV", key="dispatch_csv"):
            export_to_csv(df, f"Dispatch_Tracking_{start_date}_{end_date}.csv")
