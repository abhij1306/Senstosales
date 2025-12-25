import xlrd
import json
import sys

def audit_xls(path):
    workbook = xlrd.open_workbook(path, formatting_info=True)
    sheet = workbook.sheet_by_index(0)
    
    data = []
    for r in range(min(sheet.nrows, 50)): # Check first 50 rows
        row_data = []
        for c in range(sheet.ncols):
            val = sheet.cell_value(r, c)
            xf_index = sheet.cell_xf_index(r, c)
            xf = workbook.xf_list[xf_index]
            font = workbook.font_list[xf.font_index]
            
            cell_info = {
                "r": r,
                "c": c,
                "v": str(val),
                "bold": font.bold,
                "font": font.name,
                "size": font.height // 20, # Convert to points
                "align": xf.alignment.hor_align,
                "border": {
                    "top": xf.border.top_line_style,
                    "bottom": xf.border.bottom_line_style,
                    "left": xf.border.left_line_style,
                    "right": xf.border.right_line_style
                }
            }
            row_data.append(cell_info)
        data.append(row_data)
    
    # Column widths
    widths = []
    for c in range(sheet.ncols):
        try:
            # In older xlrd versions or specific configs, this works
            widths.append(sheet.col_width(c))
        except:
            widths.append(0)
            
    result = {
        "rows": data,
        "widths": widths,
        "nrows": sheet.nrows,
        "ncols": sheet.ncols
    }
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    audit_xls(sys.argv[1])
