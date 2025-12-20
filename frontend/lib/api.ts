// API client for backend communication
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
console.log('[API Client] API_BASE_URL:', API_BASE_URL);

// ============================================================
// TYPES
// ============================================================

import {
    POListItem,
    POStats,
    PODetail,
    DashboardSummary,
    DCListItem,
    DCStats,
    DCCreate,
    InvoiceListItem,
    InvoiceStats,
    POItem,
    PODelivery,
    PONote,
    PONoteCreate,
    ActivityItem,
    SearchResult,
    Alert,
    ReconciliationItem,
    DCWithoutInvoice,
    SupplierSummary,
    InvoiceCreate,
    DCDetail,
    InvoiceDetail,
    CreateResponse
} from '@/types';

// Re-exporting for backward compatibility if needed, but best to use direct imports
export type {
    POListItem, POStats, PODetail, DashboardSummary, DCListItem, DCStats, DCCreate, InvoiceListItem, InvoiceStats,
    POItem, PODelivery, PONote, PONoteCreate, ActivityItem, SearchResult, Alert, ReconciliationItem,
    DCWithoutInvoice, SupplierSummary, InvoiceCreate, DCDetail, InvoiceDetail, CreateResponse
};

// ============================================================
// API CLIENT
// ============================================================

// ... (apiFetch remains same, skipping lines for brevity if I could, but I must match exact target content or just replace functions)
// I will just replace the API FUNCTIONS section mostly.
// But I need to update imports first.
// I will do imports first then function signatures.

// Actually I can do it in two chunks or one large chunk if contiguous.
// Imports are at top. Functions at bottom.
// I'll use multi_replace.

// Chunk 1: Imports
// Chunk 2: API Functions


// ============================================================
// API CLIENT
// ============================================================

// ... rest of API client code ... 
// Wait, I need to keep the file structure valid.
// I can just remove the interface definitions and add the import.

// Search & Alerts Types
// Search & Alerts, PO Notes, Report Types are imported from @/types

// ============================================================
// CENTRALIZED API FETCH
// ============================================================

/**
 * Centralized API fetch function
 * - Uses NEXT_PUBLIC_API_URL from env
 * - Adds JSON headers
 * - Parses error responses and extracts detail field
 * - Logs failures centrally
 * - Throws typed errors
 */
async function apiFetch<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_BASE_URL}${path}`;

    const defaultOptions: RequestInit = {
        headers: {
            // Only set Content-Type to JSON if body is not FormData
            ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...options?.headers,
        },
        ...options,
    };

    try {
        console.log(`[API] ${options?.method || 'GET'} ${path}`);

        if (options?.body && !(options.body instanceof FormData)) {
            console.log(`[API] Request body:`, JSON.parse(options.body as string));
        }

        const response = await fetch(url, defaultOptions);

        if (!response.ok) {
            // Try to parse error detail from backend
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    if (Array.isArray(errorData.detail)) {
                        // Handle Pydantic validation errors (array of objects)
                        errorMessage = errorData.detail
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            .map((err: any) => `${err.loc.join('.')} - ${err.msg}`)
                            .join('\n');
                    } else if (typeof errorData.detail === 'object') {
                        // Extract message from structured error if available
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const detailObj = errorData.detail as any;
                        if (detailObj && detailObj.message) {
                            errorMessage = detailObj.message;
                        } else {
                            errorMessage = JSON.stringify(errorData.detail);
                        }
                    } else {
                        errorMessage = String(errorData.detail);
                    }
                }
            } catch {
                // If JSON parsing fails, use default message
            }

            console.error(`[API] Error: ${errorMessage}`, {
                endpoint: path,
                status: response.status,
                method: options?.method || 'GET'
            });

            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`[API] Success: ${path}`);
        return data as T;

    } catch (error) {
        if (error instanceof Error) {
            // Re-throw our formatted errors
            throw error;
        }

        // Network errors or other issues
        const networkError = new Error(`Network error: Failed to fetch ${path}`);
        console.error(`[API] Network error:`, {
            endpoint: path,
            error: error
        });
        throw networkError;
    }
}

// ============================================================
// API FUNCTIONS
// ============================================================

export const api = {
    // Search & Alerts
    async searchGlobal(query: string): Promise<SearchResult[]> {
        return apiFetch<SearchResult[]>(`/api/search/?q=${encodeURIComponent(query)}`);
    },

    async getAlerts(acknowledged = false): Promise<Alert[]> {
        return apiFetch<Alert[]>(`/api/alerts/?acknowledged=${acknowledged}`);
    },

    async acknowledgeAlert(alertId: string): Promise<{ success: boolean }> {
        return apiFetch<{ success: boolean }>(`/api/alerts/${alertId}/acknowledge`, { method: 'POST' });
    },

    // Reports
    async getReport(reportType: string): Promise<ReconciliationItem[] | DCWithoutInvoice[] | SupplierSummary[] | unknown> {
        return apiFetch<unknown>(`/api/reports/${reportType}`);
    },

    // PO Notes
    async getPONotes(): Promise<PONote[]> {
        return apiFetch<PONote[]>('/api/po-notes/');
    },

    async getPONote(id: number): Promise<PONote> {
        return apiFetch<PONote>(`/api/po-notes/${id}`);
    },

    async createPONote(data: PONoteCreate): Promise<PONote> {
        return apiFetch<PONote>('/api/po-notes/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updatePONote(id: string, data: PONoteCreate): Promise<PONote> {
        return apiFetch<PONote>(`/api/po-notes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deletePONote(id: string): Promise<{ success: boolean }> {
        return apiFetch<{ success: boolean }>(`/api/po-notes/${id}`, {
            method: 'DELETE',
        });
    },

    // Dashboard
    async getDashboardSummary(): Promise<DashboardSummary> {
        return apiFetch<DashboardSummary>('/api/dashboard/summary');
    },

    async getRecentActivity(limit = 10): Promise<ActivityItem[]> {
        return apiFetch<ActivityItem[]>(`/api/dashboard/activity?limit=${limit}`);
    },

    // Purchase Orders
    async getPOStats(): Promise<POStats> {
        return apiFetch<POStats>('/api/po/stats');
    },

    async listPOs(): Promise<POListItem[]> {
        return apiFetch<POListItem[]>('/api/po/');
    },

    async getPODetail(poNumber: number): Promise<PODetail> {
        return apiFetch<PODetail>(`/api/po/${poNumber}`);
    },

    async checkPOHasDC(poNumber: number): Promise<{ has_dc: boolean, dc_id?: string, dc_number?: string }> {
        return apiFetch<{ has_dc: boolean, dc_id?: string, dc_number?: string }>(`/api/po/${poNumber}/dc`);
    },

    async uploadPOHTML(file: File): Promise<{ success: boolean; warnings: string[]; po_number?: number }> {
        const formData = new FormData();
        formData.append('file', file);
        return apiFetch<{ success: boolean; warnings: string[]; po_number?: number }>('/api/po/upload', {
            method: 'POST',
            body: formData,
        });
    },

    async uploadPOBatch(files: FileList | File[]): Promise<{ success: boolean; results: any[] }> {
        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append('files', file);
        });

        return apiFetch<{ success: boolean; results: any[] }>('/api/po/upload/batch', {
            method: 'POST',
            body: formData,
        });
    },

    // Reconciliation
    async getReconciliation(poNumber: number): Promise<ReconciliationItem[]> {
        return apiFetch<ReconciliationItem[]>(`/api/reconciliation/po/${poNumber}`);
    },

    async getReconciliationLots(poNumber: number): Promise<unknown[]> {
        return apiFetch<unknown[]>(`/api/reconciliation/po/${poNumber}/lots`);
    },

    // Delivery Challans
    async getDCStats(): Promise<DCStats> {
        return apiFetch<DCStats>('/api/dc/stats');
    },

    async listDCs(poNumber?: number): Promise<DCListItem[]> {
        const url = poNumber
            ? `/api/dc/?po=${poNumber}`
            : '/api/dc/';
        return apiFetch<DCListItem[]>(url);
    },

    async getDCDetail(dcNumber: string): Promise<DCDetail> {
        return apiFetch<DCDetail>(`/api/dc/${dcNumber}`);
    },

    async createDC(dc: DCCreate, items: Record<string, unknown>[]): Promise<CreateResponse> {
        return apiFetch<CreateResponse>('/api/dc/', {
            method: 'POST',
            body: JSON.stringify({ dc, items }),
        });
    },

    async checkDCHasInvoice(dcNumber: string): Promise<{ has_invoice: boolean, invoice_number?: string }> {
        return apiFetch<{ has_invoice: boolean, invoice_number?: string }>(`/api/dc/${dcNumber}/invoice`);
    },

    async updateDC(dcNumber: string, dc: DCCreate, items: Record<string, unknown>[]): Promise<DCDetail> {
        return apiFetch<DCDetail>(`/api/dc/${dcNumber}`, {
            method: 'PUT',
            body: JSON.stringify({ dc, items }),
        });
    },

    // Invoices
    async getInvoiceStats(): Promise<InvoiceStats> {
        return apiFetch<InvoiceStats>('/api/invoice/stats');
    },

    async listInvoices(poNumber?: number, dcNumber?: string): Promise<InvoiceListItem[]> {
        let url = '/api/invoice/';
        if (poNumber) url += `?po=${poNumber}`;
        else if (dcNumber) url += `?dc=${dcNumber}`;
        return apiFetch<InvoiceListItem[]>(url);
    },

    async getInvoiceDetail(invoiceNumber: string): Promise<InvoiceDetail> {
        return apiFetch<InvoiceDetail>(`/api/invoice/${invoiceNumber}`);
    },

    async createInvoice(payload: unknown): Promise<CreateResponse> {
        return apiFetch<CreateResponse>('/api/invoice/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }
};
