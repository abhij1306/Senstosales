"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, InvoiceListItem, InvoiceStats } from "@/lib/api";
import { Plus, Search, Filter, Download, ListFilter, TrendingUp, AlertCircle, FileText, Calendar as CalendarIcon, Hash } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { DenseTable } from "@/components/ui/DenseTable";
import { formatIndianCurrency } from "@/lib/utils";

export default function InvoicePage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
    const [stats, setStats] = useState<InvoiceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Statuses");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invoicesData, statsData] = await Promise.all([
                    api.listInvoices(),
                    api.getInvoiceStats()
                ]);
                setInvoices(invoicesData);
                setStats(statsData);
            } catch (err) {
                console.error("Failed to load invoice data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch =
            inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.customer_gstin && inv.customer_gstin.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    const columns = [
        {
            header: "Invoice #",
            accessorKey: "invoice_number" as keyof InvoiceListItem,
            cell: (inv: InvoiceListItem) => (
                <div className="font-medium text-blue-600 hover:text-blue-800 transition-colors">{inv.invoice_number}</div>
            )
        },
        {
            header: "Date",
            accessorKey: "invoice_date" as keyof InvoiceListItem,
            cell: (inv: InvoiceListItem) => <span className="text-slate-600 font-medium text-xs">{formatDate(inv.invoice_date)}</span>
        },
        {
            header: "Linked DC",
            accessorKey: "linked_dc_numbers" as keyof InvoiceListItem,
            cell: (inv: InvoiceListItem) => (
                <div className="flex flex-wrap gap-1">
                    {inv.linked_dc_numbers ? inv.linked_dc_numbers.split(',').map((dc, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded font-medium text-[10px]">
                            {dc.trim()}
                        </span>
                    )) : <span className="text-slate-300">-</span>}
                </div>
            )
        },
        {
            header: "Total Value",
            accessorKey: "total_invoice_value" as keyof InvoiceListItem,
            className: "text-right font-medium text-slate-700 tabular-nums",
            cell: (inv: InvoiceListItem) => `₹${inv.total_invoice_value?.toLocaleString('en-IN') || '0'}`
        },
        {
            header: "Status",
            accessorKey: "invoice_number" as keyof InvoiceListItem, // Mock status
            className: "text-right",
            cell: () => <StatusBadge status="Issued" variant="success" className="ml-auto scale-90" />
        }
    ];

    if (loading) return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-6 flex items-center justify-center text-slate-400 font-medium animate-pulse">
            Loading GST Invoices...
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">GST Invoices</h1>
                    <p className="text-xs text-slate-500 mt-1">Tax invoice management</p>
                </div>
                <button
                    onClick={() => router.push('/invoice/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20 text-xs font-semibold"
                >
                    <Plus className="w-4 h-4" />
                    New Invoice
                </button>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card variant="glass" padding="none" className="p-4 flex flex-col justify-between h-[90px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Invoiced</span>
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[28px] font-bold text-slate-800">{formatIndianCurrency(stats.total_invoiced)}</div>
                            <div className="text-[10px] text-emerald-600 font-medium">+ {stats.total_invoiced_change}% vs last month</div>
                        </div>
                    </Card>

                    <Card variant="glass" padding="none" className="p-4 flex flex-col justify-between h-[90px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GST Collected</span>
                            <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[28px] font-bold text-slate-800">{formatIndianCurrency(stats.gst_collected)}</div>
                            <div className="text-[10px] text-blue-600 font-medium">+ {stats.gst_collected_change}% vs last month</div>
                        </div>
                    </Card>

                    <Card variant="glass" padding="none" className="p-4 flex flex-col justify-between h-[90px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</span>
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[28px] font-bold text-slate-800">{formatIndianCurrency(stats.pending_payments)}</div>
                            <div className="text-[10px] text-amber-600 font-medium">{stats.pending_payments_count.toLocaleString('en-IN')} Unpaid Invoices</div>
                        </div>
                    </Card>
                </div>
            )}

            <Card variant="glass" padding="sm" className="flex gap-2 items-center sticky top-2 z-10">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search Invoice # or GSTIN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-white/60 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="p-1.5 text-slate-500 bg-white/60 border border-slate-200 rounded-lg hover:bg-white hover:text-blue-600 transition-colors" title="Download Report">
                        <Download className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-500 bg-white/60 border border-slate-200 rounded-lg hover:bg-white hover:text-blue-600 transition-colors" title="Filter">
                        <ListFilter className="w-4 h-4" />
                    </button>
                </div>
            </Card>

            <DenseTable
                loading={loading}
                data={filteredInvoices}
                columns={columns}
                className="bg-white/40 shadow-sm backdrop-blur-sm min-h-[500px] border border-white/20 rounded-xl"
                onRowClick={(inv) => router.push(`/invoice/view?id=${inv.invoice_number}`)}
            />
        </div>
    );
}
