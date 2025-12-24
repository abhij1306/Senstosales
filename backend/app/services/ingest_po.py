"""
PO Ingestion Service - Writes scraper output to database
Normalizes data into items and deliveries tables
"""
import uuid
import sqlite3
from typing import Dict, List, Tuple
from app.utils.date_utils import normalize_date
from app.utils.number_utils import to_int, to_float

class POIngestionService:
    """Handles PO data ingestion from scraper to database"""
    
    def ingest_po(self, db: sqlite3.Connection, po_header: Dict, po_items: List[Dict]) -> Tuple[bool, List[str]]:
        """
        Ingest PO from scraper output
        Normalizes data: unique items + delivery schedules
        
        Args:
            db: Active database connection (must be in a transaction if needed)
            po_header: Dictionary containing PO header details
            po_items: List of dictionaries containing PO item details
            
        Returns: (success, warnings)
        
        Note: This service assumes an active connection. It must never create or manage DB connections.
        """
        warnings = []
        
        try:
            # Extract PO number
            po_number = to_int(po_header.get('PURCHASE ORDER'))
            if not po_number:
                raise ValueError("PO number is required")
            
            # Check if PO exists
            # Security Note: Using DB transaction from caller guarantees consistency
            existing = db.execute(
                "SELECT po_number, amend_no FROM purchase_orders WHERE po_number = ?",
                (po_number,)
            ).fetchone()
            
            if existing:
                warnings.append(f"⚠️ PO {po_number} already exists (Amendment {existing['amend_no']}). Updating...")
            
            # Prepare header data
            header_data = {
                'po_number': po_number,
                'po_date': normalize_date(po_header.get('PO DATE')),
                'supplier_name': po_header.get('SUPP NAME M/S'),
                'supplier_gstin': None,  # Internal data, not in PO
                'supplier_code': po_header.get('SUPP CODE'),
                'supplier_phone': po_header.get('PHONE'),
                'supplier_fax': po_header.get('FAX'),
                'supplier_email': po_header.get('EMAIL') or po_header.get('WEBSITE'), # Fallback
                'department_no': to_int(po_header.get('DVN')),
                
                # Ref
                'enquiry_no': po_header.get('ENQUIRY'),
                'enquiry_date': normalize_date(po_header.get('ENQ DATE')),
                'quotation_ref': po_header.get('QUOTATION'),
                'quotation_date': normalize_date(po_header.get('QUOT-DATE')),
                'rc_no': po_header.get('RC NO'),
                'order_type': po_header.get('ORD-TYPE'),
                'po_status': po_header.get('PO STATUS'),
                
                # Fin
                'tin_no': po_header.get('TIN NO'),
                'ecc_no': po_header.get('ECC NO'),
                'mpct_no': po_header.get('MPCT NO'),
                'po_value': to_float(po_header.get('PO-VALUE')),
                'fob_value': to_float(po_header.get('FOB VALUE')),
                'ex_rate': to_float(po_header.get('EX RATE')),
                'currency': po_header.get('CURRENCY'),
                'net_po_value': to_float(po_header.get('NET PO VAL')),
                
                # Amend
                'amend_no': to_int(po_header.get('AMEND NO')) or 0,
                'amend_1_date': None,  # Not in PO
                'amend_2_date': None,  # Not in PO
                
                # Insp & Issuer
                'inspection_by': po_header.get('INSPECTION BY'),
                'inspection_at': po_header.get('INSPECTION AT BHEL'),
                'issuer_name': po_header.get('NAME'),
                'issuer_designation': po_header.get('DESIGNATION'),
                'issuer_phone': po_header.get('PHONE NO'),
                
                'remarks': po_header.get('REMARKS')
            }
            
            # Upsert PO header
            db.execute("""
                INSERT INTO purchase_orders 
                (po_number, po_date, supplier_name, supplier_gstin, supplier_code, supplier_phone, supplier_fax, supplier_email, department_no,
                 enquiry_no, enquiry_date, quotation_ref, quotation_date, rc_no, order_type, po_status,
                 tin_no, ecc_no, mpct_no, po_value, fob_value, ex_rate, currency, net_po_value,
                 amend_no, amend_1_date, amend_2_date,
                 inspection_by, inspection_at, issuer_name, issuer_designation, issuer_phone, remarks)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(po_number) DO UPDATE SET
                    po_date=excluded.po_date, supplier_name=excluded.supplier_name, supplier_gstin=excluded.supplier_gstin,
                    supplier_code=excluded.supplier_code, supplier_phone=excluded.supplier_phone, supplier_fax=excluded.supplier_fax,
                    department_no=excluded.department_no, enquiry_no=excluded.enquiry_no, enquiry_date=excluded.enquiry_date,
                    quotation_ref=excluded.quotation_ref, quotation_date=excluded.quotation_date, rc_no=excluded.rc_no,
                    order_type=excluded.order_type, po_status=excluded.po_status, tin_no=excluded.tin_no, ecc_no=excluded.ecc_no,
                    mpct_no=excluded.mpct_no, po_value=excluded.po_value, fob_value=excluded.fob_value, ex_rate=excluded.ex_rate,
                    currency=excluded.currency, net_po_value=excluded.net_po_value, amend_no=excluded.amend_no,
                    amend_1_date=excluded.amend_1_date, amend_2_date=excluded.amend_2_date, inspection_by=excluded.inspection_by,
                    inspection_at=excluded.inspection_at, issuer_name=excluded.issuer_name, issuer_designation=excluded.issuer_designation,
                    issuer_phone=excluded.issuer_phone, remarks=excluded.remarks, updated_at=CURRENT_TIMESTAMP
            """, tuple(header_data.values()))

            
            # Group items by PO_ITM to eliminate repetition
            items_grouped = {}
            for item in po_items:
                po_item_no = to_int(item.get('PO ITM'))
                
                if po_item_no not in items_grouped:
                    items_grouped[po_item_no] = {
                        'item': item,
                        'deliveries': []
                    }
                
                items_grouped[po_item_no]['deliveries'].append(item)
            
            # Insert or Update unique items and their deliveries
            for po_item_no, data in items_grouped.items():
                item = data['item']
                
                # Check if item already exists to preserve its ID
                existing_item = db.execute(
                    "SELECT id FROM purchase_order_items WHERE po_number = ? AND po_item_no = ?",
                    (po_number, po_item_no)
                ).fetchone()
                
                item_id = existing_item['id'] if existing_item else str(uuid.uuid4())
                
                # Standardized variable names
                ordered_quantity = to_float(item.get('ORD QTY')) or 0
                item_value = to_float(item.get('ITEM VALUE')) or 0
                received_quantity = to_float(item.get('RCD QTY')) or 0
                description = item.get('DESCRIPTION') or ""
                drg_no = item.get('DRG') or ""
                
                # Upsert item
                db.execute("""
                    INSERT INTO purchase_order_items
                    (id, po_number, po_item_no, material_code, material_description, drg_no, mtrl_cat,
                     unit, po_rate, ord_qty, rcd_qty, item_value, hsn_code, delivered_qty, pending_qty)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
                    ON CONFLICT(po_number, po_item_no) DO UPDATE SET
                        material_code=excluded.material_code, material_description=excluded.material_description,
                        drg_no=excluded.drg_no, mtrl_cat=excluded.mtrl_cat, unit=excluded.unit,
                        po_rate=excluded.po_rate, ord_qty=excluded.ord_qty,
                        item_value=excluded.item_value, updated_at=CURRENT_TIMESTAMP
                """, (
                    item_id,
                    po_number,
                    po_item_no,
                    item.get('MATERIAL CODE'),
                    description,
                    drg_no,
                    to_int(item.get('MTRL CAT')),
                    item.get('UNIT'),
                    to_float(item.get('PO RATE')),
                    ordered_quantity,
                    received_quantity,
                    item_value,
                    None,  # HSN not in scraper
                    ordered_quantity  # pending_qty = ordered_quantity initially
                ))
                
                # Clear existing deliveries for this item and re-insert
                # Deliveries do not have FKs pointing TO them, so this is safe and preserves data integrity
                db.execute("DELETE FROM purchase_order_deliveries WHERE po_item_id = ?", (item_id,))
                
                # Insert deliveries
                for delivery in data['deliveries']:
                    delivery_id = str(uuid.uuid4())
                    delivered_quantity = to_float(delivery.get('DELY QTY'))
                    
                    db.execute("""
                        INSERT INTO purchase_order_deliveries
                        (id, po_item_id, lot_no, dely_qty, dely_date, entry_allow_date, dest_code)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        delivery_id,
                        item_id,
                        to_int(delivery.get('LOT NO')),
                        delivered_quantity,
                        normalize_date(delivery.get('DELY DATE')),
                        normalize_date(delivery.get('ENTRY ALLOW DATE')),
                        to_int(delivery.get('DEST CODE'))
                    ))
            
            # Remove commit/rollback, controlled by caller
            warnings.insert(0, f"✅ Successfully ingested PO {po_number} with {len(items_grouped)} unique items and {len(po_items)} delivery schedules")
            
            # --- Retroactive Linkage: Check for Orphan SRVs ---
            # If SRVs were uploaded BEFORE the PO, they will have po_found=0.
            # We need to find them, link them, and update the PO item quantities.
            
            # 1. Activate Linkage
            cursor = db.execute(
                "UPDATE srvs SET po_found = 1 WHERE po_number = ? AND po_found = 0",
                (str(po_number),) # Ensure string format for consistency
            )
            linked_count = cursor.rowcount
            
            if linked_count > 0:
                warnings.append(f"🔗 Linked {linked_count} existing SRV(s) to this new PO")
                
                # 2. Recalculate Quantities for this PO's items
                for po_item_no in items_grouped.keys():
                    srv_totals = db.execute("""
                        SELECT 
                            COALESCE(SUM(si.received_qty), 0) as total_received,
                            COALESCE(SUM(si.rejected_qty), 0) as total_rejected
                        FROM srv_items si
                        JOIN srvs s ON si.srv_number = s.srv_number
                        WHERE s.po_number = ? AND si.po_item_no = ? AND s.is_active = 1
                    """, (str(po_number), po_item_no)).fetchone()
                    
                    if srv_totals and (srv_totals[0] > 0 or srv_totals[1] > 0):
                        db.execute("""
                            UPDATE purchase_order_items
                            SET 
                                rcd_qty = ?,
                                rejected_qty = ?,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE po_number = ? AND po_item_no = ?
                        """, (
                            float(srv_totals[0]),
                            float(srv_totals[1]),
                            po_number,
                            po_item_no
                        ))
                warnings.append("📊 Updated PO item quantities from linked SRVs")

            return True, warnings
            
        except Exception as e:
            # Let caller handle rollback
            raise ValueError(f"Error ingesting PO: {str(e)}")

# Singleton instance
po_ingestion_service = POIngestionService()
