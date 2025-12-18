"""
Centralized SQL queries for the application.
"""

# Delivery Challan Queries
DC_LIST = """
SELECT 
    dc.dc_number,
    dc.dc_date,
    dc.po_number,
    po.supplier_name,
    dc.vehicle_no,
    COUNT(dci.id) as item_count
FROM delivery_challans dc
LEFT JOIN purchase_orders po ON dc.po_number = po.po_number
LEFT JOIN delivery_challan_items dci ON dc.dc_number = dci.dc_number
GROUP BY dc.dc_number
ORDER BY dc.dc_date DESC
"""

DC_DETAIL = """
SELECT 
    dc.*,
    po.supplier_name,
    po.po_date
FROM delivery_challans dc
LEFT JOIN purchase_orders po ON dc.po_number = po.po_number
WHERE dc.dc_number = ?
"""

DC_ITEMS = """
SELECT 
    dci.*,
    poi.material_code,
    poi.material_description,
    poi.unit,
    poi.po_item_no,
    poi.po_rate,
    (dci.dispatch_qty * poi.po_rate) as item_value
FROM delivery_challan_items dci
JOIN purchase_order_items poi ON dci.po_item_id = poi.id
WHERE dci.dc_number = ?
ORDER BY poi.po_item_no
"""
