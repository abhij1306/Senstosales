import streamlit as st
from config.database import get_connection
import pandas as pd
from src.reports.export_utils import export_to_excel, export_to_csv

def generate_gst_summary(start_date, end_date):
    """Generate GST summary by period"""
    st.markdown("---")
    st.markdown("### GST Summary by Period")
    
    conn = get_connection()
    
    query = """
        SELECT 
            strftime('%Y-%m', invoice_date) as month,
            COUNT(*) as invoice_count,
            SUM(taxable_value) as total_taxable,
            SUM(cgst) as total_cgst,
            SUM(sgst) as total_sgst,
            SUM(igst) as total_igst,
            SUM(total_invoice_value) as total_invoice_value
        FROM gst_invoices
        WHERE invoice_date BETWEEN ? AND ?
        GROUP BY month
        ORDER BY month DESC
    """
    
    data = conn.execute(query, (start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))).fetchall()
    conn.close()
    
    if not data:
        st.info("No GST invoices found for the selected date range.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(data, columns=[
        'Month', 'Invoice Count', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Invoice Value'
    ])
    
    # Metrics
    total_invoices = df['Invoice Count'].sum()
    total_taxable = df['Taxable Value'].sum()
    total_tax = df['CGST'].sum() + df['SGST'].sum() + df['IGST'].sum()
    total_value = df['Total Invoice Value'].sum()
    
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Invoices", total_invoices)
    col2.metric("Taxable Value", f"₹{total_taxable:,.2f}" if total_taxable else "₹0.00")
    col3.metric("Total Tax", f"₹{total_tax:,.2f}" if total_tax else "₹0.00")
    col4.metric("Total Value", f"₹{total_value:,.2f}" if total_value else "₹0.00")
    
    st.markdown("---")
    
    # Format for display
    df['Taxable Value'] = df['Taxable Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['CGST'] = df['CGST'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['SGST'] = df['SGST'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['IGST'] = df['IGST'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['Total Invoice Value'] = df['Total Invoice Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    # Export options
    col1, col2 = st.columns(2)
    with col1:
        if st.button("📊 Export to Excel", key="gst_summary_excel"):
            export_to_excel(df, f"GST_Summary_{start_date}_{end_date}.xlsx")
    with col2:
        if st.button("📄 Export to CSV", key="gst_summary_csv"):
            export_to_csv(df, f"GST_Summary_{start_date}_{end_date}.csv")


def generate_tax_liability(start_date, end_date):
    """Generate tax liability report"""
    st.markdown("---")
    st.markdown("### Tax Liability Report")
    
    conn = get_connection()
    
    query = """
        SELECT 
            invoice_number,
            invoice_date,
            taxable_value,
            cgst,
            sgst,
            igst,
            (cgst + sgst + igst) as total_tax,
            total_invoice_value
        FROM gst_invoices
        WHERE invoice_date BETWEEN ? AND ?
        ORDER BY invoice_date DESC
    """
    
    data = conn.execute(query, (start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))).fetchall()
    conn.close()
    
    if not data:
        st.info("No GST invoices found for the selected date range.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(data, columns=[
        'Invoice Number', 'Invoice Date', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Invoice Value'
    ])
    
    # Metrics
    total_cgst = df['CGST'].sum()
    total_sgst = df['SGST'].sum()
    total_igst = df['IGST'].sum()
    total_tax = df['Total Tax'].sum()
    
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total CGST", f"₹{total_cgst:,.2f}" if total_cgst else "₹0.00")
    col2.metric("Total SGST", f"₹{total_sgst:,.2f}" if total_sgst else "₹0.00")
    col3.metric("Total IGST", f"₹{total_igst:,.2f}" if total_igst else "₹0.00")
    col4.metric("Total Tax Liability", f"₹{total_tax:,.2f}" if total_tax else "₹0.00")
    
    st.markdown("---")
    
    # Format for display
    df['Taxable Value'] = df['Taxable Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['CGST'] = df['CGST'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['SGST'] = df['SGST'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['IGST'] = df['IGST'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['Total Tax'] = df['Total Tax'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['Invoice Value'] = df['Invoice Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    # Export options
    col1, col2 = st.columns(2)
    with col1:
        if st.button("📊 Export to Excel", key="tax_liability_excel"):
            export_to_excel(df, f"Tax_Liability_{start_date}_{end_date}.xlsx")
    with col2:
        if st.button("📄 Export to CSV", key="tax_liability_csv"):
            export_to_csv(df, f"Tax_Liability_{start_date}_{end_date}.csv")


def generate_invoice_register(start_date, end_date):
    """Generate invoice register"""
    st.markdown("---")
    st.markdown("### Invoice Register")
    
    conn = get_connection()
    
    query = """
        SELECT 
            gi.invoice_number,
            gi.invoice_date,
            gi.customer_gstin,
            gi.place_of_supply,
            gi.linked_dc_numbers,
            gi.taxable_value,
            gi.cgst,
            gi.sgst,
            gi.igst,
            gi.total_invoice_value
        FROM gst_invoices gi
        WHERE gi.invoice_date BETWEEN ? AND ?
        ORDER BY gi.invoice_date DESC
    """
    
    data = conn.execute(query, (start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))).fetchall()
    conn.close()
    
    if not data:
        st.info("No invoices found for the selected date range.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(data, columns=[
        'Invoice Number', 'Date', 'Customer GSTIN', 'Place of Supply', 'Linked DCs',
        'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Value'
    ])
    
    # Metrics
    total_invoices = len(df)
    total_value = df['Total Value'].sum()
    
    col1, col2 = st.columns(2)
    col1.metric("Total Invoices", total_invoices)
    col2.metric("Total Invoice Value", f"₹{total_value:,.2f}" if total_value else "₹0.00")
    
    st.markdown("---")
    
    # Format for display
    df['Taxable Value'] = df['Taxable Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['CGST'] = df['CGST'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['SGST'] = df['SGST'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['IGST'] = df['IGST'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['Total Value'] = df['Total Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    # Export options
    col1, col2 = st.columns(2)
    with col1:
        if st.button("📊 Export to Excel", key="invoice_register_excel"):
            export_to_excel(df, f"Invoice_Register_{start_date}_{end_date}.xlsx")
    with col2:
        if st.button("📄 Export to CSV", key="invoice_register_csv"):
            export_to_csv(df, f"Invoice_Register_{start_date}_{end_date}.csv")


def generate_hsn_summary(start_date, end_date):
    """Generate HSN-wise summary"""
    st.markdown("---")
    st.markdown("### HSN-wise Tax Summary")
    
    conn = get_connection()
    
    query = """
        SELECT 
            dci.hsn_code,
            hsn.gst_rate,
            COUNT(DISTINCT gi.invoice_number) as invoice_count,
            SUM(dci.dispatch_qty * poi.po_rate) as taxable_value,
            SUM(dci.dispatch_qty * poi.po_rate * COALESCE(hsn.gst_rate, 18) / 100) as total_tax
        FROM gst_invoice_dc_links gidl
        JOIN gst_invoices gi ON gidl.invoice_number = gi.invoice_number
        JOIN delivery_challan_items dci ON gidl.dc_number = dci.dc_number
        JOIN purchase_order_items poi ON dci.po_item_id = poi.id
        LEFT JOIN hsn_master hsn ON dci.hsn_code = hsn.hsn_code
        WHERE gi.invoice_date BETWEEN ? AND ?
        GROUP BY dci.hsn_code
        ORDER BY taxable_value DESC
    """
    
    data = conn.execute(query, (start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))).fetchall()
    conn.close()
    
    if not data:
        st.info("No HSN data found for the selected date range.")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(data, columns=[
        'HSN Code', 'GST Rate (%)', 'Invoice Count', 'Taxable Value', 'Total Tax'
    ])
    
    # Replace None with default values
    df['HSN Code'] = df['HSN Code'].fillna('UNCLASSIFIED')
    df['GST Rate (%)'] = df['GST Rate (%)'].fillna(18)
    
    # Metrics
    total_taxable = df['Taxable Value'].sum()
    total_tax = df['Total Tax'].sum()
    unique_hsn = df['HSN Code'].nunique()
    
    col1, col2, col3 = st.columns(3)
    col1.metric("Unique HSN Codes", unique_hsn)
    col2.metric("Total Taxable Value", f"₹{total_taxable:,.2f}" if total_taxable else "₹0.00")
    col3.metric("Total Tax", f"₹{total_tax:,.2f}" if total_tax else "₹0.00")
    
    st.markdown("---")
    
    # Format for display
    df['Taxable Value'] = df['Taxable Value'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    df['Total Tax'] = df['Total Tax'].apply(lambda x: f"₹{x:,.2f}" if pd.notna(x) else "₹0.00")
    
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    # Export options
    col1, col2 = st.columns(2)
    with col1:
        if st.button("📊 Export to Excel", key="hsn_summary_excel"):
            export_to_excel(df, f"HSN_Summary_{start_date}_{end_date}.xlsx")
    with col2:
        if st.button("📄 Export to CSV", key="hsn_summary_csv"):
            export_to_csv(df, f"HSN_Summary_{start_date}_{end_date}.csv")
