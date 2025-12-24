"""
Excel Generation Service
Uses XlsxWriter to generate formatted Excel reports.
"""
import io
import pandas as pd
from typing import List, Dict
from fastapi.responses import StreamingResponse

class ExcelService:
    
    @staticmethod
    def generate_response(data: List[Dict], report_type: str) -> StreamingResponse:
        """
        Convert list of dicts to Excel download response
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
    def generate_po_excel(header: Dict, items: List[Dict], deliveries: List[Dict]) -> StreamingResponse:
        """
        Generate Excel export for PO
        """
        # Flatten structure: Header + Item + Delivery
        flat_data = []
        
        # If no items, just dump header
        if not items:
            flat_data.append(header.dict())
        else:
            for item in items:
                # Find deliveries for this item
                # Note: 'deliveries' arg is currently all deliveries flat, need to associate or use item.deliveries
                # But po.py passes item.deliveries inside items if we look at get_po_detail implementation?
                # Actually po.py:190 flattens deliveries separately. Let's just use the item's data + header.
                
                # Base row with header info
                base_row = header.dict() if hasattr(header, 'dict') else header
                
                item_data = item.dict() if hasattr(item, 'dict') else item
                # Remove nested list from flat export
                if 'deliveries' in item_data:
                    del item_data['deliveries']
                
                # Merge
                base_row.update(item_data)
                
                # If we want to show deliveries, we might need multiple rows per item
                # For now, let's keep it one row per item for simplicity, 
                # or just dump the flattened version if provided.
                
                flat_data.append(base_row)
                
        return ExcelService.generate_response(flat_data, f"PO_{header.po_number if hasattr(header, 'po_number') else header.get('po_number')}")

    @staticmethod
    def generate_dc_excel(header: Dict, items: List[Dict]) -> StreamingResponse:
        """
        Generate strict Delivery Challan format
        """
        flat_data = []
        for item in items:
            row = {**header, **item} # Flatten
            flat_data.append(row)
            
        return ExcelService.generate_response(flat_data, f"DC_{header.get('dc_number')}")

    @staticmethod
    def generate_invoice_excel(header: Dict, items: List[Dict]) -> StreamingResponse:
        """
        Generate strict Invoice format
        """
        flat_data = []
        for item in items:
            row = {**header, **item}
            flat_data.append(row)
            
        return ExcelService.generate_response(flat_data, f"Invoice_{header.get('invoice_number')}")
