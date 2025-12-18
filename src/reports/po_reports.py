import streamlit as st
from config.database import get_connection
import pandas as pd
from src.reports.export_utils import export_to_excel, export_to_csv

def generate_po_by_vendor(start_date, end_date):
    """Generate PO summary grouped by vendor"""
    st.markdown("---")
    st.markdown("### PO Summary by Vendor")
    
    conn = get_connection()
    
    query = """
        SELECT 
            po.supplier_name,
            COUNT(DISTINCT po.po_number) as po_count,
            SUM(po.po_value) as total_po_value,
            SUM(poi.ord_qty) as total_ordered_qty,
            SUM(poi.delivered_qty) as total_delivered_qty,
            SUM(poi.pending_qty) as total_pending_qty,
            AVG(po.po_value) as avg_po_value
        FROM purchase_orders po
        LEFT JOIN purchase_order_items poi ON po.po_number = poi.po_number
        WHERE po.po_date BETWEEN ? AND ?
        GROUP BY po.supplier_name
        ORDER BY total_po_value DESC
    """
    
    data = conn.execute(query, (start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))).fetchall()
    conn.close()
    
    if not data:
        st.info("No data found for the selected date range.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(data, columns=[
        'Supplier', 'PO Count', 'Total PO Value', 'Ordered Qty', 
        'Delivered Qty', 'Pending Qty', 'Avg PO Value'
    ])
    
    # Format currency columns
    df['Total PO Value'] = df['Total PO Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['Avg PO Value'] = df['Avg PO Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    
    # Display metrics
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Vendors", len(df))
    col2.metric("Total POs", df['PO Count'].sum())
    
    st.markdown("---")
    
    # Display table
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    # Export options
    col1, col2 = st.columns(2)
    with col1:
        if st.button("📊 Export to Excel", key="po_vendor_excel"):
            export_to_excel(df, f"PO_by_Vendor_{start_date}_{end_date}.xlsx")
    with col2:
        if st.button("📄 Export to CSV", key="po_vendor_csv"):
            export_to_csv(df, f"PO_by_Vendor_{start_date}_{end_date}.csv")


def generate_po_by_date(start_date, end_date):
    """Generate PO summary by date range"""
    st.markdown("---")
    st.markdown("### PO Summary by Date Range")
    
    conn = get_connection()
    
    query = """
        SELECT 
            po.po_date,
            COUNT(DISTINCT po.po_number) as po_count,
            SUM(po.po_value) as total_value,
            GROUP_CONCAT(DISTINCT po.supplier_name) as suppliers
        FROM purchase_orders po
        WHERE po.po_date BETWEEN ? AND ?
        GROUP BY po.po_date
        ORDER BY po.po_date DESC
    """
    
    data = conn.execute(query, (start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))).fetchall()
    conn.close()
    
    if not data:
        st.info("No data found for the selected date range.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(data, columns=['Date', 'PO Count', 'Total Value', 'Suppliers'])
    
    # Metrics
    total_pos = df['PO Count'].sum()
    total_value = df['Total Value'].sum()
    
    col1, col2, col3 = st.columns(3)
    col1.metric("Total POs", total_pos)
    col2.metric("Total Value", f"₹{total_value:,.2f}")
    col3.metric("Avg PO Value", f"₹{total_value/total_pos:,.2f}" if total_pos > 0 else "₹0.00")
    
    st.markdown("---")
    
    # Format for display
    df['Total Value'] = df['Total Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    # Export options
    col1, col2 = st.columns(2)
    with col1:
        if st.button("📊 Export to Excel", key="po_date_excel"):
            export_to_excel(df, f"PO_by_Date_{start_date}_{end_date}.xlsx")
    with col2:
        if st.button("📄 Export to CSV", key="po_date_csv"):
            export_to_csv(df, f"PO_by_Date_{start_date}_{end_date}.csv")


def generate_pending_deliveries():
    """Generate pending deliveries report"""
    st.markdown("---")
    st.markdown("### Pending Deliveries Report")
    
    conn = get_connection()
    
    query = """
        SELECT 
            po.po_number,
            po.po_date,
            po.supplier_name,
            poi.material_code,
            poi.material_description,
            poi.ord_qty,
            poi.delivered_qty,
            poi.pending_qty,
            poi.unit,
            pod.dely_date as scheduled_delivery_date
        FROM purchase_order_items poi
        JOIN purchase_orders po ON poi.po_number = po.po_number
        LEFT JOIN purchase_order_deliveries pod ON poi.id = pod.po_item_id
        WHERE poi.pending_qty > 0
        ORDER BY pod.dely_date ASC, po.po_date DESC
    """
    
    data = conn.execute(query).fetchall()
    conn.close()
    
    if not data:
        st.success("✅ No pending deliveries! All items have been delivered.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(data, columns=[
        'PO Number', 'PO Date', 'Supplier', 'Material Code', 'Description',
        'Ordered Qty', 'Delivered Qty', 'Pending Qty', 'Unit', 'Scheduled Delivery'
    ])
    
    # Metrics
    total_items = len(df)
    total_pending_qty = df['Pending Qty'].sum()
    
    col1, col2, col3 = st.columns(3)
    col1.metric("Pending Items", total_items)
    col2.metric("Total Pending Qty", f"{total_pending_qty:,.0f}")
    col3.metric("Unique POs", df['PO Number'].nunique())
    
    st.markdown("---")
    
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    # Export options
    col1, col2 = st.columns(2)
    with col1:
        if st.button("📊 Export to Excel", key="pending_excel"):
            export_to_excel(df, "Pending_Deliveries.xlsx")
    with col2:
        if st.button("📄 Export to CSV", key="pending_csv"):
            export_to_csv(df, "Pending_Deliveries.csv")


def generate_po_value_analysis(start_date, end_date):
    """Generate PO value analysis"""
    st.markdown("---")
    st.markdown("### PO Value Analysis")
    
    conn = get_connection()
    
    # Top vendors by value
    top_vendors_query = """
        SELECT 
            supplier_name,
            COUNT(*) as po_count,
            SUM(po_value) as total_value
        FROM purchase_orders
        WHERE po_date BETWEEN ? AND ?
        GROUP BY supplier_name
        ORDER BY total_value DESC
        LIMIT 10
    """
    
    top_vendors = conn.execute(top_vendors_query, (start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))).fetchall()
    
    # Overall stats
    stats_query = """
        SELECT 
            COUNT(*) as total_pos,
            SUM(po_value) as total_value,
            AVG(po_value) as avg_value,
            MIN(po_value) as min_value,
            MAX(po_value) as max_value
        FROM purchase_orders
        WHERE po_date BETWEEN ? AND ?
    """
    
    stats = conn.execute(stats_query, (start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))).fetchone()
    conn.close()
    
    # Display stats
    col1, col2, col3, col4, col5 = st.columns(5)
    col1.metric("Total POs", stats['total_pos'])
    col2.metric("Total Value", f"₹{stats['total_value']:,.2f}" if stats['total_value'] else "₹0.00")
    col3.metric("Avg Value", f"₹{stats['avg_value']:,.2f}" if stats['avg_value'] else "₹0.00")
    col4.metric("Min Value", f"₹{stats['min_value']:,.2f}" if stats['min_value'] else "₹0.00")
    col5.metric("Max Value", f"₹{stats['max_value']:,.2f}" if stats['max_value'] else "₹0.00")
    
    st.markdown("---")
    st.markdown("#### Top 10 Vendors by Value")
    
    if top_vendors:
        df = pd.DataFrame(top_vendors, columns=['Supplier', 'PO Count', 'Total Value'])
        df['Total Value'] = df['Total Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
        
        st.dataframe(df, use_container_width=True, hide_index=True)
        
        # Export options
        col1, col2 = st.columns(2)
        with col1:
            if st.button("📊 Export to Excel", key="value_analysis_excel"):
                export_to_excel(df, f"PO_Value_Analysis_{start_date}_{end_date}.xlsx")
        with col2:
            if st.button("📄 Export to CSV", key="value_analysis_csv"):
                export_to_csv(df, f"PO_Value_Analysis_{start_date}_{end_date}.csv")
    else:
        st.info("No data available for the selected period.")
