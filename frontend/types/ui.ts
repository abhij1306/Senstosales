export interface InvoiceItemUI {
    lotNumber: string;
    description: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    rate: number;
    taxableValue: number;
    tax: {
        cgstRate: number;
        cgstAmount: number;
        sgstRate: number;
        sgstAmount: number;
        igstRate: number;
        igstAmount: number;
    };
    totalAmount: number;
}

export interface InvoiceFormData {
    invoice_number: string;
    invoice_date: string;
    dc_number: string;
    challan_date?: string;
    buyers_order_no?: string;
    buyers_order_date?: string;
    buyer_name: string;
    buyer_gstin?: string;
    buyer_state?: string;
    place_of_supply?: string;
    vehicle_no?: string;
    transporter?: string;
    lr_no?: string;
    destination?: string;
    terms_of_delivery?: string;
    gemc_number?: string;
    mode_of_payment?: string;
    payment_terms?: string;
    despatch_doc_no?: string;
    srv_no?: string;
    srv_date?: string;
    remarks?: string;
    taxable_value?: number;
    cgst?: number;
    sgst?: number;
    total_invoice_value?: number;
}
