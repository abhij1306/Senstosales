"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer, FileText, Package, Truck, Calculator, User, Building, MapPin, Activity, Sparkles, ShieldCheck, Edit2, Calendar } from "lucide-react";
import { api, API_BASE_URL } from "@/lib/api";
import { formatDate, formatIndianCurrency, amountInWords } from "@/lib/utils";
import DownloadButton from "@/components/DownloadButton";
import GlassCard from "@/components/ui/GlassCard";
import Tabs from "@/components/ui/Tabs";

const Field = ({ label, value, icon }: { label: string; value: string | number | null | undefined; icon?: React.ReactNode }) => (
    <div className="space-y-1 transition-all hover:translate-x-1">
        <label className="text-label flex items-center gap-2 text-[10px] opacity-70">
            {icon} {label}
        </label>
        <div className="text-sm font-medium text-slate-800 tracking-tight truncate" title={value?.toString()}>
            {value || <span className="text-slate-300 font-normal italic">UNSPECIFIED</span>}
        </div>
    </div>
);

function InvoiceDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get('id');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('buyer');

    useEffect(() => {
        if (!invoiceId) return;
        const loadData = async () => {
            try {
                const invoiceData = await api.getInvoiceDetail(decodeURIComponent(invoiceId));
                setData(invoiceData);
            } catch (err) {
                console.error("Invoice Error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [invoiceId]);

    if (loading) return <div className="p-32 text-center animate-pulse text-blue-600 font-bold uppercase tracking-widest text-xs">Loading Invoice Details...</div>;

    if (!data || !data.header) return (
        <div className="p-32 flex flex-col items-center justify-center gap-6">
            <ShieldCheck className="w-16 h-16 text-slate-200" />
            <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Invoice Not Found</h2>
            <button onClick={() => router.push('/invoice')} className="px-6 py-2 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-900 transition-all">Back to List</button>
        </div>
    );

    const { header, items = [], linked_dcs = [] } = data;

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6 space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/80 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white shadow-sm transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-[20px] font-semibold text-slate-800 tracking-tight uppercase">Invoice #{header.invoice_number}</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest">
                                ACTIVE
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                DATE {formatDate(header.invoice_date)}
                            </span>
                            {linked_dcs?.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-300">•</span>
                                    <div className="flex gap-1.5">
                                        {linked_dcs.map((dc: any) => (
                                            <button
                                                key={dc.dc_number}
                                                onClick={() => router.push(`/dc/view?id=${dc.id || dc.dc_number}`)}
                                                className="text-[10px] font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200 rounded px-1.5 py-0.5 transition-all uppercase"
                                            >
                                                DC #{dc.dc_number}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <DownloadButton
                        url={`${API_BASE_URL}/api/invoice/${encodeURIComponent(header.invoice_number)}/download`}
                        filename={`INV_${header.invoice_number}.xlsx`}
                        label="Download"
                        className="btn-premium btn-ghost border-slate-200 h-11 px-6 shadow-sm"
                    />
                    <button onClick={() => window.print()} className="btn-premium btn-ghost border-slate-200 h-11 px-6 shadow-sm">
                        <Printer className="w-4 h-4" /> Print View
                    </button>
                    <button
                        onClick={() => router.push(`/invoice/edit?id=${encodeURIComponent(header.invoice_number)}`)}
                        className="btn-premium btn-primary bg-slate-800 h-11 px-6"
                    >
                        <Edit2 className="w-4 h-4" /> Edit Invoice
                    </button>
                </div>
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <Tabs
                    tabs={[
                        { id: 'buyer', label: 'Buyer Info', icon: User },
                        { id: 'references', label: 'Order References', icon: FileText },
                        { id: 'logistics', label: 'Linked DC', icon: Truck }
                    ]}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    className="mb-0"
                />

                <div className="min-h-fit">
                    {activeTab === 'buyer' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <GlassCard className="p-6 border-slate-200/60 flex flex-wrap gap-12 items-center">
                                <div className="flex items-center gap-5 border-r border-slate-100 pr-12 min-w-[250px]">
                                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0">BUYER</div>
                                    <Field label="Full Name" value={header.buyer_name} icon={<User className="w-3.5 h-3.5 text-blue-500" />} />
                                </div>
                                <div className="grid grid-cols-2 gap-12">
                                    <Field label="GSTIN" value={header.buyer_gstin} />
                                    <Field label="Supply Place" value={header.place_of_supply} />
                                </div>
                                <div className="flex-1 space-y-1.5 min-w-[300px]">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing Address</label>
                                    <div className="text-sm font-medium text-slate-600 leading-relaxed">{header.buyer_address || 'N/A'}</div>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {activeTab === 'references' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <GlassCard className="p-6 border-slate-200/60 flex flex-wrap gap-12 items-center">
                                <div className="flex items-center gap-5 border-r border-slate-100 pr-12">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0">REF</div>
                                    <Field label="PO Number" value={header.buyers_order_no} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                                    <Field label="PO Date" value={formatDate(header.buyers_order_date)} />
                                    <Field label="DC Reference" value={header.linked_dc_numbers} />
                                    <Field label="GEMC No." value={header.gemc_number} />
                                    <Field label="SRV/Gate No." value={header.srv_no || header.despatch_doc_no || 'N/A'} />
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {activeTab === 'logistics' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <GlassCard className="p-6 border-slate-200/60 flex flex-wrap gap-12 items-center">
                                <div className="flex items-center gap-5 border-r border-slate-100 pr-12">
                                    <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[10px] shrink-0">LOGS</div>
                                    <Field label="Transporter" value={header.transporter} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                                    <Field label="Vehicle No" value={header.vehicle_no} />
                                    <Field label="LR No" value={header.lr_no} />
                                    <Field label="Destination" value={header.destination} />
                                    <Field label="Delivery Terms" value={header.terms_of_delivery || 'Standard'} />
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </div>

                <div className="pt-2 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Package className="w-3.5 h-3.5" /> Invoice Items
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest">
                                {items.length} ITEMS
                            </span>
                        </div>
                        <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200/60 bg-slate-50/50">
                                        <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-16 text-center">SL</th>
                                        <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Material Description</th>
                                        <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Qty</th>
                                        <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Rate</th>
                                        <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item: any, idx: number) => (
                                        <tr key={idx} className="group hover:bg-slate-50/80 transition-all">
                                            <td className="py-4 px-6 text-center text-xs font-bold text-slate-400">{item.po_sl_no || (idx + 1)}</td>
                                            <td className="py-4 px-6">
                                                <div className="text-sm font-semibold text-slate-800 uppercase group-hover:text-blue-600 transition-colors">{item.description}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">HSN Code: {item.hsn_sac || 'N/A'}</div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className="text-sm font-bold text-slate-600 tabular-nums">{item.quantity}</span>
                                                <span className="text-[10px] font-bold text-slate-400 ml-1.5 uppercase">{item.unit || 'NOS'}</span>
                                            </td>
                                            <td className="py-4 px-6 text-right font-medium text-slate-500 tabular-nums">
                                                {formatIndianCurrency(item.rate)}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className="text-sm font-bold text-slate-900 tabular-nums">
                                                    {formatIndianCurrency(item.total_amount)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <GlassCard className="p-0 overflow-hidden border-blue-200/60 shadow-lg shadow-blue-500/5 transition-all">
                            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                                <Calculator className="w-4 h-4 text-blue-600" />
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Commercial Summary</h3>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs group">
                                        <span className="font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Taxable Value</span>
                                        <span className="font-bold text-slate-700 tabular-nums">{formatIndianCurrency(header.taxable_value)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs group">
                                        <span className="font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">CGST (9%)</span>
                                        <span className="font-bold text-slate-700 tabular-nums">{formatIndianCurrency(header.cgst)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs group">
                                        <span className="font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">SGST (9%)</span>
                                        <span className="font-bold text-slate-700 tabular-nums">{formatIndianCurrency(header.sgst)}</span>
                                    </div>
                                </div>
                                <div className="h-px bg-slate-100/50" />
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] block">Total Invoice Value</span>
                                    <div className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums drop-shadow-sm">
                                        {formatIndianCurrency(header.total_invoice_value)}
                                    </div>
                                </div>
                            </div>
                            <div className="px-8 py-4 bg-blue-50/50 border-t border-blue-100/50">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tight leading-relaxed italic">
                                    {amountInWords(header.total_invoice_value)}
                                </p>
                            </div>
                        </GlassCard>

                        <div className="p-6 rounded-2xl border border-slate-100 bg-white/40 backdrop-blur-md flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authentication</div>
                                    <div className="text-xs font-bold text-slate-600 mt-0.5">Digitally Verified</div>
                                </div>
                            </div>
                            <Sparkles className="w-5 h-5 text-blue-200" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function InvoiceDetailPage() {
    return (
        <Suspense fallback={<div className="p-32 text-center animate-pulse text-blue-600 font-bold">Loading...</div>}>
            <InvoiceDetailContent />
        </Suspense>
    );
}
