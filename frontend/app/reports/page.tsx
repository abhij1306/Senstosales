"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText, Download, Percent, Package, Truck, Receipt,
    BarChart, AlertTriangle, RotateCw, Activity, Layers, Calendar, ClipboardList
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import GlassCard from "@/components/ui/GlassCard";
import { DenseTable } from "@/components/ui/DenseTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
// ReconciliationBadge import removed

type ReportType = 'reconciliation' | 'sales' | 'dc_register' | 'invoice_register' | 'pending';

// Column Definitions - Moved outside for stability
const reconciliationColumns = [
    { header: "PO Number", accessorKey: "po_number", cell: (row: any) => <span className="font-medium text-blue-600">{row.po_number}</span> },
    { header: "Item No", accessorKey: "po_item_no", className: "w-[80px]" },
    { header: "Description", accessorKey: "item_description", className: "max-w-[200px] truncate text-xs text-slate-500" },
    { header: "Accepted", accessorKey: "total_accepted", className: "text-right text-emerald-600 font-medium" },
    { header: "Rejected", accessorKey: "total_rejected", className: "text-right text-red-600 font-medium" },
];

const salesColumns = [
    { header: "Month", accessorKey: "month", className: "font-medium text-slate-700" },
    { header: "Invoices", accessorKey: "invoice_count", className: "text-center" },
    { header: "Taxable Value", accessorKey: "total_taxable", className: "text-right text-slate-600 font-medium", cell: (row: any) => (row.total_taxable || 0).toLocaleString('en-IN') },
    { header: "Total Value", accessorKey: "total_value", className: "text-right font-medium text-emerald-700", cell: (row: any) => (row.total_value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) },
];

const dcColumns = [
    { header: "DC Number", accessorKey: "dc_number", cell: (row: any) => <span className="font-medium text-purple-600">{row.dc_number}</span> },
    { header: "Date", accessorKey: "dc_date", cell: (row: any) => <span>{formatDate(row.dc_date)}</span> },
    { header: "PO Ref", accessorKey: "po_number" },
    { header: "Consignee", accessorKey: "consignee_name", className: "max-w-[200px] truncate" },
    { header: "Items", accessorKey: "item_count", className: "text-center" },
    { header: "Total Qty", accessorKey: "total_qty", className: "text-right font-medium" },
];

const invoiceColumns = [
    { header: "Invoice No", accessorKey: "invoice_number", cell: (row: any) => <span className="font-medium text-emerald-600">{row.invoice_number}</span> },
    { header: "Date", accessorKey: "invoice_date", cell: (row: any) => <span>{formatDate(row.invoice_date)}</span> },
    { header: "Buyer", accessorKey: "buyer_name", className: "max-w-[200px] truncate" },
    { header: "Taxable", accessorKey: "taxable_value", className: "text-right font-medium" },
    { header: "Total Amount", accessorKey: "total_invoice_value", className: "text-right font-medium text-slate-900" },
];

const pendingColumns = [
    { header: "PO Number", accessorKey: "po_number", className: "font-medium" },
    { header: "Item", accessorKey: "po_item_no", className: "text-center" },
    { header: "Material", accessorKey: "material_description", className: "max-w-[250px] truncate text-xs text-slate-500" },
    { header: "Ordered", accessorKey: "ord_qty", className: "text-right font-medium" },
    { header: "Delivered", accessorKey: "delivered_qty", className: "text-right text-emerald-600 font-medium" },
    { header: "Pending", accessorKey: "pending_qty", className: "text-right font-medium text-amber-600" },
];

export default function ReportsPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<ReportType>('reconciliation');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Date Filters
    const [startDate, setStartDate] = useState<string>(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadReport();
    }, [activeTab, startDate, endDate]);

    const loadReport = async () => {
        setLoading(true);
        setData([]); // Clear data to prevent mismatch
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            let endpoint = '';
            const dateParams = `start_date=${startDate}&end_date=${endDate}`;

            switch (activeTab) {
                case 'reconciliation': endpoint = `/api/reports/reconciliation?${dateParams}`; break;
                case 'sales': endpoint = `/api/reports/sales?${dateParams}`; break;
                case 'dc_register': endpoint = `/api/reports/register/dc?${dateParams}`; break;
                case 'invoice_register': endpoint = `/api/reports/register/invoice?${dateParams}`; break;
                case 'pending': endpoint = `/api/reports/pending`; break;
                default:
                    console.warn(`Unknown tab: ${activeTab}`);
                    return;
            }

            const fullUrl = `${baseUrl}${endpoint}`;
            console.log(`Fetching report [${activeTab}]:`, fullUrl);

            const res = await fetch(fullUrl);
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Server returned ${res.status}: ${errText}`);
            }
            const result = await res.json();
            setData(result);
        } catch (err: any) {
            console.error("Report Fetch Error:", err);
            toast("Connection Error", `Failed to load report: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        let endpoint = '';
        const dateParams = `start_date=${startDate}&end_date=${endDate}`;

        switch (activeTab) {
            case 'reconciliation': endpoint = `/api/reports/reconciliation`; break;
            case 'sales': endpoint = `/api/reports/sales`; break;
            case 'dc_register': endpoint = `/api/reports/register/dc`; break;
            case 'invoice_register': endpoint = `/api/reports/register/invoice`; break;
            case 'pending': endpoint = `/api/reports/pending`; break;
        }

        window.open(`${baseUrl}${endpoint}?export=true&${dateParams}`, '_blank');
        toast("Export Started", "Your Excel file is downloading...");
    };

    const activeColumns = (() => {
        switch (activeTab) {
            case 'reconciliation': return reconciliationColumns;
            case 'sales': return salesColumns;
            case 'dc_register': return dcColumns;
            case 'invoice_register': return invoiceColumns;
            case 'pending': return pendingColumns;
            default: return [];
        }
    })();


    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-4 md:p-6 space-y-6 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Reports</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Deterministic ledger analysis and registers</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Export Excel
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                    {[
                        { id: 'reconciliation', label: 'Reconciliation', icon: Layers },
                        { id: 'sales', label: 'Sales Summary', icon: BarChart },
                        { id: 'dc_register', label: 'DC Register', icon: Truck },
                        { id: 'invoice_register', label: 'Invoice Register', icon: Receipt },
                        { id: 'pending', label: 'Pending Items', icon: AlertTriangle },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ReportType)}
                            className={`
                                flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border border-transparent
                                ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white/50 text-slate-600 hover:bg-white hover:text-slate-900 border-slate-200/50'}
                            `}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Date Controls */}
                <div className={`flex items-center gap-2 bg-white/60 p-1.5 rounded-xl border border-white/20 shadow-sm transition-all duration-300 ${activeTab === 'pending' ? "opacity-30 pointer-events-none grayscale" : ""}`}>
                    <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Range</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-xs font-medium bg-transparent outline-none text-slate-700"
                        />
                        <span className="text-slate-300">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-xs font-medium bg-transparent outline-none text-slate-700"
                        />
                    </div>
                </div>
            </div>

            <GlassCard className="p-0 overflow-hidden min-h-[500px] relative">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                        <ClipboardList className="w-4 h-4 text-blue-500" />
                        Report Data
                    </h3>
                    <div className="flex items-center gap-3">
                        {loading && (
                            <div className="flex items-center gap-2 text-xs text-blue-600 animate-pulse">
                                <RotateCw className="w-3 h-3 animate-spin" />
                                <span>Updating...</span>
                            </div>
                        )}
                        <span className="text-xs text-slate-400 font-medium">
                            {data.length} records found
                        </span>
                    </div>
                </div>

                <div className="opacity-100 transition-opacity duration-200">
                    <DenseTable
                        loading={loading}
                        data={data}
                        columns={activeColumns}
                        className="w-full border-none shadow-none rounded-none"
                    />
                </div>
            </GlassCard>
        </div>
    );
}

