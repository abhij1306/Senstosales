"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, FileText, Loader2, Lock, Package, AlertCircle, Search, Receipt, Truck } from "lucide-react";
import { api } from "@/lib/api";
import type { InvoiceFormData, InvoiceItemUI } from "@/types/ui";
import { createDefaultInvoiceForm } from "@/lib/uiAdapters";
import type { ChangeEvent } from "react";
import { Card } from "@/components/ui/Card";

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
    className?: string;
}

const Input = ({ label, value, onChange, type = "text", placeholder = "", required = false, readOnly = false, className = "" }: InputProps) => (
    <div className={`space-y-0.5 ${className}`}>
        <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <input
                type={type}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                placeholder={placeholder}
                className={`w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 transition-colors ${readOnly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white/80'
                    }`}
            />
            {readOnly && <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 opacity-50" />}
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
    const [activeTab, setActiveTab] = useState("general");

    // Manual DC input state if not provided in URL
    const [manualDcId, setManualDcId] = useState(dcId);

    const [formData, setFormData] = useState<InvoiceFormData>(
        createDefaultInvoiceForm(dcId || undefined)
    );

    // Initial Load
    useEffect(() => {
        // Fetch preview invoice number
        fetchInvoiceNumber();

        if (dcId) {
            loadDC(dcId);
        }
    }, [dcId]);

    const fetchInvoiceNumber = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/invoice/preview-number`);
            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, invoice_number: data.invoice_number }));
            }
        } catch (err) {
            console.error("Failed to fetch invoice number:", err);
            // Non-critical, user can enter manually
        }
    };

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

        // Invoice number is auto-generated by backend if not provided

        setError(null);
        setSaving(true);

        try {
            const payload = {
                invoice_number: formData.invoice_number,
                invoice_date: formData.invoice_date,
                dc_number: formData.dc_number,
                buyer_name: formData.buyer_name,
                buyer_gstin: formData.buyer_gstin,
                buyer_state: formData.buyer_state,
                place_of_supply: formData.place_of_supply,
                buyers_order_no: formData.buyers_order_no,
                buyers_order_date: formData.buyers_order_date,
                vehicle_no: formData.vehicle_no,
                lr_no: formData.lr_no,
                transporter: formData.transporter,
                destination: formData.destination,
                terms_of_delivery: formData.terms_of_delivery,
                gemc_number: formData.gemc_number,
                mode_of_payment: formData.mode_of_payment,
                payment_terms: formData.payment_terms,
                despatch_doc_no: formData.despatch_doc_no,
                srv_no: formData.srv_no,
                srv_date: formData.srv_date,
                remarks: formData.remarks,
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

            const response = await api.createInvoice(payload) as any;
            if (response.invoice_number) {
                router.push(`/invoice/view?id=${encodeURIComponent(response.invoice_number)}`);
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
        <div className="space-y-4 pb-12 w-full max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-white/50">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                            Generate Invoice
                        </h1>
                        <p className="text-xs text-slate-500">
                            Finalize GST invoice against DC
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 items-center">
                    {!dcId && (
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                                <input
                                    type="text"
                                    value={manualDcId}
                                    onChange={(e) => setManualDcId(e.target.value)}
                                    className="w-40 pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white/80 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
                                    placeholder="Enter DC No."
                                    disabled={loading}
                                />
                            </div>
                            <button
                                onClick={() => loadDC(manualDcId || '')}
                                disabled={loading || !manualDcId}
                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-medium transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Fetching...' : 'Link'}
                            </button>
                        </div>
                    )}
                    <div className="h-5 w-px bg-slate-200 mx-1" />
                    <button
                        onClick={() => router.back()}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white/50 border border-slate-200 rounded-lg hover:bg-white transition-colors"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || invoiceItems.length === 0}
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-3.5 h-3.5" /> Finalize
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50/90 backdrop-blur border border-red-100 rounded-xl p-3 flex items-start gap-3 text-red-600 shadow-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                    <p className="text-slate-500 text-xs font-medium">Fetching Challan Details...</p>
                </div>
            )}

            {/* Empty State */}
            {!dcId && invoiceItems.length === 0 && !loading && !manualDcId && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-xl bg-white/30 backdrop-blur-sm">
                    <FileText className="w-10 h-10 text-slate-300 mb-3" />
                    <h3 className="text-sm font-medium text-slate-700">No Delivery Challan Linked</h3>
                    <p className="text-xs text-slate-500">Enter a DC Number top-right to generate an invoice.</p>
                </div>
            )}

            {/* Warning State */}
            {dcId && invoiceItems.length === 0 && !loading && (
                <div className="bg-amber-50/90 backdrop-blur border border-amber-200 rounded-xl p-6 flex flex-col items-center text-center">
                    <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                    <h3 className="text-sm font-semibold text-amber-900">No Items Found</h3>
                    <p className="text-amber-700 text-xs mt-1">
                        DC <strong>{dcId}</strong> has no items or could not be loaded.
                    </p>
                    <button
                        onClick={() => loadDC(dcId)}
                        className="mt-3 px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-50 text-xs font-medium"
                    >
                        Reload
                    </button>
                </div>
            )}


            {invoiceItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Left Column: Form Details (Tabs) */}
                    <div className="md:col-span-2 space-y-4">
                        <Card variant="glass" padding="none" className="overflow-hidden">
                            {/* Tabs Header */}
                            <div className="flex border-b border-white/20 bg-white/40">
                                {[
                                    { id: 'general', icon: Receipt, label: 'General' },
                                    { id: 'transport', icon: Truck, label: 'Transport' },
                                    { id: 'payment', icon: FileText, label: 'Payment' },
                                ].map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all flex-1 justify-center border-b-2 ${activeTab === tab.id
                                                ? "border-blue-500 text-blue-700 bg-blue-50/30"
                                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/40"
                                                }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" /> {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="p-5">
                                {activeTab === 'general' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Input label="Invoice Number" value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} placeholder="Auto-generated if blank" />
                                        <Input label="Invoice Date" type="date" value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} required />
                                        <Input label="Linked Challan" value={formData.dc_number} readOnly />

                                        <Input label="Challan Date" value={formData.challan_date || ''} readOnly />
                                        <Input label="Buyer's Order No" value={formData.buyers_order_no || ''} readOnly />
                                        <Input label="Buyer's Order Date" value={formData.buyers_order_date || ''} readOnly />

                                        <div className="col-span-1 md:col-span-3 h-px bg-slate-200/50 my-1" />

                                        <div className="col-span-1 md:col-span-2">
                                            <Input label="Buyer Name" value={formData.buyer_name} onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })} required />
                                        </div>
                                        <Input label="Buyer GSTIN" value={formData.buyer_gstin || ''} onChange={(e) => setFormData({ ...formData, buyer_gstin: e.target.value })} />

                                        <Input label="Place of Supply" value={formData.place_of_supply || ''} onChange={(e) => setFormData({ ...formData, place_of_supply: e.target.value })} />
                                        <Input label="State" value={formData.buyer_state || ''} onChange={(e) => setFormData({ ...formData, buyer_state: e.target.value })} />
                                    </div>
                                )}

                                {activeTab === 'transport' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="col-span-1 md:col-span-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-center gap-4">
                                            <Input label="Vehicle Number" value={formData.vehicle_no || ''} onChange={(e) => setFormData({ ...formData, vehicle_no: e.target.value })} placeholder="MP04-AA-1234" className="mb-0 flex-1" />
                                            <Input label="Transport Mode" value={formData.transporter || ''} onChange={(e) => setFormData({ ...formData, transporter: e.target.value })} className="mb-0 flex-1" />
                                        </div>
                                        <Input label="LR Number" value={formData.lr_no || ''} onChange={(e) => setFormData({ ...formData, lr_no: e.target.value })} />
                                        <Input label="Destination" value={formData.destination || ''} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} />
                                        <Input label="Despatch Doc No" value={formData.despatch_doc_no || ''} onChange={(e) => setFormData({ ...formData, despatch_doc_no: e.target.value })} />
                                        <Input label="E-way Bill / GEMC" value={formData.gemc_number || ''} onChange={(e) => setFormData({ ...formData, gemc_number: e.target.value })} />
                                    </div>
                                )}

                                {activeTab === 'payment' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Input label="Mode of Payment" value={formData.mode_of_payment || ''} onChange={(e) => setFormData({ ...formData, mode_of_payment: e.target.value })} />
                                        <Input label="Terms of Delivery" value={formData.terms_of_delivery || ''} onChange={(e) => setFormData({ ...formData, terms_of_delivery: e.target.value })} />
                                        <Input label="Payment Terms" value={formData.payment_terms || ''} onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })} />

                                        <div className="col-span-1 md:col-span-3 h-px bg-slate-200/50 my-1" />

                                        <Input label="SRV No" value={formData.srv_no || ''} onChange={(e) => setFormData({ ...formData, srv_no: e.target.value })} />
                                        <Input label="SRV Date" type="date" value={formData.srv_date || ''} onChange={(e) => setFormData({ ...formData, srv_date: e.target.value })} />
                                        <Input label="Inspection Note" value={formData.remarks || ''} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Items Table */}
                        <Card variant="glass" padding="none" className="overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-white/20 bg-white/40">
                                <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                                    <Package className="w-3.5 h-3.5 text-blue-600" /> Items
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/60 text-slate-500 font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2">Lot</th>
                                            <th className="px-3 py-2">Description</th>
                                            <th className="px-3 py-2 text-right w-20">Qty</th>
                                            <th className="px-3 py-2 text-right w-24">Rate</th>
                                            <th className="px-3 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white/40">
                                        {invoiceItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-white/60 transition-colors">
                                                <td className="px-3 py-1.5 text-xs text-slate-500">{item.lotNumber}</td>
                                                <td className="px-3 py-1.5 text-xs text-slate-800 font-medium max-w-[200px] truncate" title={item.description}>{item.description}</td>
                                                <td className="px-3 py-1.5 text-right">
                                                    <input
                                                        type="number"
                                                        value={item.quantity === 0 ? '' : item.quantity}
                                                        onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-16 text-right text-xs border border-slate-200 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-3 py-1.5 text-right">
                                                    <input
                                                        type="number"
                                                        value={item.rate === 0 ? '' : item.rate}
                                                        onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                                                        className="w-20 text-right text-xs border border-slate-200 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-3 py-1.5 text-xs text-slate-800 text-right font-bold">₹{item.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Calculations */}
                    <div className="space-y-4">
                        <Card variant="glass" padding="sm" className="space-y-4 h-fit sticky top-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Summary</h3>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Taxable Amount</span>
                                    <span className="font-semibold text-slate-700">₹{(formData.taxable_value || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">CGST (9%)</span>
                                    <span className="font-semibold text-slate-700">₹{(formData.cgst || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">SGST (9%)</span>
                                    <span className="font-semibold text-slate-700">₹{(formData.sgst || 0).toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-slate-200 my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-800">Grand Total</span>
                                    <span className="text-base font-bold text-blue-600">₹{(formData.total_invoice_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100 mt-4">
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Amount in Words</div>
                                <div className="text-xs font-medium text-slate-600 leading-relaxed italic">
                                    {amountInWords(formData.total_invoice_value || 0)}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CreateInvoicePage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-400 text-sm">Loading Editor...</div>}>
            <CreateInvoicePageContent />
        </Suspense>
    );
}
