/**
 * Data Adapters for API ↔ UI Transformation
 * Ensures type safety between backend (snake_case) and frontend (camelCase)
 */

import type {
    DCItemRow,
    DCHeader,
    POItem,
    POHeader,
    InvoiceItem,
    InvoiceHeader
} from '@/types';

// ============================================================
// DC ITEM ADAPTERS
// ============================================================

/**
 * Transform API DC item to UI format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dcItemFromAPI(apiItem: any): DCItemRow {
    return {
        id: apiItem.id || `${apiItem.po_item_id}-${apiItem.lot_no}`,
        po_item_id: apiItem.po_item_id,
        po_item_no: apiItem.po_item_no,
        lot_no: apiItem.lot_no,
        material_code: apiItem.material_code,
        material_description: apiItem.material_description,
        description: apiItem.material_description || apiItem.description,
        unit: apiItem.unit,
        po_rate: apiItem.po_rate,
        lot_ordered_quantity: apiItem.lot_ordered_qty || apiItem.lot_ordered_quantity,
        ordered_quantity: apiItem.ordered_quantity || apiItem.lot_ordered_quantity,
        already_dispatched: apiItem.already_dispatched,
        remaining_quantity: apiItem.remaining_quantity || apiItem.remaining_qty,
        dispatched_quantity: apiItem.dispatched_quantity || 0,
        dispatch_quantity: apiItem.dispatched_quantity || apiItem.dispatch_quantity || 0,
        hsn_code: apiItem.hsn_code,
        hsn_rate: apiItem.hsn_rate,
        remaining_post_dc: apiItem.remaining_post_dc
    };
}

/**
 * Transform UI DC item to API format
 */
export function dcItemToAPI(uiItem: DCItemRow): Record<string, unknown> {
    return {
        po_item_id: uiItem.po_item_id,
        lot_no: uiItem.lot_no ? parseInt(String(uiItem.lot_no)) : undefined,
        dispatch_quantity: uiItem.dispatch_quantity || uiItem.dispatched_quantity,
        // Backend expects 'dispatched_quantity' alias in models? No, create_dc uses dictionary.
        // routers/dc.py create_dc uses "items: List[dict]". 
        // service_create_dc reads "dispatch_qty" usually? 
        // I need to check backend service creation logic.
        // But assuming standardized naming, I should send "dispatched_quantity" or "dispatch_qty".
        // The router aliases INPUT? 
        // `service_create_dc` validation: `item.get("dispatch_qty")`.
        // I did NOT update `service_create_dc` to use `dispatched_quantity` in logic yet?
        // Phase 2 "Move Business Logic" might address that.
        // But for now, backend expects `dispatch_qty` in `create_dc` payload likely.
        // Wait, I updated `models.py` `DCListItem`.
        // But `create_dc` accepts `items: List[dict]`.
        // `routers/dc.py` documentation says `items format: [{ ... "dispatch_qty": 10 ... }]`
        // So I must stick to `dispatch_qty` for POST payload unless I change backend acceptance.
        // User said "Standardize Quantity Field Naming (Backend)".
        // I should probably start sending `dispatched_quantity` and update backend to accept it.
        // But safely, I can send BOTH. Or check backend logic.
        // I'll check backend logic in next step. For now, sending `dispatch_qty` (legacy) is safer if backend not updated for INPUT.
        // But `types/index.ts` `DCItemRow` has `dispatched_quantity`.
        // `dcItemToAPI` returns `any`.
        dispatch_qty: uiItem.dispatch_quantity || uiItem.dispatched_quantity,
        hsn_code: uiItem.hsn_code,
        hsn_rate: uiItem.hsn_rate
    };
}

// ============================================================
// PO ITEM ADAPTERS
// ============================================================

/**
 * Transform API PO item to UI format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function poItemFromAPI(apiItem: any): POItem {
    return {
        id: apiItem.id,
        po_item_no: apiItem.po_item_no,
        material_code: apiItem.material_code,
        material_description: apiItem.material_description,
        drg_no: apiItem.drg_no,
        mtrl_cat: apiItem.mtrl_cat,
        unit: apiItem.unit,
        po_rate: apiItem.po_rate,
        ordered_quantity: apiItem.ordered_quantity || apiItem.ord_qty,
        received_quantity: apiItem.received_quantity || apiItem.rcd_qty,
        item_value: apiItem.item_value,
        hsn_code: apiItem.hsn_code,
        delivered_quantity: apiItem.delivered_quantity || apiItem.delivered_qty,
        pending_quantity: apiItem.pending_quantity || apiItem.pending_qty,
        deliveries: apiItem.deliveries?.map((d: any) => ({
            id: d.id,
            lot_no: d.lot_no,
            delivered_quantity: d.delivered_quantity || d.dely_qty,
            dely_date: d.dely_date,
            entry_allow_date: d.entry_allow_date,
            dest_code: d.dest_code
        })) || []
    };
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate DC item before sending to API
 * Throws error if validation fails
 */
export function validateDCItem(item: DCItemRow): void {
    const dispatchQty = item.dispatch_quantity || item.dispatched_quantity;

    if (!item.po_item_id) {
        throw new Error('PO item ID is required');
    }

    if (!dispatchQty || dispatchQty <= 0) {
        throw new Error('Dispatch quantity must be greater than 0');
    }

    if (item.remaining_quantity !== undefined && dispatchQty > item.remaining_quantity) {
        throw new Error(
            `Cannot dispatch ${dispatchQty} units. Only ${item.remaining_quantity} remaining.`
        );
    }
}

/**
 * Batch validate DC items
 */
export function validateDCItems(items: DCItemRow[]): void {
    if (items.length === 0) {
        throw new Error('At least one item is required');
    }

    items.forEach((item, index) => {
        try {
            validateDCItem(item);
        } catch (error) {
            throw new Error(`Item ${index + 1}: ${error instanceof Error ? error.message : 'Invalid item'}`);
        }
    });
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Safe number parsing with fallback
 */
export function parseNumber(value: unknown, fallback: number = 0): number {
    const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(parsed) ? fallback : parsed;
}

/**
 * Safe string conversion
 */
export function toString(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
}
