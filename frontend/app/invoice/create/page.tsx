"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, FileText, Loader2, Lock, Package, AlertCircle, Search, Receipt, Truck, Landmark, Activity, Sparkles, Building, Info, ShieldCheck, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { InvoiceFormData, InvoiceItemUI } from "@/types/ui";
import { createDefaultInvoiceForm } from "@/lib/uiAdapters";
import { formatDate, amountInWords } from "@/lib/utils";
import GlassCard from "@/components/ui/GlassCard";

const TAX_RATES = { cgst: 9.0, sgst: 9.0 };

function CreateInvoicePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dcId = searchParams?.get('dc') || '';

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItemUI[]>([]);
    const [activeTab, setActiveTab] = useState("general");
    const [manualDcId, setManualDcId] = useState(dcId);
    const [formData, setFormData] = useState<InvoiceFormData>(createDefaultInvoiceForm(dcId || undefined));

    useEffect(() => {
        fetchInvoiceNumber();
        if (dcId) loadDC(dcId);
    }, [dcId]);

    const fetchInvoiceNumber = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/invoice/preview-number`);
            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, invoice_number: data.invoice_number }));
            }
        } catch (err) { console.error(err); }
    };

    const loadDC = async (id: string) => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const data = await api.getDCDetail(id);
            if (!data?.header) {
                setError("Challan not found.");
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

            if (data.items?.length > 0) {
                const items: InvoiceItemUI[] = data.items.map((item: any) => {
                    const qty = item.dispatched_quantity || item.dispatch_qty || 0;
                    const rate = item.po_rate || 0;
                    const taxableValue = qty * rate;
                    const cgstAmount = (taxableValue * TAX_RATES.cgst) / 100;
                    const sgstAmount = (taxableValue * TAX_RATES.sgst) / 100;
                    return {
                        lotNumber: item.lot_no?.toString() || '',
                        description: item.description || item.material_description || '',
                        hsnCode: item.hsn_code || '',
                        quantity: qty,
                        unit: 'NO',
                        rate: rate,
                        taxableValue,
                        tax: { cgstRate: TAX_RATES.cgst, cgstAmount, sgstRate: TAX_RATES.sgst, sgstAmount, igstRate: 0, igstAmount: 0 },
                        totalAmount: taxableValue + cgstAmount + sgstAmount
                    };
                });
                setInvoiceItems(items);
                calculateTotals(items);
            }
        } catch (err: any) {
            setError(err.message || "Traceback failure in record retrieval");
        } finally {
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
        item.taxableValue = item.quantity * item.rate;
        item.tax.cgstAmount = (item.taxableValue * item.tax.cgstRate) / 100;
        item.tax.sgstAmount = (item.taxableValue * item.tax.sgstRate) / 100;
        item.totalAmount = item.taxableValue + item.tax.cgstAmount + item.tax.sgstAmount;
        setInvoiceItems(newItems);
        calculateTotals(newItems);
    };

    const handleSubmit = async () => {
        if (saving) return;
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
            router.push(`/invoice/view?id=${encodeURIComponent(response.invoice_number || formData.invoice_number)}`);
        } catch (err: any) {
            setError(err.message || "Synchronization failure");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6 space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/80 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white shadow-sm transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-[20px] font-semibold text-slate-800 tracking-tight uppercase">Create Invoice</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest">
                                COMMERCIAL
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5" />
                                {formData.invoice_number || 'ST/INV/24-25/000'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    {!dcId && (
                        <div className="flex items-center gap-2 p-1.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="text"
                                    value={manualDcId}
                                    onChange={(e) => setManualDcId(e.target.value)}
                                    className="w-48 pl-9 pr-3 py-2 text-xs font-black uppercase tracking-widest bg-transparent border-none focus:ring-0 outline-none"
                                    placeholder="DC NUMBER"
                                />
                            </div>
                            <button
                                onClick={() => loadDC(manualDcId || '')}
                                disabled={loading || !manualDcId}
                                className="btn-premium btn-primary h-8 px-4 py-0 text-[10px] bg-slate-800"
                            >
                                {loading ? '...' : 'Find'}
                            </button>
                        </div>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={saving || invoiceItems.length === 0}
                        className="btn-premium btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 shadow-indigo-200 h-11 px-8"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Saving..." : "Create Invoice"}
                    </button>
                </div>
            </div>

            {error && (
                <GlassCard className="p-4 border-rose-200 bg-rose-50/30 flex items-center gap-4 text-rose-700 font-bold uppercase text-[10px] tracking-widest">
                    <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                </GlassCard>
            )}

            {invoiceItems.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                        <GlassCard className="p-0 overflow-hidden border-slate-200/60 shadow-sm">
                            <div className="flex p-1 bg-slate-50/50 border-b border-slate-100">
                                {[
                                    { id: 'general', icon: Receipt, label: 'General Info' },
                                    { id: 'transport', icon: Truck, label: 'Linked DC' },
                                    { id: 'payment', icon: Landmark, label: 'Financials' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                                            ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                                            : "text-slate-400 hover:text-slate-600 border border-transparent"
                                            }`}
                                    >
                                        <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-blue-500' : 'text-slate-400'}`} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-10">
                                {activeTab === 'general' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice Number</label>
                                            <input
                                                value={formData.invoice_number}
                                                onChange={e => setFormData({ ...formData, invoice_number: e.target.value.toUpperCase() })}
                                                className="input-premium font-bold"
                                                placeholder="Enter Invoice Number or leave blank for auto"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice Date</label>
                                            <input
                                                type="date"
                                                value={formData.invoice_date}
                                                onChange={e => setFormData({ ...formData, invoice_date: e.target.value })}
                                                className="input-premium font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DC Number</label>
                                            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 flex items-center justify-between">
                                                {formData.dc_number || 'PENDING'}
                                                <Lock className="w-3.5 h-3.5" />
                                            </div>
                                        </div>

                                        <div className="col-span-full h-px bg-slate-50 my-2" />

                                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buyer Name</label>
                                            <input
                                                value={formData.buyer_name}
                                                onChange={e => setFormData({ ...formData, buyer_name: e.target.value })}
                                                className="input-premium font-bold"
                                                placeholder="Customer name"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buyer GSTIN</label>
                                            <input
                                                value={formData.buyer_gstin || ''}
                                                onChange={e => setFormData({ ...formData, buyer_gstin: e.target.value.toUpperCase() })}
                                                className="input-premium font-bold"
                                                placeholder="GST number"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Place of Supply</label>
                                            <input
                                                value={formData.place_of_supply || ''}
                                                onChange={e => setFormData({ ...formData, place_of_supply: e.target.value })}
                                                className="input-premium font-bold"
                                                placeholder="e.g. Madhya Pradesh"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">State Code</label>
                                            <input
                                                value={formData.buyer_state || ''}
                                                onChange={e => setFormData({ ...formData, buyer_state: e.target.value })}
                                                className="input-premium font-bold"
                                                placeholder="e.g. 23"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'transport' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vehicle No</label>
                                            <input
                                                value={formData.vehicle_no || ''}
                                                onChange={e => setFormData({ ...formData, vehicle_no: e.target.value })}
                                                className="input-premium font-bold"
                                                placeholder="e.g. MP04HE1234"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transporter</label>
                                            <input
                                                value={formData.transporter || ''}
                                                onChange={e => setFormData({ ...formData, transporter: e.target.value })}
                                                className="input-premium font-bold"
                                                placeholder="Transport company name"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LR No</label>
                                            <input
                                                value={formData.lr_no || ''}
                                                onChange={e => setFormData({ ...formData, lr_no: e.target.value })}
                                                className="input-premium font-bold"
                                                placeholder="LR number"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destination</label>
                                            <input
                                                value={formData.destination || ''}
                                                onChange={e => setFormData({ ...formData, destination: e.target.value })}
                                                className="input-premium font-bold"
                                                placeholder="Delivery city"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GEMC No.</label>
                                            <input
                                                value={formData.gemc_number || ''}
                                                onChange={e => setFormData({ ...formData, gemc_number: e.target.value })}
                                                className="input-premium font-bold"
                                                placeholder="Contract number"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'payment' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mode of Payment</label>
                                            <input
                                                value={formData.mode_of_payment || ''}
                                                onChange={e => setFormData({ ...formData, mode_of_payment: e.target.value })}
                                                className="input-premium font-bold"
                                                placeholder="e.g. Bank Transfer"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Terms</label>
                                            <input
                                                value={formData.payment_terms || ''}
                                                onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                                                className="input-premium font-bold"
                                                placeholder="e.g. 100% Against SRV"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terms of Delivery</label>
                                            <input
                                                value={formData.terms_of_delivery || ''}
                                                onChange={e => setFormData({ ...formData, terms_of_delivery: e.target.value })}
                                                className="input-premium font-bold"
                                                placeholder="e.g. FOR Destination"
                                            />
                                        </div>

                                        <div className="col-span-full h-px bg-slate-50 my-2" />

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SRV No</label>
                                            <input
                                                value={formData.srv_no || ''}
                                                onChange={e => setFormData({ ...formData, srv_no: e.target.value })}
                                                className="input-premium font-bold"
                                                placeholder="Voucher number"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SRV Date</label>
                                            <input
                                                type="date"
                                                value={formData.srv_date || ''}
                                                onChange={e => setFormData({ ...formData, srv_date: e.target.value })}
                                                className="input-premium font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">General Remarks</label>
                                            <input
                                                value={formData.remarks || ''}
                                                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                                className="input-premium font-bold"
                                                placeholder="Additional information"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Package className="w-3.5 h-3.5" /> Invoice Items
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest">
                                    {invoiceItems.length} ITEMS
                                </span>
                            </div>

                            <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200/60 bg-slate-50/50">
                                            <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-16 text-center">#</th>
                                            <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                                            <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right w-24">Qty</th>
                                            <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right w-32">Rate (₹)</th>
                                            <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {invoiceItems.map((item, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50/80 transition-all">
                                                <td className="py-4 px-6 text-center text-xs font-bold text-slate-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="text-sm font-semibold text-slate-800 uppercase leading-snug">{item.description}</div>
                                                    <div className="flex items-center gap-4 mt-0.5">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">HSN: {item.hsnCode || 'N/A'}</span>
                                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Lot: {item.lotNumber}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <input
                                                        type="number"
                                                        value={item.quantity || ""}
                                                        onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-right text-sm font-bold text-slate-600 outline-none focus:border-blue-500 shadow-sm"
                                                    />
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <input
                                                        type="number"
                                                        value={item.rate || ""}
                                                        onChange={e => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-right text-sm font-bold text-blue-600 outline-none focus:border-blue-500 shadow-sm"
                                                    />
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <div className="text-sm font-bold text-slate-900 tabular-nums">
                                                            ₹{item.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newItems = invoiceItems.filter((_, i) => i !== idx);
                                                                setInvoiceItems(newItems);
                                                                calculateTotals(newItems);
                                                            }}
                                                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                            title="Remove Item"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-8 h-fit lg:sticky lg:top-8">
                        <GlassCard className="p-8 border-blue-100/50 shadow-lg shadow-blue-500/5 overflow-hidden relative group">
                            <div className="absolute -right-8 -top-8 h-32 w-32 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />

                            <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2 relative">
                                <Sparkles className="w-3.5 h-3.5" /> Commercial Summary
                            </h3>

                            <div className="space-y-5 relative">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxable Value</span>
                                    <span className="text-sm font-bold text-slate-700 tabular-nums">₹{(formData.taxable_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CGST (9%)</span>
                                    <span className="text-sm font-bold text-slate-700 tabular-nums">₹{(formData.cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SGST (9%)</span>
                                    <span className="text-sm font-bold text-slate-700 tabular-nums">₹{(formData.sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="pt-5 border-t border-slate-100">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] block mb-2">Total Invoice Amount</span>
                                    <div className="text-4xl font-black text-slate-900 tracking-tighter mb-4 drop-shadow-sm tabular-nums">
                                        ₹{(formData.total_invoice_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-[10px] font-bold leading-relaxed text-slate-500 italic uppercase tracking-wider">
                                        {amountInWords(formData.total_invoice_value || 0)}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-8 border-indigo-100/50 shadow-lg shadow-indigo-500/5">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Source Context</h4>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1.5">
                                    <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-[0.2em] block">Linked DC Number</span>
                                    <div className="text-lg font-bold text-slate-800 tracking-tight">{formData.dc_number || 'MANUAL'}</div>
                                    <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                        {formData.buyers_order_no ? `PO #${formData.buyers_order_no}` : 'No PO Linked'}
                                    </div>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center border border-indigo-100">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}

            {!dcId && invoiceItems.length === 0 && !loading && (
                <div className="py-32 flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-700">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                        <Search className="w-8 h-8 text-slate-200" />
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">No Challan Selected</h3>
                        <p className="text-[10px] font-medium text-slate-300 uppercase tracking-widest">Enter a DC number in the search bar to load items</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CreateInvoicePage() {
    return (
        <Suspense fallback={<div className="p-32 text-center animate-pulse text-blue-600 font-bold uppercase tracking-widest text-xs">Loading...</div>}>
            <CreateInvoicePageContent />
        </Suspense>
    );
}
