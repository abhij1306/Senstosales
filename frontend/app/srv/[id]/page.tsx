"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Calendar, FileText, Package, AlertTriangle, CheckCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { DenseTable } from "@/components/ui/DenseTable";
import StatusBadge from "@/components/ui/StatusBadge";

import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function SRVDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [srv, setSrv] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            loadSRV(params.id as string);
        }
    }, [params.id]);

    const loadSRV = async (id: string) => {
        try {
            // Direct fetch or via api lib if available
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${baseUrl}/api/srv/${id}`);
            if (!res.ok) throw new Error("SRV not found");
            const data = await res.json();
            setSrv(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
    );

    if (!srv) return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
            <AlertTriangle className="w-12 h-12 mb-4 text-slate-300" />
            <p>SRV Not Found</p>
            <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">Go Back</button>
        </div>
    );

    const { header, items } = srv;

    const itemColumns = [
        { header: "PO Item", accessorKey: "po_item_no", cell: (row: any) => <span className="font-medium text-slate-500">{row.po_item_no}</span> },
        { header: "Lot", accessorKey: "lot_no", className: "text-center" },

        { header: "Order Qty", accessorKey: "order_qty", className: "text-right text-slate-400" },
        { header: "Challan Qty", accessorKey: "challan_qty", className: "text-right text-slate-400" },
        { header: "Received", accessorKey: "received_qty", className: "text-right font-medium text-emerald-600" },
        { header: "Accepted", accessorKey: "accepted_qty", className: "text-right font-medium text-blue-600" },
        { header: "Rejected", accessorKey: "rejected_qty", className: "text-right font-medium text-red-600" },
        { header: "Unit", accessorKey: "unit", className: "text-center text-slate-400" },
        { header: "Div", accessorKey: "div_code", className: "text-center text-slate-500" },

        { header: "Challan No", accessorKey: "challan_no", className: "text-slate-500" },
        { header: "Challan Date", accessorKey: "challan_date", cell: (row: any) => <span className="text-slate-400">{formatDate(row.challan_date)}</span> },
        { header: "Invoice No", accessorKey: "invoice_no", className: "text-slate-500" },
        { header: "Invoice Date", accessorKey: "invoice_date", cell: (row: any) => <span className="text-slate-400">{formatDate(row.invoice_date)}</span> },

        { header: "PMIR No", accessorKey: "pmir_no", className: "text-slate-400" },
        { header: "CNote No", accessorKey: "cnote_no", className: "text-slate-400" },
        { header: "CNote Date", accessorKey: "cnote_date", cell: (row: any) => <span className="text-slate-400">{formatDate(row.cnote_date)}</span> },
        { header: "Finance Date", accessorKey: "finance_date", cell: (row: any) => <span className="text-slate-400">{formatDate(row.finance_date)}</span> },
        { header: "Remarks", accessorKey: "remarks", className: "max-w-[150px] truncate italic text-slate-400" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-[20px] font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        SRV #{header.srv_number}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(header.srv_date)}</span>
                        <span className="flex items-center gap-1 text-slate-400">|</span>
                        <span className="flex items-center gap-1 font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => router.push(`/po/view?id=${header.po_number}`)}>
                            PO Reference: {header.po_number}
                        </span>
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-4 flex flex-col justify-center items-center text-center">
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Receipt Status</div>
                    <div className="text-[28px] font-bold text-emerald-600">
                        {items.reduce((acc: number, item: any) => acc + (item.received_qty || 0), 0)}
                    </div>
                    <div className="text-xs text-emerald-600/80 font-medium">Total Units Received</div>
                </GlassCard>

                <GlassCard className="p-4 flex flex-col justify-center items-center text-center">
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Rejection Rate</div>
                    <div className="text-[28px] font-bold text-red-600">
                        {items.reduce((acc: number, item: any) => acc + (item.rejected_qty || 0), 0)}
                    </div>
                    <div className="text-xs text-red-600/80 font-medium">Units Rejected</div>
                </GlassCard>

                <GlassCard className="p-4 flex flex-col justify-center items-center text-center bg-slate-50/50">
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Invoicing</div>
                    <div className="text-sm font-medium text-slate-700 mt-1">
                        {items[0]?.invoice_no ? `Inv #${items[0].invoice_no}` : "Pending Invoice"}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                        {items[0]?.invoice_date ? formatDate(items[0].invoice_date) : '-'}
                    </div>
                </GlassCard>
            </div>

            {/* Line Items Table */}
            <GlassCard className="p-0 overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-500" />
                        Line Items
                    </h3>
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">
                        {items.length} Items
                    </span>
                </div>
                <DenseTable
                    data={items}
                    columns={itemColumns}
                    className="bg-white/40"
                />
            </GlassCard>
        </div>
    );
}
