"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, InvoiceListItem, InvoiceStats } from "@/lib/api";
import { Plus, Search, Download, TrendingUp, AlertCircle, FileText, Activity, Layers, Receipt } from "lucide-react";
import { formatDate, formatIndianCurrency } from "@/lib/utils";
import GlassCard from "@/components/ui/GlassCard";
import { DenseTable } from "@/components/ui/DenseTable";

export default function InvoicePage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
    const [stats, setStats] = useState<InvoiceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [invoicesData, statsData] = await Promise.all([
                    api.listInvoices(),
                    api.getInvoiceStats()
                ]);
                setInvoices(invoicesData || []);
                setStats(statsData);
            } catch (err) {
                console.error("Invoice Load Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.customer_gstin && inv.customer_gstin.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const columns = [
        {
            header: "Invoice ID",
            accessorKey: "invoice_number" as keyof InvoiceListItem,
            cell: (inv: InvoiceListItem) => (
                <div onClick={() => router.push(`/invoice/view?id=${encodeURIComponent(inv.invoice_number)}`)} className="link font-bold text-sm">{inv.invoice_number}</div>
            )
        },
        {
            header: "Billing Date",
            accessorKey: "invoice_date" as keyof InvoiceListItem,
            cell: (inv: InvoiceListItem) => <span className="text-meta font-bold uppercase">{formatDate(inv.invoice_date)}</span>
        },
        {
            header: "Linked PO",
            accessorKey: "po_numbers" as keyof InvoiceListItem,
            cell: (inv: InvoiceListItem) => (
                <div className="flex flex-col gap-0.5">
                    {inv.po_numbers ? inv.po_numbers.split(',').map((po, i) => (
                        <span key={i} className="text-xs font-bold text-slate-600 hover:text-blue-600 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); router.push(`/po/view?id=${po.trim()}`) }}>
                            PO #{po.trim()}
                        </span>
                    )) : <span className="text-slate-300 italic text-[10px]">N/A</span>}
                </div>
            )
        },
        {
            header: "Linked DC",
            accessorKey: "linked_dc_numbers" as keyof InvoiceListItem,
            cell: (inv: InvoiceListItem) => (
                <div className="flex flex-wrap gap-1.5">
                    {inv.linked_dc_numbers ? inv.linked_dc_numbers.split(',').map((dc, i) => (
                        <span key={i} className="badge-premium badge-rose opacity-80" title="Delivery Challan">
                            {dc.trim()}
                        </span>
                    )) : <span className="text-slate-300 italic text-[10px]">DIRECT</span>}
                </div>
            )
        },
        {
            header: "Final Amount",
            accessorKey: "total_invoice_value" as keyof InvoiceListItem,
            className: "text-right",
            cell: (inv: InvoiceListItem) => (
                <span className="text-accounting font-bold text-slate-800">
                    {formatIndianCurrency(inv.total_invoice_value)}
                </span>
            )
        },
        {
            header: "Finance Status",
            accessorKey: "invoice_number" as keyof InvoiceListItem,
            className: "text-right",
            cell: () => <span className="badge-premium badge-emerald">ISSUED</span>
        },
        {
            header: "",
            accessorKey: "invoice_number" as keyof InvoiceListItem,
            className: "w-10",
            cell: (inv: InvoiceListItem) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        window.open(`${api.baseUrl}/api/invoice/${inv.invoice_number}/download`, '_blank');
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Export Ledger"
                >
                    <Download className="w-4 h-4" />
                </button>
            )
        }
    ];

    if (loading) return <div className="p-32 text-center animate-pulse text-blue-500 font-bold uppercase tracking-widest text-xs">Synchronizing Financial Core...</div>;

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="heading-xl flex items-center gap-4">
                        <Receipt className="w-8 h-8 text-blue-600" />
                        Billing & Revenue
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">Execute tax compliant invoices and track financial growth</p>
                </div>
                <button
                    onClick={() => router.push('/invoice/create')}
                    className="btn-premium btn-primary shadow-xl"
                >
                    <Plus className="w-4 h-4" />
                    Generate Invoice
                </button>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <KpiCard title="Revenue Flow" value={formatIndianCurrency(stats.total_invoiced)} icon={TrendingUp} color="blue" trend={`+ ${stats.total_invoiced_change}% Growth`} />
                    <KpiCard title="Tax Aggregate" value={formatIndianCurrency(stats.gst_collected)} icon={FileText} color="indigo" trend="Compliant" />
                    <KpiCard title="Liquidity Gap" value={formatIndianCurrency(stats.pending_payments)} icon={AlertCircle} color="amber" trend={`${stats.pending_payments_count} Unpaid`} />
                </div>
            )}

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
                    <h2 className="heading-md uppercase tracking-wider text-slate-800">Financial Inventory</h2>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="SEARCH BY ID OR GSTIN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-premium pl-12 font-bold uppercase tracking-widest text-[10px]"
                        />
                    </div>
                </div>

                <div className="glass-panel overflow-hidden">
                    <DenseTable
                        loading={loading}
                        data={filteredInvoices}
                        columns={columns}
                        onRowClick={(inv) => router.push(`/invoice/view?id=${encodeURIComponent(inv.invoice_number)}`)}
                        className="bg-transparent border-none rounded-none"
                    />
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <GlassCard className="p-6 h-[110px] flex flex-col justify-between group border-white/60">
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-label uppercase opacity-60 m-0">{title}</span>
                    <div className="text-xl font-black text-slate-800 tracking-tighter mt-1 group-hover:text-blue-600 transition-colors uppercase">{value}</div>
                </div>
                <div className={`p-2 rounded-xl bg-${color}-50/50 border border-${color}-100 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-4 h-4 text-${color}-600`} />
                </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase mt-2">
                <Activity className="w-3 h-3" /> {trend}
            </div>
        </GlassCard>
    );
}
