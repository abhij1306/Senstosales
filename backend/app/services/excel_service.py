"""
Excel Generation Service
Uses XlsxWriter to generate formatted Excel reports with strict layout control.
"""
import io
import pandas as pd
from typing import List, Dict
from fastapi.responses import StreamingResponse
import xlsxwriter
import sqlite3
import logging

logger = logging.getLogger(__name__)

class ExcelService:
    
    @staticmethod
    def generate_response(data: List[Dict], report_type: str) -> StreamingResponse:
        """
        Convert list of dicts to Excel download response (Legacy fallback)
        """
        output = io.BytesIO()
        
        # Convert to DataFrame
        if not data:
            df = pd.DataFrame() # Empty
        else:
            df = pd.DataFrame(data)
            
        # Write to Excel with formatting
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name='Report', index=False)
            
            workbook = writer.book
            worksheet = writer.sheets['Report']
            
            # Formats
            header_fmt = workbook.add_format({
                'bold': True,
                'bg_color': '#4F81BD',
                'font_color': 'white',
                'border': 1
            })
            
            # Apply header format
            for col_num, value in enumerate(df.columns.values):
                worksheet.write(0, col_num, value, header_fmt)
                
            # Auto-adjust column width
            for i, col in enumerate(df.columns):
                column_len = max(df[col].astype(str).map(len).max(), len(col)) + 2
                worksheet.set_column(i, i, column_len)

        output.seek(0)
        
        filename = f"{report_type}.xlsx"
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
        
        return StreamingResponse(
            output, 
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers=headers
        )

    @staticmethod
    def _write_standard_header(worksheet, workbook, columns: int, db: sqlite3.Connection, title: str = None, layout: str = "invoice", font_name: str = "Calibri"):
        """
        Consistently writes the business header across all reports with layout options.
        layout: 'invoice' (Standard for Sales Invoice) or 'challan' (Standard for DC, Summary, GC)
        """
        # Fetch settings from DB
        try:
            rows = db.execute("SELECT key, value FROM business_settings").fetchall()
            settings = {row['key']: row['value'] for row in rows}
        except Exception as e:
            logger.error(f"Failed to fetch business settings, using defaults: {e}")
            settings = {}

        # Default Fallbacks
        s_name = settings.get('supplier_name', 'SENSTOGRAPHIC')
        s_desc = settings.get('supplier_description', 'Manufacturers & Suppliers of Fibre Glass Re-inforced Plastic Products')
        s_addr = settings.get('supplier_address', "Plot No. 20/21, 'H' Sector, Industrial Estate, Govindpura, Bhopal - 462023")
        s_gst = settings.get('supplier_gstin', '23AACFS6810L1Z7')
        s_phone = settings.get('supplier_contact', '0755 – 4247748, 9229113840')
        s_state = settings.get('supplier_state', 'Madhya Pradesh')
        s_state_code = settings.get('supplier_state_code', '23')
        
        # Formats
        title_fmt = workbook.add_format({'bold': True, 'font_size': 18, 'align': 'center', 'font_name': font_name})
        subtitle_fmt = workbook.add_format({'bold': True, 'font_size': 10, 'align': 'center', 'font_name': font_name})
        tel_fmt = workbook.add_format({'font_size': 10, 'align': 'center', 'font_name': font_name})
        name_fmt = workbook.add_format({'bold': True, 'font_size': 14, 'align': 'left', 'font_name': font_name})
        detail_fmt = workbook.add_format({'font_size': 11, 'align': 'left', 'font_name': font_name})
        bold_detail = workbook.add_format({'bold': True, 'font_size': 11, 'align': 'left', 'font_name': font_name})

        row = 0
        
        if layout == "invoice":
            # Layout matching 'GST_INV_11.xls'
            if title:
                worksheet.merge_range(row, 0, row, columns-1, title, workbook.add_format({'bold': True, 'font_size': 14, 'align': 'center', 'font_name': font_name}))
                row += 2 # Add spacing
            
            worksheet.merge_range(row, 0, row, 7, s_name, name_fmt) # Col H is index 7
            row += 1
            worksheet.merge_range(row, 0, row+1, 7, s_addr, detail_fmt)
            row += 2
            worksheet.merge_range(row, 0, row, 7, f"GSTIN/UIN: {s_gst}", bold_detail)
            row += 1
            worksheet.merge_range(row, 0, row, 7, f"State Name : {s_state}, Code : {s_state_code}", bold_detail)
            row += 1
            worksheet.merge_range(row, 0, row, 7, f"Contact : {s_phone}", bold_detail)
            row += 1
            
        elif layout == "challan":
            # Layout matching 'DC12.xls'
            # Row 1: Tel (Left), GSTIN (Right)
            worksheet.write(row, 0, f"Tel. No. {s_phone}", tel_fmt)
            worksheet.merge_range(row, columns-1, row, columns-1, f"GSTIN: {s_gst}", tel_fmt)
            row += 2 

            # Branding (Rows 3, 4, 5)
            worksheet.merge_range(row, 0, row, columns-1, s_name, title_fmt)
            row += 1
            worksheet.merge_range(row, 0, row, columns-1, s_desc, subtitle_fmt)
            row += 1
            worksheet.merge_range(row, 0, row, columns-1, s_addr, subtitle_fmt)
            row += 2 
            
            if title:
                worksheet.merge_range(row, 0, row, columns-1, title, workbook.add_format({'bold': True, 'font_size': 14, 'align': 'center', 'font_name': font_name}))
                row += 1

        return row

    @staticmethod
    def _write_buyer_block(worksheet, workbook, row: int, col: int, db: sqlite3.Connection, header: Dict = None, width: int = 5, label: str = "Buyer :", font_name: str = "Calibri"):
        """
        Consistently writes the Buyer/Consignee block.
        Fetches from DB settings as default, overriden by specific record header if available.
        """
        # Fetch settings from DB
        try:
            rows = db.execute("SELECT key, value FROM business_settings").fetchall()
            settings = {row['key']: row['value'] for row in rows}
        except Exception as e:
            logger.error(f"Failed to fetch business settings for buyer block: {e}")
            settings = {}

        # Default Buyer Info
        b_name = header.get('consignee_name') or settings.get('buyer_name', "M/S Bharat Heavy Electricals Ltd.")
        b_addr = header.get('consignee_address') or settings.get('buyer_address', "Bhopal, MP")
        b_gst = header.get('consignee_gstin') or settings.get('buyer_gstin', "23AAACB4146P1ZN")
        b_state = settings.get('buyer_state', "MP")
        b_state_code = settings.get('buyer_state_code', "23")
        b_pos = settings.get('buyer_place_of_supply', "BHOPAL, MP")
        
        # Formats - ALL buyer details should be BOLD with borders
        bold_border_fmt = workbook.add_format({
            'bold': True, 
            'font_size': 11, 
            'font_name': font_name,
            'border': 1,
            'valign': 'vcenter'
        })
        
        if label:
            worksheet.merge_range(row, col, row, col + width, label, bold_border_fmt)
            row += 1
            
        # Each line should be in its own row with borders - NO merging
        worksheet.merge_range(row, col, row, col + width, b_name, bold_border_fmt)
        row += 1
        
        # Address might be multi-line but still one row with border
        worksheet.merge_range(row, col, row, col + width, b_addr, bold_border_fmt)
        row += 1
        
        # Empty row for spacing (as per template)
        worksheet.merge_range(row, col, row, col + width, "", bold_border_fmt)
        row += 1
        
        worksheet.merge_range(row, col, row, col + width, f"GSTIN/UIN : {b_gst}", bold_border_fmt)
        row += 1
        
        # Buyer state: only State Name, NO Code (as per template)
        worksheet.merge_range(row, col, row, col + width, f"State Name : {b_state}", bold_border_fmt)
        row += 1
        
        worksheet.merge_range(row, col, row, col + width, f"Place of Supply : {b_pos}", bold_border_fmt)
        row += 1
        
        return row + 1

    @staticmethod
    def generate_exact_invoice_excel(header: Dict, items: List[Dict], db: sqlite3.Connection) -> StreamingResponse:
        """
        Generate strict Excel format matching 'GST_INV_31.xls' audit structure.
        Uses a 19-column grid (A-S).
        """
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet("Invoice")
        
        # Styles
        font_name = 'Arial'
        title_fmt = workbook.add_format({'bold': True, 'font_size': 13, 'align': 'center', 'valign': 'vcenter', 'font_name': font_name})
        copy_fmt = workbook.add_format({'font_size': 24, 'align': 'right', 'valign': 'vcenter', 'font_name': font_name})
        header_bold = workbook.add_format({'bold': True, 'font_size': 10, 'font_name': font_name, 'border': 1, 'valign': 'top'})
        header_normal = workbook.add_format({'font_size': 10, 'font_name': font_name, 'border': 1, 'valign': 'top', 'text_wrap': True})
        
        table_hdr = workbook.add_format({'bold': True, 'font_size': 10, 'font_name': font_name, 'border': 1, 'align': 'center', 'valign': 'vcenter', 'text_wrap': True})
        cell_center = workbook.add_format({'font_size': 10, 'font_name': font_name, 'border': 1, 'align': 'center', 'valign': 'vcenter'})
        cell_left = workbook.add_format({'font_size': 10, 'font_name': font_name, 'border': 1, 'align': 'left', 'valign': 'vcenter', 'text_wrap': True})
        cell_right = workbook.add_format({'font_size': 10, 'font_name': font_name, 'border': 1, 'align': 'right', 'valign': 'vcenter', 'num_format': '#,##0.00'})
        decl_fmt = workbook.add_format({'font_size': 9, 'font_name': font_name, 'italic': True, 'text_wrap': True, 'valign': 'top'})
        
        # Column Widths (Approximated based on 19 cols)
        worksheet.set_column('A:A', 5)   # PO SL
        worksheet.set_column('B:H', 6)   # Description (Merged)
        worksheet.set_column('I:I', 10)  # HSN
        worksheet.set_column('J:J', 8)   # No of Pckt
        worksheet.set_column('K:K', 10)  # Quantity
        worksheet.set_column('L:L', 10)  # Rate
        worksheet.set_column('M:M', 8)   # Unit
        worksheet.set_column('N:N', 12)  # Taxable
        worksheet.set_column('O:P', 10)  # CGST
        worksheet.set_column('Q:R', 10)  # SGST
        worksheet.set_column('S:S', 15)  # Total
        
        # --- ROW 0: TITLE ---
        worksheet.merge_range(0, 0, 0, 18, "TAX INVOICE", title_fmt)
        
        # --- ROW 1: COPY ---
        worksheet.merge_range(1, 14, 1, 18, "Extra Copy", copy_fmt)
        
        # --- HEADER BLOCKS (Rows 2-13) ---
        # Supplier (Left)
        s_name = "SENSTOGRAPHIC"
        s_addr = "H-20/21, Industrial Estate, Govindpura, Bhopal - 462023"
        s_gst = "23AACFS6810L1Z7"
        
        worksheet.merge_range(2, 0, 4, 7, f"{s_name}\n{s_addr}\nGSTIN: {s_gst}", header_bold)
        
        # Info Box (Right)
        worksheet.merge_range(2, 8, 3, 12, "Invoice No.", header_bold)
        worksheet.merge_range(2, 13, 3, 18, header.get('invoice_number', ''), cell_center)
        
        worksheet.merge_range(4, 8, 5, 12, "Dated", header_bold)
        worksheet.merge_range(4, 13, 5, 18, header.get('invoice_date', ''), cell_center)
        
        # Buyer
        buyer_val = f"{header.get('buyer_name', '')}\n{header.get('buyer_address', '')}\nGSTIN: {header.get('buyer_gstin', '')}"
        worksheet.merge_range(5, 0, 9, 7, f"Buyer:\n{buyer_val}", header_normal)
        
        # More Info
        worksheet.merge_range(6, 8, 7, 12, "Buyer's Order No.", header_bold)
        worksheet.merge_range(6, 13, 7, 18, str(header.get('po_numbers', '')), cell_center)
        
        worksheet.merge_range(8, 8, 9, 12, "DC Number", header_bold)
        worksheet.merge_range(8, 13, 9, 18, str(header.get('linked_dc_numbers', '')), cell_center)
        
        # Dispatch
        worksheet.merge_range(10, 0, 11, 7, f"Despatched through: {header.get('transporter', '')}", header_normal)
        worksheet.merge_range(10, 8, 11, 18, f"Destination: {header.get('destination', '')}", header_normal)
        
        worksheet.merge_range(12, 0, 13, 18, f"Terms of Delivery: {header.get('terms_of_delivery', '')}", header_normal)
        
        # --- TABLE HEADER (Rows 14-15) ---
        row = 14
        worksheet.merge_range(row, 0, row+1, 0, "PO\nSL", table_hdr)
        worksheet.merge_range(row, 1, row+1, 7, "Description of Goods", table_hdr)
        worksheet.merge_range(row, 8, row+1, 8, "HSN/SAC", table_hdr)
        worksheet.merge_range(row, 9, row+1, 9, "No of\nPckt", table_hdr)
        worksheet.merge_range(row, 10, row+1, 10, "Quantity", table_hdr)
        worksheet.merge_range(row, 11, row+1, 11, "Rate", table_hdr)
        worksheet.merge_range(row, 12, row+1, 12, "Unit", table_hdr)
        worksheet.merge_range(row, 13, row+1, 13, "Taxable", table_hdr)
        worksheet.merge_range(row, 14, row, 15, "Central Tax", table_hdr)
        worksheet.merge_range(row, 16, row, 17, "State Tax", table_hdr)
        worksheet.merge_range(row, 18, row+1, 18, "Total", table_hdr)
        
        row += 1
        worksheet.write(row, 14, "Rate", table_hdr)
        worksheet.write(row, 15, "Amount", table_hdr)
        worksheet.write(row, 16, "Rate", table_hdr)
        worksheet.write(row, 17, "Amount", table_hdr)
        
        # --- DATA ROWS ---
        row += 1
        for idx, item in enumerate(items):
            worksheet.write(row, 0, item.get('po_item_no', idx + 1), cell_center)
            worksheet.merge_range(row, 1, row, 7, item.get('description', ''), cell_left)
            worksheet.write(row, 8, item.get('hsn_sac', ''), cell_center)
            worksheet.write(row, 9, item.get('no_of_packets', 0), cell_center)
            worksheet.write(row, 10, item.get('quantity', 0), cell_center)
            worksheet.write(row, 11, item.get('rate', 0), cell_right)
            worksheet.write(row, 12, item.get('unit', 'NOS'), cell_center)
            worksheet.write(row, 13, item.get('taxable_value', 0), cell_right)
            
            worksheet.write(row, 14, "9.00%", cell_center)
            worksheet.write(row, 15, item.get('cgst_amount', 0), cell_right)
            worksheet.write(row, 16, "9.00%", cell_center)
            worksheet.write(row, 17, item.get('sgst_amount', 0), cell_right)
            
            worksheet.write(row, 18, item.get('total_amount', 0), cell_right)
            row += 1
            
        # Totals
        worksheet.merge_range(row, 0, row, 7, "Total", table_hdr)
        worksheet.write(row, 8, "", table_hdr)
        worksheet.write(row, 9, sum(i.get('no_of_packets', 0) or 0 for i in items), cell_center)
        worksheet.write(row, 10, sum(i.get('quantity', 0) or 0 for i in items), cell_center)
        worksheet.write(row, 11, "", table_hdr)
        worksheet.write(row, 12, "", table_hdr)
        worksheet.write(row, 13, header.get('taxable_value', 0), cell_right)
        worksheet.write(row, 14, "", table_hdr)
        worksheet.write(row, 15, header.get('cgst', 0), cell_right)
        worksheet.write(row, 16, "", table_hdr)
        worksheet.write(row, 17, header.get('sgst', 0), cell_right)
        worksheet.write(row, 18, header.get('total_invoice_value', 0), cell_right)
        
        # Words Footer
        row += 1
        from app.utils.num_to_words import amount_to_words
        amount_words = amount_to_words(header.get('total_invoice_value', 0))
        worksheet.merge_range(row, 0, row, 18, f"Total Amount (In Words):- {amount_words}", header_bold)
        
        # Final block
        worksheet.merge_range(row, 7, row, 12, "For Senstographic", workbook.add_format({'bold': True, 'align': 'right', 'font_size': 11, 'font_name': 'Calibri'}))
        row += 1
        worksheet.merge_range(row, 0, row + 1, 6, "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct", decl_fmt)
        row += 2
        worksheet.merge_range(row, 7, row, 12, "Authorised Signatory", workbook.add_format({'align': 'right', 'font_size': 11, 'font_name': 'Calibri'}))
        
        # Footer Rows
        row += 2
        footer_fmt = workbook.add_format({'align': 'center', 'font_size': 10, 'font_name': 'Calibri'})
        worksheet.merge_range(row, 0, row, 12, "SUBJECT TO BHOPAL JURISDICTION", footer_fmt)
        row += 1
        worksheet.merge_range(row, 0, row, 12, "This is a Computer Generated Invoice", footer_fmt)

        workbook.close()
        output.seek(0)
        
        filename = f"Invoice_{header.get('invoice_number', 'Draft')}.xlsx"
        headers = {'Content-Disposition': f'attachment; filename="{filename}"'}
        return StreamingResponse(output, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers=headers)

    @staticmethod
    def generate_exact_dc_excel(header: Dict, items: List[Dict], db: sqlite3.Connection) -> StreamingResponse:
        """
        Generate strict Excel format matching 'DC12.xls' and User Screenshot
        """
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet("Delivery Challan")
        
        # Styles
        title_fmt = workbook.add_format({'bold': True, 'font_size': 20, 'align': 'center', 'font_name': 'Calibri'})
        border_box = workbook.add_format({'border': 1, 'text_wrap': True, 'valign': 'top', 'font_name': 'Calibri', 'font_size': 11})
        border_bold = workbook.add_format({'border': 1, 'bold': True, 'text_wrap': True, 'valign': 'top', 'font_name': 'Calibri', 'font_size': 11})
        header_table = workbook.add_format({'border': 1, 'bold': True, 'align': 'center', 'valign': 'vcenter', 'font_name': 'Calibri', 'text_wrap': True})
        cell_fmt = workbook.add_format({'border': 1, 'valign': 'vcenter', 'font_name': 'Calibri'})
        cell_center = workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter', 'font_name': 'Calibri'})
        border_all = workbook.add_format({'border': 1, 'font_name': 'Calibri', 'font_size': 11, 'text_wrap': True, 'valign': 'vcenter'}) # Added for new layout
        
        worksheet.set_column('A:A', 10)  # P.O.Sl. No.
        worksheet.set_column('B:B', 60)  # Description
        worksheet.set_column('C:C', 15)  # Quantity
        
        # Use helper for standardized header
        current_row = ExcelService._write_standard_header(worksheet, workbook, columns=3, db=db, title="DELIVERY CHALLAN", layout="challan")

        # Buyer Block (To...)
        buyer_end_row = ExcelService._write_buyer_block(worksheet, workbook, current_row, 0, db, header, width=1)
        
        # Right Header Box (Coincides with Buyer Block)
        worksheet.write(current_row, 2, f"Challan No. : {header.get('dc_number', '')}", border_box)
        worksheet.write(current_row + 1, 2, f"Date : {header.get('dc_date', '')}", border_box)
        worksheet.write(current_row + 2, 2, f"Your PO No. : {header.get('po_number', '')}", border_box)

        # Table Headers
        table_row = max(buyer_end_row, current_row + 4)
        worksheet.write(table_row, 0, "P.O.Sl. No.", header_table)
        worksheet.write(table_row, 1, "Description", header_table)
        worksheet.write(table_row, 2, "Quantity", header_table)
        
        # Data
        item_row = table_row + 1
        for item in items:
            worksheet.write(item_row, 0, item.get('po_item_no', ''), cell_center)
            worksheet.write(item_row, 1, item.get('description', ''), cell_fmt)
            worksheet.write(item_row, 2, f"{item.get('dispatched_quantity', 0)} {item.get('unit', '')}", cell_center)
            item_row += 1
            
        # Fill blank?
        for _ in range(item_row, item_row + 5): # Ensure at least 5 blank rows after items
            worksheet.write(_, 0, "", cell_fmt)
            worksheet.write(_, 1, "", cell_fmt)
            worksheet.write(_, 2, "", cell_fmt)
            item_row += 1

        # Footer
        worksheet.write(item_row, 0, "1", cell_center)
        
        inv_dt_str = f"Dt. {header.get('invoice_date')}" if header.get('invoice_date') else ""
        worksheet.merge_range(item_row, 1, item_row, 2, f"GST Bill No. {header.get('invoice_number', '')} {inv_dt_str}", cell_fmt)
        item_row += 1
        
        worksheet.write(item_row, 0, "2", cell_center)
        
        gc_dt_str = f"Dt. {header.get('gc_date')}" if header.get('gc_date') else ""
        worksheet.merge_range(item_row, 1, item_row, 2, f"Gurantee Certificate No. {header.get('gc_no', '')} {gc_dt_str}", cell_fmt)
        item_row += 1
        
        worksheet.write(item_row, 0, "3", cell_center)
        worksheet.merge_range(item_row, 1, item_row, 2, f"Dimension Report {header.get('dr_no', '')}", cell_fmt)

        workbook.close()
        output.seek(0)
        
        filename = f"DC_{header.get('dc_number')}.xlsx"
        return StreamingResponse(output, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers={'Content-Disposition': f'attachment; filename="{filename}"'})

    @staticmethod
    def generate_dispatch_summary(date_str: str, items: List[Dict], db: sqlite3.Connection) -> StreamingResponse:
        """
        Generate strict Excel format matching 'Summary.xls' and User Screenshot
        """
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet("Summary")
        
        # Styles
        title_fmt = workbook.add_format({'bold': True, 'font_size': 18, 'align': 'center', 'font_name': 'Calibri'})
        subtitle_fmt = workbook.add_format({'bold': True, 'font_size': 11, 'align': 'center', 'font_name': 'Calibri'})
        header_table = workbook.add_format({'bold': True, 'border': 1, 'align': 'center', 'valign': 'vcenter', 'text_wrap': True, 'font_name': 'Calibri'})
        cell_fmt = workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter', 'font_name': 'Calibri'})
        bold_left = workbook.add_format({'bold': True, 'font_name': 'Calibri'})

        # Column Widths
        worksheet.set_column('A:A', 5)   # S.No.
        worksheet.set_column('B:B', 30)  # Description
        worksheet.set_column('C:C', 15)  # Quantity
        worksheet.set_column('D:D', 8)   # No of packets
        worksheet.set_column('E:E', 12)  # PO NO
        worksheet.set_column('F:F', 18)  # GEMC NO
        worksheet.set_column('G:G', 10)  # Invoice No.
        worksheet.set_column('H:H', 10)  # Challan No.
        worksheet.set_column('I:I', 12)  # Dispatch Delivered

        # Header Section
        current_row = ExcelService._write_standard_header(worksheet, workbook, columns=9, db=db, title="SUMMARY", layout="challan")
        
        worksheet.write(current_row, 0, "Date:", bold_left)
        worksheet.write(current_row, 1, date_str, bold_left)
        
        table_row = current_row + 2
        headers = ["S. No.", "Description", "Quantity Set/Nos.", "No of packets", "PO NO", "GEMC NO", "Invoice No.", "Challan No.", "Dispatch Delivered"]
        for i, h in enumerate(headers):
            worksheet.write(table_row, i, h, header_table)
            
        # Data
        row = table_row + 1
        for idx, item in enumerate(items):
            worksheet.write(row, 0, idx + 1, cell_fmt)
            worksheet.write(row, 1, item.get('description', ''), cell_fmt)
            worksheet.write(row, 2, f"{item.get('quantity', '')} {item.get('unit', '')}", cell_fmt)
            worksheet.write(row, 3, item.get('no_of_packets', ''), cell_fmt)
            worksheet.write(row, 4, item.get('po_number', ''), cell_fmt)
            worksheet.write(row, 5, item.get('gemc_number', ''), cell_fmt)
            worksheet.write(row, 6, item.get('invoice_number', ''), cell_fmt)
            worksheet.write(row, 7, item.get('dc_number', ''), cell_fmt)
            worksheet.write(row, 8, item.get('destination', ''), cell_fmt)
            row += 1
            
        workbook.close()
        return StreamingResponse(output, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers={'Content-Disposition': f'attachment; filename="Summary_{date_str}.xlsx"'})

    @staticmethod
    def generate_guarantee_certificate(header: Dict, items: List[Dict], db: sqlite3.Connection) -> StreamingResponse:
        """
        Generate Guarantee Certificate matching the GC5.xls format.
        """
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet("Guarantee Certificate")
        
        # Styles
        base_font = 'Arial'
        tel_fmt = workbook.add_format({'font_name': base_font, 'font_size': 12})
        company_fmt = workbook.add_format({'bold': True, 'font_size': 16, 'align': 'center', 'font_name': base_font})
        subtitle_fmt = workbook.add_format({'bold': True, 'font_size': 10, 'align': 'center', 'font_name': base_font})
        header_fmt = workbook.add_format({'bold': True, 'font_size': 14, 'align': 'center', 'font_name': base_font})
        border_all = workbook.add_format({'border': 1, 'font_name': base_font, 'font_size': 11})
        border_box = workbook.add_format({'border': 1, 'text_wrap': True, 'valign': 'top', 'font_name': base_font, 'font_size': 11})
        
        header_table = workbook.add_format({'border': 1, 'bold': True, 'align': 'center', 'valign': 'vcenter', 'font_name': base_font, 'text_wrap': True})
        cell_fmt = workbook.add_format({'border': 1, 'valign': 'vcenter', 'font_name': base_font})
        cell_center = workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter', 'font_name': base_font})
        footer_bold = workbook.add_format({'bold': True, 'font_name': base_font, 'font_size': 12, 'align': 'left'})

        # Column Widths
        worksheet.set_column('A:A', 2)
        worksheet.set_column('B:G', 12)
        worksheet.set_column('H:H', 15)
        worksheet.set_column('I:J', 12)

        # Header Section
        current_row = ExcelService._write_standard_header(worksheet, workbook, columns=10, db=db, title="GUARANTEE  CERTIFICATE", layout="challan", font_name=base_font)

        # Buyer Block (To...)
        buyer_end_row = ExcelService._write_buyer_block(worksheet, workbook, current_row, 1, db, header, width=5, label="To,", font_name=base_font)
        
        # Info Box (Right Side)
        worksheet.write(current_row, 7, "GC No. & Dt.: ", border_all)
        
        gc_val = f"{header.get('gc_no', '05')}  dt. {header.get('gc_date', '')}"
        worksheet.merge_range(current_row, 8, current_row, 9, gc_val, border_all)
        
        worksheet.write(current_row + 1, 7, "PO No. & Dt.: ", border_all)
        
        po_val = f"{header.get('po_number', '')}  dt. {header.get('po_date', '')}"
        worksheet.merge_range(current_row + 1, 8, current_row + 1, 9, po_val, border_all)
        
        worksheet.write(current_row + 2, 7, "DC No. & Dt: ", border_all)
        
        dc_val = f"{header.get('dc_number', '')}  dt. {header.get('dc_date', '')}"
        worksheet.merge_range(current_row + 2, 8, current_row + 2, 9, dc_val, border_all)

        # Table Headers
        table_row = max(buyer_end_row, current_row + 4)
        worksheet.write(table_row, 1, "P.O.Sl.\nNo.", header_table)
        worksheet.merge_range(table_row, 2, table_row, 7, "Description", header_table)
        worksheet.merge_range(table_row, 8, table_row, 9, "Quantity", header_table)

        # Data
        item_row = table_row + 1
        for item in items:
            worksheet.write(item_row, 1, item.get('po_item_no', ''), cell_center)
            worksheet.merge_range(item_row, 2, item_row, 7, item.get('description', ''), cell_fmt)
            worksheet.merge_range(item_row, 8, item_row, 9, f"{item.get('quantity', 0)} {item.get('unit', '')}", cell_center)
            item_row += 1
            
        # Blank rows
        while item_row < table_row + 11:
            worksheet.write(item_row, 1, "", cell_center)
            worksheet.merge_range(item_row, 2, item_row, 7, "", cell_fmt)
            worksheet.merge_range(item_row, 8, item_row, 9, "", cell_center)
            item_row += 1

        # Footer Text
        item_row += 1
        footer_text = (
            "The goods supplied as above are guaranteed against manufacturing defects for 24 Month "
            "from delivery date. We undertake to replace or rectify the materials free of cost if any defects "
            "occur during this period."
        )
        worksheet.merge_range(item_row, 1, item_row + 2, 9, footer_text, workbook.add_format({'text_wrap': True, 'font_name': base_font}))
        item_row += 4
        
        # Signature
        worksheet.write(item_row, 7, "For SENSTOGRAPHIC", footer_bold)

        workbook.close()
        output.seek(0)
        
        filename = f"GC_{header.get('dc_number')}.xlsx"
        return StreamingResponse(output, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers={'Content-Disposition': f'attachment; filename="{filename}"'})

    @staticmethod
    def generate_po_upload_template() -> StreamingResponse:
        """
        Generate empty PO upload template with required headers
        """
        output = io.BytesIO()
        df = pd.DataFrame(columns=[
            "PO Number", "PO Date", "Vendor Name", "Project Name", 
            "Item No", "Material Code", "Description", "Unit", "Qty", "Rate", "Delivery Date"
        ])
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='PO_Upload')
            workbook = writer.book
            worksheet = writer.sheets['PO_Upload']
            header_fmt = workbook.add_format({'bold': True, 'bg_color': '#D7E4BC', 'border': 1})
            for col_num, value in enumerate(df.columns.values):
                worksheet.write(0, col_num, value, header_fmt)
            worksheet.set_column('A:K', 15)
            
        output.seek(0)
        return StreamingResponse(output, headers={'Content-Disposition': 'attachment; filename="PO_Upload_Template.xlsx"'})

    @staticmethod
    def generate_srv_upload_template() -> StreamingResponse:
        """
        Generate empty SRV upload template with required headers
        """
        output = io.BytesIO()
        df = pd.DataFrame(columns=[
            "SRV Number", "SRV Date", "PO Number", "PO Item No", "Lot No",
            "Received Qty", "Rejected Qty", "Challan No", "Challan Date", "Invoice No", "Invoice Date", "Remarks"
        ])
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='SRV_Upload')
            workbook = writer.book
            worksheet = writer.sheets['SRV_Upload']
            header_fmt = workbook.add_format({'bold': True, 'bg_color': '#DDEBF7', 'border': 1})
            for col_num, value in enumerate(df.columns.values):
                worksheet.write(0, col_num, value, header_fmt)
            worksheet.set_column('A:L', 15)

        output.seek(0)
        return StreamingResponse(output, headers={'Content-Disposition': 'attachment; filename="SRV_Upload_Template.xlsx"'})
