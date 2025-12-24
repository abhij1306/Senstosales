// ============================================================
// CENTRALIZED API FETCH
// ============================================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface POListItem {
    po_number: number;
    po_date: string;
    vendor_name: string;
    project_name: string;
    items: any[];
    total_amount?: number;
    po_value?: number;
    total_ordered_quantity?: number;
    total_dispatched_quantity?: number;
    total_received_quantity?: number;
    total_rejected_quantity?: number;
    total_pending_quantity?: number;
    status: string;
    [key: string]: any;
}

export interface POStats {
    total_pos: number;
    total_value: number;
    pending_pos: number;
    completed_pos: number;
    open_orders_count: number;
    pending_approval_count: number;
    total_value_ytd: number;
    total_value_change: number;
}

type FetchOptions = RequestInit & {
    retries?: number;
    timeout?: number;
};

class APIError extends Error {
    constructor(public status: number, public message: string, public data?: any) {
        super(message);
        this.name = "APIError";
    }
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { retries = 0, timeout = 60000, ...fetchOptions } = options; // Increased default to 60s
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...fetchOptions.headers as Record<string, string>,
    };

    if (!(fetchOptions.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    // Add Auth Token if exists
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            (headers as any)['Authorization'] = `Bearer ${token}`;
        }
    }

    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        console.debug(`[API] Fetching ${url} ...`);
        const response = await fetch(url, {
            ...fetchOptions,
            headers,
            signal: controller.signal,
        });
        clearTimeout(id);

        if (!response.ok) {
            // Handle 401 Unauthorized globally
            if (response.status === 401) {
                if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
                    console.warn("[API] 401 Unauthorized - Redirecting to login");
                    localStorage.removeItem('token');
                    window.location.href = '/auth/login';
                }
                throw new APIError(401, "Unauthorized");
            }

            // Parse error response
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = { detail: response.statusText };
            }

            const errorMessage = errorData.detail || errorData.message || `Request failed with status ${response.status}`;
            throw new APIError(response.status, errorMessage, errorData);
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return await response.json();

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error(`[API] Timeout for ${url}`);
            throw new APIError(408, `Request timed out after ${timeout}ms`);
        }

        if (retries > 0) {
            console.warn(`[API] Retrying ${url} (${retries} attempts left)...`);
            await new Promise(res => setTimeout(res, 1000));
            return apiFetch<T>(endpoint, { ...options, retries: retries - 1 });
        }

        console.error(`[API] Error fetching ${url}:`, error);

        // Dispatch global event for UI to verify
        if (typeof window !== 'undefined' && options.method && options.method !== 'GET') {
            window.dispatchEvent(new CustomEvent('api-error', {
                detail: {
                    title: "Operation Failed",
                    message: error.message || "Unknown error occurred",
                    type: 'error'
                }
            }));
        }

        throw error;
    }
}

// ============================================================
// STABLE API CLIENT
// ============================================================

export const api = {
    // DASHBOARD
    getDashboardSummary: () => apiFetch<any>('/api/dashboard/summary'),
    getDashboardInsights: () => apiFetch<any[]>('/api/dashboard/insights'),
    getRecentActivity: (limit = 10) => apiFetch<any[]>(`/api/dashboard/activity?limit=${limit}`),

    // PURCHASE ORDERS
    listPOs: () => apiFetch<POListItem[]>('/api/po/'),
    getPOStats: () => apiFetch<POStats>('/api/po/stats'),
    getPO: (poNumber: string | number) => apiFetch<any>(`/api/po/${poNumber}`), // Alias for internal use
    getPODetail: (poNumber: string | number) => apiFetch<any>(`/api/po/${poNumber}`), // Explicitly called by UI
    checkPOHasDC: (poNumber: string | number) => apiFetch<any>(`/api/po/${poNumber}/dc`),
    syncPO: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiFetch<any>('/api/po/upload', {
            method: 'POST',
            body: formData,
            headers: {},
        });
    },
    uploadPOBatch: (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return apiFetch<any>('/api/po/upload/batch', {
            method: 'POST',
            body: formData,
            headers: {},
            timeout: 600000, // 10 minutes for large batch uploads
        });
    },

    // DELIVERY CHALLANS
    listDCs: () => apiFetch<any[]>('/api/dc/'),
    getDCStats: () => apiFetch<any>('/api/dc/stats'),
    createDC: (data: any, items: any[]) => apiFetch('/api/dc/', { method: 'POST', body: JSON.stringify({ ...data, items }) }),
    updateDC: (dcNumber: string, data: any, items: any[]) => apiFetch(`/api/dc/${dcNumber}`, { method: 'PUT', body: JSON.stringify({ ...data, items }) }),
    getDC: (dcNumber: string) => apiFetch<any>(`/api/dc/${dcNumber}`),
    getDCDetail: (dcNumber: string | null) => apiFetch<any>(`/api/dc/${dcNumber}`), // Alias for UI
    checkDCHasInvoice: (dcNumber: string | null) => apiFetch<any>(`/api/dc/${dcNumber}/invoice`),

    // INVOICES
    listInvoices: () => apiFetch<any[]>('/api/invoice/'),
    getInvoiceStats: () => apiFetch<any>('/api/invoice/stats'),
    createInvoice: (data: any) => apiFetch('/api/invoice/', { method: 'POST', body: JSON.stringify(data) }),
    getInvoiceDetail: (invoiceNumber: string) => apiFetch<any>(`/api/invoice/${invoiceNumber}`),

    // SRVS
    listSRVs: (poId?: number) => apiFetch<any[]>(poId ? `/api/srv/po/${poId}/srvs` : '/api/srv/'),
    getSRVStats: () => apiFetch<any>('/api/srv/stats'),
    uploadSRVBatch: (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return apiFetch<any>('/api/srv/upload/batch', {
            method: 'POST',
            body: formData,
            headers: {},
            timeout: 600000, // 10 minutes for large batch uploads
        });
    },

    // PO NOTES
    // PO NOTES TEMPLATES
    getPONotes: () => apiFetch<any[]>('/api/po-notes/'),
    getPONote: (id: string) => apiFetch<any>(`/api/po-notes/${id}`),
    createPONote: (data: any) => apiFetch('/api/po-notes/', { method: 'POST', body: JSON.stringify(data) }),
    updatePONote: (id: string, data: any) => apiFetch(`/api/po-notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePONote: (id: string) => apiFetch(`/api/po-notes/${id}`, { method: 'DELETE' }),

    // Legacy/Specific PO Note Lists (if needed, otherwise can be deprecated)
    listPONotes: (poId: string) => apiFetch<any[]>(`/api/po-notes/${poId}`), // Warning: Backend treats {id} as template_id fetch, so this might need adjustment if used for PO-specific notes.

    // REPORTS (RECONCILIATION)
    getReconciliation: (poNumber: number) => apiFetch<any[]>(`/api/reports/reconciliation/${poNumber}`),
    getReconciliationLots: (poNumber: number) => apiFetch<any>(`/api/reports/reconciliation/${poNumber}/lots`),

    // REPORTS
    getReport: (type: string, dateParams: string) => apiFetch<any[]>(`/api/reports/${type}?${dateParams}`),
    exportReport: (type: string, id: string) => {
        window.open(`${API_BASE_URL}/api/reports/export/${type}/${id}`, '_blank');
    }
};
