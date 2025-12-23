"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, FileText, Loader2, Lock, Package, Check, AlertCircle, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { InvoiceFormData, InvoiceItemUI } from "@/types/ui";
import { createDefaultInvoiceForm } from "@/lib/uiAdapters";
import type { ChangeEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// ============================================================================
// CONSTANTS & UTILS
// ============================================================================

const TAX_RATES = { cgst: 9.0, sgst: 9.0 };

function numberToWords(num: number): string {
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    function convertLessThanThousand(n: number): string {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanThousand(n % 100) : '');
    }

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    let result = '';
    if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return result.trim();
}

function amountInWords(amount: number): string {
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    let words = 'Rupees ' + numberToWords(rupees);
    if (paise > 0) words += ' and Paise ' + numberToWords(paise);
    words += ' Only';
    return words;
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface InputProps {
    label: string;
    value: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
    readOnly?: boolean;
}

const Input = ({ label, value, onChange, type = "text", placeholder = "", required = false, readOnly = false }: InputProps) => (
    <div className="space-y-1.5">
        <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
            {label} {required && <span className="text-danger">*</span>}
        </label>
        <div className="relative">
            <input
                type={type}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                placeholder={placeholder}
                className={`w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-text-primary transition-colors ${readOnly ? 'bg-gray-50 text-text-muted cursor-not-allowed' : 'bg-white'
                    }`}
            />
            {readOnly && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted opacity-50" />}
        </div>
    </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function CreateInvoicePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dcId = searchParams?.get('dc') || '';

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItemUI[]>([]);

    // Manual DC input state if not provided in URL
    const [manualDcId, setManualDcId] = useState(dcId);

    const [formData, setFormData] = useState<InvoiceFormData>(
        createDefaultInvoiceForm(dcId || undefined)
    );

    // Initial Load
    useEffect(() => {
        if (dcId) {
            loadDC(dcId);
        }
    }, [dcId]);

    const loadDC = async (id: string) => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const data = await api.getDCDetail(id);
            if (!data || !data.header) {
                setError("Failed to load DC details. Check ID and try again.");
                setLoading(false);
                return;
            }

            setFormData(prev => ({
                ...prev,
                dc_number: data.header.dc_number || '',
                challan_date: data.header.dc_date || '',
                buyers_order_no: data.header.po_number?.toString() || '',
                buyers_order_date: data.header.po_date || ''
            }));

            if (data.items && data.items.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const items: InvoiceItemUI[] = data.items.map((item: any) => {
                    // Backend returns 'dispatched_quantity' (from alias) or 'dispatch_qty'
                    const qty = item.dispatched_quantity || item.dispatch_qty || item.dispatch_quantity || 0;
                    const rate = item.po_rate || 0;
                    const taxableValue = qty * rate;
                    const cgstAmount = (taxableValue * TAX_RATES.cgst) / 100;
                    const sgstAmount = (taxableValue * TAX_RATES.sgst) / 100;
                    const total = taxableValue + cgstAmount + sgstAmount;

                    return {
                        lotNumber: item.lot_no?.toString() || '',
                        description: item.description || item.material_description || '',
                        hsnCode: item.hsn_code || '',
                        quantity: qty,
                        unit: 'NO',
                        rate: rate,
                        taxableValue,
                        tax: {
                            cgstRate: TAX_RATES.cgst,
                            cgstAmount,
                            sgstRate: TAX_RATES.sgst,
                            sgstAmount,
                            igstRate: 0,
                            igstAmount: 0
                        },
                        totalAmount: total
                    };
                });

                setInvoiceItems(items);
                calculateTotals(items);
            }
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch DC:", err);
            setError(err instanceof Error ? err.message : "Failed to load DC");
            setLoading(false);
        }
    };

    const calculateTotals = (items: InvoiceItemUI[]) => {
        const totals = items.reduce((acc, item) => ({
            taxable: acc.taxable + item.taxableValue,
            cgst: acc.cgst + item.tax.cgstAmount,
            sgst: acc.sgst + item.tax.sgstAmount,
            total: acc.total + item.totalAmount
        }), { taxable: 0, cgst: 0, sgst: 0, total: 0 });

        setFormData(prev => ({
            ...prev,
            taxable_value: totals.taxable,
            cgst: totals.cgst,
            sgst: totals.sgst,
            total_invoice_value: totals.total
        }));
    };

    const handleItemChange = (index: number, field: 'quantity' | 'rate', value: number) => {
        const newItems = [...invoiceItems];
        const item = newItems[index];

        if (field === 'quantity') item.quantity = value;
        if (field === 'rate') item.rate = value;

        // Recalculate This Item
        item.taxableValue = item.quantity * item.rate;
        item.tax.cgstAmount = (item.taxableValue * item.tax.cgstRate) / 100;
        item.tax.sgstAmount = (item.taxableValue * item.tax.sgstRate) / 100;
        item.totalAmount = item.taxableValue + item.tax.cgstAmount + item.tax.sgstAmount;

        setInvoiceItems(newItems);
        calculateTotals(newItems);
    };

    const handleSubmit = async () => {
        if (saving) return;

        if (!formData.invoice_number || !formData.invoice_number.trim()) {
            setError("Invoice Number is required");
            return;
        }

        setError(null);
        setSaving(true);

        try {
            const payload = {
                invoice_number: formData.invoice_number,
                invoice_date: formData.invoice_date, dc_number: formData.dc_number, // Fixed key name mismatch
                buyer_name: formData.buyer_name, buyer_gstin: formData.buyer_gstin,
                buyer_state: formData.buyer_state, place_of_supply: formData.place_of_supply,
                buyers_order_no: formData.buyers_order_no, buyers_order_date: formData.buyers_order_date,
                vehicle_no: formData.vehicle_no, lr_no: formData.lr_no,
                transporter: formData.transporter, destination: formData.destination,
                terms_of_delivery: formData.terms_of_delivery, gemc_number: formData.gemc_number,
                mode_of_payment: formData.mode_of_payment, payment_terms: formData.payment_terms,
                despatch_doc_no: formData.despatch_doc_no, srv_no: formData.srv_no,
                srv_date: formData.srv_date,
                remarks: formData.remarks,

                // Include Edited Items
                items: invoiceItems.map(item => ({
                    po_sl_no: item.lotNumber,
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit,
                    rate: item.rate,
                    hsn_sac: item.hsnCode,
                    no_of_packets: 0
                }))
            };

            const response = await api.createInvoice(payload);
            if (response.invoice_number) {
                router.push(`/invoice/view?id=${response.invoice_number}`);
            } else {
                router.push('/invoice');
            }
        } catch (err) {
            console.error("Failed to create invoice:", err);
            setError(err instanceof Error ? err.message : "Failed to create invoice");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary transition-colors p-1">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-text-primary flex items-center gap-3 tracking-tight">
                            Generate Tax Invoice
                        </h1>
                        <p className="text-sm text-text-muted mt-0.5">
                            Create final GST invoice against Delivery Challan
                        </p>
                    </div>
                </div>

                {/* Link DC Actions */}
                <div className="flex gap-3 items-center">
                    {!dcId && (
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
                                <input
                                    type="text"
                                    value={manualDcId}
                                    onChange={(e) => setManualDcId(e.target.value)}
                                    className="w-48 pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-muted/50"
                                    placeholder="Enter DC No."
                                    disabled={loading}
                                />
                            </div>
                            <button
                                onClick={() => loadDC(manualDcId || '')}
                                disabled={loading || !manualDcId}
                                className="px-3 py-2 bg-surface-2 text-text-primary border border-border rounded-lg hover:bg-surface-3 text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Fetching...' : 'Link DC'}
                            </button>
                        </div>
                    )}
                    <div className="h-6 w-px bg-border mx-2" />
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 text-sm font-medium text-text-secondary bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || invoiceItems.length === 0}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Monthly
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" /> Finalize Invoice
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3 text-danger">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <p className="text-text-secondary font-medium">Fetching Challan Details...</p>
                </div>
            )}

            {/* Empty State: Link Manual DC */}
            {!dcId && invoiceItems.length === 0 && !loading && !manualDcId && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-surface-1/50">
                    <FileText className="w-12 h-12 text-text-muted/50 mb-4" />
                    <h3 className="text-lg font-medium text-text-primary">No Delivery Challan Linked</h3>
                    <p className="text-text-muted mb-6">Enter a DC Number above to generate an invoice.</p>
                </div>
            )}

            {/* Empty State warning: DC Linked but no items */}
            {dcId && invoiceItems.length === 0 && !loading && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 flex flex-col items-center text-center">
                    <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
                    <h3 className="text-lg font-semibold text-amber-900">No Items Found</h3>
                    <p className="text-amber-700 mt-1 max-w-md">
                        We found the Delivery Challan <strong>{dcId}</strong>, but it appears to have no items or they could not be loaded.
                    </p>
                    <button
                        onClick={() => loadDC(dcId)}
                        className="mt-4 px-4 py-2 bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 transition-colors font-medium text-sm"
                    >
                        Try Reloading
                    </button>
                </div>
            )}

            {invoiceItems.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                    {/* Invoice Details */}
                    <Card title="Invoice & Despatch Details" padding="md">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Input label="Invoice Number" value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} required placeholder="e.g., INV/2024-25/001" />
                            <Input label="Invoice Date" type="date" value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} required />
                            <Input label="GEMC / E-way Bill" value={formData.gemc_number || ''} onChange={(e) => setFormData({ ...formData, gemc_number: e.target.value })} placeholder="Optional" />
                            <Input label="Linked Challan" value={formData.dc_number} readOnly />

                            <div className="my-2 md:col-span-4 h-px bg-border/50" />

                            <Input label="Challan Date" value={formData.challan_date || ''} readOnly />
                            <Input label="Buyer's Order No" value={formData.buyers_order_no || ''} readOnly />
                            <Input label="Buyer's Order Date" value={formData.buyers_order_date || ''} readOnly />
                            <Input label="Despatch Doc No" value={formData.despatch_doc_no || ''} onChange={(e) => setFormData({ ...formData, despatch_doc_no: e.target.value })} />

                            <Input label="SRV No" value={formData.srv_no || ''} onChange={(e) => setFormData({ ...formData, srv_no: e.target.value })} />
                            <Input label="SRV Date" type="date" value={formData.srv_date || ''} onChange={(e) => setFormData({ ...formData, srv_date: e.target.value })} />
                            <div className="md:col-span-2">
                                <Input label="Buyer Name" value={formData.buyer_name} onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })} required />
                            </div>

                            <Input label="Buyer GSTIN" value={formData.buyer_gstin || ''} onChange={(e) => setFormData({ ...formData, buyer_gstin: e.target.value })} />
                            <Input label="State" value={formData.buyer_state || ''} onChange={(e) => setFormData({ ...formData, buyer_state: e.target.value })} />
                            <Input label="Place of Supply" value={formData.place_of_supply || ''} onChange={(e) => setFormData({ ...formData, place_of_supply: e.target.value })} />
                        </div>
                    </Card>

                    {/* Transport Details */}
                    <Card title="Transport & Payment" padding="md">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Input label="Vehicle Number" value={formData.vehicle_no || ''} onChange={(e) => setFormData({ ...formData, vehicle_no: e.target.value })} placeholder="e.g., MP04-AA-1234" />
                            <Input label="LR Number" value={formData.lr_no || ''} onChange={(e) => setFormData({ ...formData, lr_no: e.target.value })} />
                            <Input label="Transporter" value={formData.transporter || ''} onChange={(e) => setFormData({ ...formData, transporter: e.target.value })} />
                            <Input label="Destination" value={formData.destination || ''} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} />

                            <Input label="Terms of Delivery" value={formData.terms_of_delivery || ''} onChange={(e) => setFormData({ ...formData, terms_of_delivery: e.target.value })} />
                            <Input label="Mode of Payment" value={formData.mode_of_payment || ''} onChange={(e) => setFormData({ ...formData, mode_of_payment: e.target.value })} />
                            <Input label="Payment Terms" value={formData.payment_terms || ''} onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })} />
                        </div>
                    </Card>

                    {/* Items Table */}
                    <Card padding="none" className="overflow-hidden">
                        <div className="p-4 border-b border-border bg-gray-50/40 flex justify-between items-center">
                            <h3 className="text-[14px] font-semibold text-text-primary flex items-center gap-2">
                                <Package className="w-4 h-4 text-primary" /> Invoice Items
                            </h3>
                            {/* <Badge variant="outline">Locked</Badge> removed per user request */}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface-2 text-text-secondary font-semibold text-[11px] uppercase tracking-wider border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3">Lot No</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3 text-right text-text-primary w-24">Qty</th>
                                        <th className="px-4 py-3">Unit</th>
                                        <th className="px-4 py-3 text-right w-32">Rate</th>
                                        <th className="px-4 py-3 text-right text-text-primary">Taxable Value</th>
                                        <th className="px-4 py-3 text-right">CGST (9%)</th>
                                        <th className="px-4 py-3 text-right">SGST (9%)</th>
                                        <th className="px-4 py-3 text-right text-text-primary">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50 bg-white">
                                    {invoiceItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-text-secondary font-mono">{item.lotNumber}</td>
                                            <td className="px-4 py-3 text-sm text-text-primary font-medium">{item.description}</td>
                                            <td className="px-4 py-3 text-right">
                                                <input
                                                    type="number"
                                                    value={item.quantity === 0 ? '' : item.quantity}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const num = parseFloat(val);
                                                        handleItemChange(idx, 'quantity', isNaN(num) ? 0 : num);
                                                    }}
                                                    className="w-20 text-right text-sm border border-border rounded px-2 py-1 focus:ring-1 focus:ring-primary focus:border-primary"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text-secondary">{item.unit}</td>
                                            <td className="px-4 py-3 text-right">
                                                <input
                                                    type="number"
                                                    value={item.rate === 0 ? '' : item.rate}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const num = parseFloat(val);
                                                        handleItemChange(idx, 'rate', isNaN(num) ? 0 : num);
                                                    }}
                                                    className="w-28 text-right text-sm border border-border rounded px-2 py-1 focus:ring-1 focus:ring-primary focus:border-primary"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text-primary text-right font-medium bg-gray-50/30">₹{item.taxableValue.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-sm text-text-secondary text-right">₹{item.tax.cgstAmount.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-sm text-text-secondary text-right">₹{item.tax.sgstAmount.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-sm text-text-primary text-right font-bold bg-primary/5">₹{item.totalAmount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Totals */}
                    <Card padding="lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold text-text-secondary uppercase">Amount in Words</h4>
                                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-border">
                                    <div>
                                        <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Taxable Amount</div>
                                        <div className="text-sm font-medium text-text-primary">{amountInWords(formData.taxable_value || 0)}</div>
                                    </div>
                                    <div className="h-px bg-border/50" />
                                    <div>
                                        <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Total Invoice Value</div>
                                        <div className="text-sm font-bold text-primary">{amountInWords(formData.total_invoice_value || 0)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-secondary">Subtotal (Taxable)</span>
                                    <span className="font-semibold text-text-primary">₹{(formData.taxable_value || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-secondary">CGST Total (9%)</span>
                                    <span className="font-semibold text-text-primary">₹{(formData.cgst || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-secondary">SGST Total (9%)</span>
                                    <span className="font-semibold text-text-primary">₹{(formData.sgst || 0).toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-border my-2" />
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-bold text-text-primary">Grand Total</span>
                                    <span className="font-bold text-primary">₹{(formData.total_invoice_value || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default function CreateInvoicePage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-text-muted">Loading Editor...</div>}>
            <CreateInvoicePageContent />
        </Suspense>
    );
}
