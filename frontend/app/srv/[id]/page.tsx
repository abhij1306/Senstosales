"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Calendar, FileText, Package, AlertTriangle, CheckCircle, Activity, Sparkles, ShieldCheck, ClipboardCheck } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { formatDate } from "@/lib/utils";

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
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${baseUrl}/api/srv/${id}`);
            if (!res.ok) throw new Error("SRV Record Missing");
            const data = await res.json();
            setSrv(data);
        } catch (err) {
            console.error("SRV Error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-32 text-center animate-pulse text-indigo-500 font-bold uppercase tracking-widest text-xs">Accessing Inspection Vault...</div>;

    if (!srv) return (
        <div className="p-32 flex flex-col items-center justify-center gap-6">
            <AlertTriangle className="w-16 h-16 text-rose-500 opacity-20" />
            <h2 className="heading-xl text-rose-700 uppercase">Record Not Found</h2>
            <button onClick={() => router.back()} className="btn-premium btn-ghost">Return to Repository</button>
        </div>
    );

    const { header, items = [] } = srv;

    const totalReceived = items.reduce((acc: number, item: any) => acc + (item.received_qty || 0), 0);
    const totalRejected = items.reduce((acc: number, item: any) => acc + (item.rejected_qty || 0), 0);

    const itemColumns = [
        { header: "DIV", accessorKey: "div_code", className: "text-center font-black text-[10px] text-slate-400" },
        {
            header: "Item Details",
            accessorKey: "po_item_no",
            cell: (row: any) => (
                <div className="flex flex-col items-center">
                    <span className="font-black text-slate-700">ITEM-{row.po_item_no}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Lot {row.lot_no}</span>
                </div>
            )
        },
        { header: "PMIR", accessorKey: "pmir_no", className: "font-black text-slate-400 text-[10px]" },

        {
            header: "Challan Details", accessorKey: "challan_no", cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-700 uppercase tracking-tighter">{row.challan_no || '-'}</span>
                    <span className="text-[9px] font-bold text-slate-400">{row.challan_date ? formatDate(row.challan_date) : '-'}</span>
                </div>
            )
        },

        {
            header: "Invoice Reference", accessorKey: "invoice_no", cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-black text-blue-600 uppercase tracking-tighter cursor-pointer" onClick={() => row.invoice_no && router.push(`/invoice/view?id=${encodeURIComponent(row.invoice_no.toString().trim())}`)}>{row.invoice_no || '-'}</span>
                    <span className="text-[9px] font-bold text-slate-400">{row.invoice_date ? formatDate(row.invoice_date) : '-'}</span>
                </div>
            )
        },

        {
            header: "Finance / CNote",
            accessorKey: "finance_date",
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-500 uppercase text-[9px] tracking-tight">Fin: {row.finance_date ? formatDate(row.finance_date) : '-'}</span>
                    <span className="text-[9px] font-bold text-slate-400">CN: {row.cnote_no || '-'}</span>
                </div>
            )
        },

        { header: "Unit", accessorKey: "unit", className: "text-center font-black text-[10px] uppercase text-slate-400" },
        { header: "Ord Qty", accessorKey: "order_qty", className: "text-right text-slate-400 font-bold" },
        { header: "Challan Qty", accessorKey: "challan_qty", className: "text-right text-slate-400 font-bold" },
        { header: "Rcvd", accessorKey: "received_qty", className: "text-right font-black text-indigo-600 bg-indigo-50/10" },
        { header: "Accpt", accessorKey: "accepted_qty", className: "text-right font-black text-emerald-600 bg-emerald-50/10" },
        { header: "Rej", accessorKey: "rejected_qty", className: "text-right font-black text-rose-600 bg-rose-50/10" },
    ];

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 p-6 space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="btn-premium btn-ghost h-12 w-12 p-0 rounded-2xl shadow-lg border-white/60">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="heading-xl uppercase tracking-tighter flex items-center gap-4">
                            SRV-{header.srv_number}
                            <span className="badge-premium badge-indigo">INSPECTED</span>
                        </h1>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                CERTIFIED {formatDate(header.srv_date)}
                            </span>
                            <span className="badge-premium badge-blue opacity-90 cursor-pointer" onClick={() => router.push(`/po/view?id=${header.po_number}`)}>
                                CONTRACT: {header.po_number}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => window.print()} className="btn-premium btn-primary shadow-xl bg-slate-800">
                        <FileText className="w-4 h-4" /> Export Report
                    </button>
                    <button className="btn-premium btn-ghost border-white/60">
                        Audit History
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <GlassCard className="p-8 group hover:scale-[1.02] transition-transform shadow-indigo-100">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
                            <Package className="w-6 h-6" />
                        </div>
                        <Activity className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Receipt Volume</span>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{totalReceived.toLocaleString()}</div>
                        <div className="text-[10px] font-black text-indigo-600 mt-2 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Aggregated Units
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-8 group hover:scale-[1.02] transition-transform shadow-rose-100">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <ShieldCheck className="w-4 h-4 text-slate-200 group-hover:text-rose-400 transition-colors" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Quality Deficiency</span>
                        <div className="text-4xl font-black text-rose-700 tracking-tighter">{totalRejected.toLocaleString()}</div>
                        <div className="text-[10px] font-black text-rose-500 mt-2 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Impacted Inventory
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-8 group hover:scale-[1.02] transition-transform shadow-blue-100">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600">
                            <ClipboardCheck className="w-6 h-6" />
                        </div>
                        <CheckCircle className="w-4 h-4 text-slate-200 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Verification Node</span>
                        <div className="text-xl font-black text-slate-800 tracking-tight mt-1 truncate">
                            {items[0]?.invoice_no ? `${items[0].invoice_no}` : "PENDING AUDIT"}
                        </div>
                        <div className="text-[10px] font-black text-blue-600 mt-3 uppercase tracking-widest">
                            {items[0]?.invoice_date ? `FINALIZED ${formatDate(items[0].invoice_date)}` : 'Awaiting Ledger Sync'}
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="heading-md uppercase tracking-widest text-slate-800">Inspection Manifest</h3>
                    <span className="badge-premium badge-indigo">{items.length} QUALITY NODES</span>
                </div>
                <div className="glass-panel overflow-x-auto">
                    <DenseTable
                        data={items}
                        columns={itemColumns}
                        className="bg-transparent"
                    />
                </div>
            </div>
        </div>
    );
}
