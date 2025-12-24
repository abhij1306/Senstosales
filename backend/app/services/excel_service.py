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
    def generate_dc_excel(header: Dict, items: List[Dict]) -> StreamingResponse:
        """
        Generate strict Delivery Challan format
        """
        # Implementation for DC print format... 
        # Reusing the generic logic for now but specific DC formatting can go here.
        # Merging header info + items table.
        
        flat_data = []
        for item in items:
            row = {**header, **item} # Flatten
            flat_data.append(row)
            
        return ExcelService.generate_response(flat_data, f"DC_{header.get('dc_number')}")
