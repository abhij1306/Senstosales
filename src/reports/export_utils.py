import streamlit as st
import pandas as pd
import io

def export_to_excel(df, filename):
    """Export DataFrame to Excel and provide download button"""
    try:
        # Create a BytesIO buffer
        buffer = io.BytesIO()
        
        # Write DataFrame to Excel
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Report')
            
            # Get the workbook and worksheet
            workbook = writer.book
            worksheet = writer.sheets['Report']
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        buffer.seek(0)
        
        # Provide download button
        st.download_button(
            label="📊 Download Excel",
            data=buffer,
            file_name=filename,
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            key=f"download_excel_{filename}"
        )
        
        st.success(f"✅ Excel file ready for download!")
        
    except Exception as e:
        st.error(f"Error creating Excel file: {str(e)}")


def export_to_csv(df, filename):
    """Export DataFrame to CSV and provide download button"""
    try:
        # Convert DataFrame to CSV
        csv = df.to_csv(index=False)
        
        # Provide download button
        st.download_button(
            label="📄 Download CSV",
            data=csv,
            file_name=filename,
            mime="text/csv",
            key=f"download_csv_{filename}"
        )
        
        st.success(f"✅ CSV file ready for download!")
        
    except Exception as e:
        st.error(f"Error creating CSV file: {str(e)}")


def export_to_pdf(content, filename):
    """Export content to PDF - placeholder for future implementation"""
    st.info("PDF export feature will be implemented based on your templates!")
    # This will be implemented after reviewing the user's templates
    pass
