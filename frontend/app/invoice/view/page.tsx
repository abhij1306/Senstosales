"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer, FileText, Package, Truck, Lock, Calculator, User, Building, MapPin } from "lucide-react";

import { api, API_BASE_URL } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import DownloadButton from "@/components/DownloadButton";
import { Card } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import Link from 'next/link';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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

interface FieldProps {
    label: string;
    value: string | number | null | undefined;
    icon?: React.ReactNode;
}

const Field = ({ label, value, icon }: FieldProps) => (
    <div className="space-y-1">
        <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            {icon} {label}
        </label>
        <div className="text-sm font-semibold text-slate-700 truncate min-h-[20px]" title={value?.toString()}>
            {value || <span className="text-slate-300 italic">-</span>}
        </div>
    </div>
);

function InvoiceDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get('id');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!invoiceId) return;

        const loadData = async () => {
            try {
                const invoiceData = await api.getInvoiceDetail(decodeURIComponent(invoiceId));
                setData(invoiceData);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load Invoice:", err);
                setLoading(false);
            }
        };

        loadData();
    }, [invoiceId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
                <div className="text-purple-600 font-medium animate-pulse">Loading Invoice...</div>
            </div>
        );
    }

    if (!data || !data.header) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 gap-4">
                <div className="bg-red-50 p-4 rounded-full border border-red-100">
                    <FileText className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Invoice Not Found</h2>
                <button
                    onClick={() => router.push('/invoice')}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
                >
                    Back to List
                </button>
            </div>
        );
    }

    const { header, items = [], linked_dcs = [] } = data;

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-4 md:p-6 space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 rounded-full hover:bg-white/50"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                            Invoice {header.invoice_number}
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wide">
                                Generated
                            </span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                {formatDate(header.invoice_date)}
                            </span>
                            {linked_dcs && linked_dcs.length > 0 && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-[11px] font-bold text-slate-500 bg-white/60 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                                        Linked DCs: {linked_dcs.map((dc: any, i: number) => (
                                            <span key={dc.dc_number} className="text-purple-600 cursor-pointer hover:underline hover:text-purple-800" onClick={() => router.push(`/dc/view?id=${dc.id || dc.dc_number}`)}>
                                                {dc.dc_number}{i < linked_dcs.length - 1 ? ',' : ''}
                                            </span>
                                        ))}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <DownloadButton
                        url={`${API_BASE_URL}/api/invoice/${encodeURIComponent(header.invoice_number)}/download`}
                        filename={`Invoice_${header.invoice_number}.xlsx`}
                        label="Download Excel"
                    />
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        Print Invoice
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Details & Financials (1/3) */}
                <div className="md:col-span-1 space-y-6">
                    {/* Basic Info Card */}
                    <Card variant="glass" padding="none" className="overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/20 bg-white/40">
                            <Building className="w-4 h-4 text-purple-600" />
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Buyer Details</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <Field
                                label="Buyer Name"
                                value={header.buyer_name}
                                icon={<User className="w-3 h-3 text-slate-400" />}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="GSTIN" value={header.buyer_gstin} />
                                <Field label="State" value={header.buyer_state} />
                            </div>
                            <Field label="Place of Supply" value={header.place_of_supply} icon={<MapPin className="w-3 h-3 text-slate-400" />} />
                        </div>
                    </Card>

                    {/* Reference Info Card */}
                    <Card variant="glass" padding="none" className="overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/20 bg-white/40">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">References</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Buyer Order No" value={header.buyers_order_no} />
                                <Field label="Order Date" value={header.buyers_order_date} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Challan No" value={header.linked_dc_numbers} />
                                <Field label="Challan Date" value={header.dc_date} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="SRV No" value={header.srv_no} />
                                <Field label="SRV Date" value={header.srv_date} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Despatch Doc No" value={header.despatch_doc_no} />
                                <Field label="GEMC / E-way" value={header.gemc_number} />
                            </div>
                        </div>
                    </Card>

                    {/* Transport Info Card */}
                    <Card variant="glass" padding="none" className="overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/20 bg-white/40">
                            <Truck className="w-4 h-4 text-amber-600" />
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Transport Details</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Transporter" value={header.transporter} />
                                <Field label="Vehicle No" value={header.vehicle_no} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="LR No" value={header.lr_no} />
                                <Field label="Destination" value={header.destination} />
                            </div>
                            <Field label="Terms of Delivery" value={header.terms_of_delivery} />
                        </div>
                    </Card>
                </div>

                {/* Right Column: Items & Tax Summary (2/3) */}
                <div className="md:col-span-2 space-y-6">
                    {/* Items Table Card */}
                    <Card variant="glass" padding="none" className="overflow-hidden">
                        <div className="p-4 border-b border-white/20 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
                                <Package className="w-4 h-4 text-purple-600" /> Invoice Items
                            </h3>
                            <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{items.length} Items</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Lot No</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3">Unit</th>
                                        <th className="px-4 py-3 text-right">Rate</th>
                                        <th className="px-4 py-3 text-right">Taxable</th>
                                        <th className="px-4 py-3 text-right">CGST</th>
                                        <th className="px-4 py-3 text-right">SGST</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/50">
                                    {items.map((item: any, idx: number) => (
                                        <React.Fragment key={idx}>
                                            {/* Description Header Row */}
                                            <tr className="bg-slate-50">
                                                <td colSpan={9} className="px-4 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200">
                                                    {item.description}
                                                </td>
                                            </tr>
                                            {/* Data Row */}
                                            <tr className="hover:bg-white/60 transition-colors bg-white/20">
                                                <td className="px-4 py-3 text-xs text-slate-700 font-bold">{item.po_sl_no}</td>
                                                <td className="px-4 py-3 text-xs text-slate-700 font-medium"></td>
                                                <td className="px-4 py-3 text-xs text-slate-700 text-right">{item.quantity?.toLocaleString('en-IN')}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500">{item.unit}</td>
                                                <td className="px-4 py-3 text-xs text-slate-700 text-right">
                                                    ₹{item.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-700 text-right font-medium">₹{item.taxable_value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500 text-right">₹{item.cgst_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500 text-right">₹{item.sgst_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-3 text-xs text-slate-800 text-right font-bold">₹{item.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Tax Summary Card */}
                    <Card variant="glass" padding="none" className="overflow-hidden">
                        <div className="p-4 border-b border-white/20 bg-slate-50/50 flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-emerald-600" />
                            <h3 className="text-[14px] font-bold text-slate-800">Tax & Total Summary</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-500 font-medium">Taxable Value</span>
                                        <span className="text-sm font-bold text-slate-800">₹{header.taxable_value?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-500 font-medium">CGST (9%)</span>
                                        <span className="text-sm font-bold text-slate-800">₹{header.cgst?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-500 font-medium">SGST (9%)</span>
                                        <span className="text-sm font-bold text-slate-800">₹{header.sgst?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-sm font-bold text-slate-800">Total Invoice Value</span>
                                        <span className="text-lg font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100 shadow-sm">
                                            ₹{header.total_invoice_value?.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 bg-slate-50/80 p-5 rounded-xl border border-slate-200/60">
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText className="w-3 h-3" /> Amount in Words
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="text-xs text-slate-500">
                                            <span className="font-semibold block mb-0.5 text-slate-400">CGST (in words):</span>
                                            <div className="text-slate-800 font-medium font-serif italic">{amountInWords(header.cgst || 0)}</div>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            <span className="font-semibold block mb-0.5 text-slate-400">SGST (in words):</span>
                                            <div className="text-slate-800 font-medium font-serif italic">{amountInWords(header.sgst || 0)}</div>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            <span className="font-semibold block mb-0.5 text-slate-400">Total (in words):</span>
                                            <div className="text-slate-800 font-medium font-serif italic">{amountInWords(header.total_invoice_value || 0)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function InvoiceDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
                <div className="text-purple-600 font-medium animate-pulse">Loading...</div>
            </div>
        }>
            <InvoiceDetailContent />
        </Suspense>
    );
}
