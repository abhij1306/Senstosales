"use client";

import { useState, useEffect } from 'react';
import {
    FileText, Download, Truck, Receipt,
    BarChart, AlertTriangle, RotateCw, Activity, Layers, ClipboardList, Calendar
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatIndianCurrency } from '@/lib/utils';
import GlassCard from "@/components/ui/GlassCard";
import { DenseTable } from "@/components/ui/DenseTable";

type ReportType = 'reconciliation' | 'sales' | 'dc_register' | 'invoice_register' | 'pending';

// Column Definitions
const reconciliationColumns = [
    { header: "PO Number", accessorKey: "po_number", cell: (row: any) => <span className="link text-sm">{row.po_number}</span> },
    { header: "Item No", accessorKey: "po_item_no", className: "w-[80px]" },
    { header: "Description", accessorKey: "item_description", className: "max-w-[400px] truncate text-xs text-slate-500" },
    { header: "Accepted", accessorKey: "total_accepted", className: "text-right text-emerald-600 font-semibold" },
    { header: "Rejected", accessorKey: "total_rejected", className: "text-right text-rose-600 font-semibold" },
];

const salesColumns = [
    { header: "Month", accessorKey: "month", className: "font-semibold text-slate-700" },
    { header: "Invoices", accessorKey: "invoice_count", className: "text-center" },
    { header: "Taxable Value", accessorKey: "total_taxable", className: "text-right text-slate-800 font-semibold", cell: (row: any) => formatIndianCurrency(row.total_taxable) },
    { header: "Total Value", accessorKey: "total_value", className: "text-right font-bold text-emerald-600", cell: (row: any) => formatIndianCurrency(row.total_value) },
];

const dcColumns = [
    { header: "DC Number", accessorKey: "dc_number", cell: (row: any) => <span className="link text-sm">DC-{row.dc_number}</span> },
    { header: "Date", accessorKey: "dc_date", cell: (row: any) => <span>{formatDate(row.dc_date)}</span> },
    { header: "PO Ref", accessorKey: "po_number" },
    { header: "Consignee", accessorKey: "consignee_name", className: "max-w-[250px] truncate" },
    { header: "Items", accessorKey: "item_count", className: "text-center" },
    { header: "Total Qty", accessorKey: "total_qty", className: "text-right font-bold" },
];

const invoiceColumns = [
    { header: "Invoice No", accessorKey: "invoice_number", cell: (row: any) => <span className="link text-sm">INV-{row.invoice_number}</span> },
    { header: "Date", accessorKey: "invoice_date", cell: (row: any) => <span>{formatDate(row.invoice_date)}</span> },
    { header: "Buyer", accessorKey: "buyer_name", className: "max-w-[250px] truncate" },
    { header: "Taxable", accessorKey: "taxable_value", className: "text-right font-semibold", cell: (row: any) => formatIndianCurrency(row.taxable_value) },
    { header: "Total Amount", accessorKey: "total_invoice_value", className: "text-right font-bold text-slate-900", cell: (row: any) => formatIndianCurrency(row.total_invoice_value) },
];

const pendingColumns = [
    { header: "PO Number", accessorKey: "po_number", className: "font-semibold", cell: (row: any) => `${row.po_number}` },
    { header: "Item", accessorKey: "po_item_no", className: "text-center" },
    { header: "Material", accessorKey: "material_description", className: "max-w-[300px] truncate text-xs text-slate-400" },
    { header: "Ordered", accessorKey: "ord_qty", className: "text-right font-semibold" },
    { header: "Delivered", accessorKey: "delivered_qty", className: "text-right text-emerald-600 font-semibold" },
    { header: "Pending", accessorKey: "pending_qty", className: "text-right font-bold text-amber-600" },
];

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<ReportType>('reconciliation');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [startDate, setStartDate] = useState<string>(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadReport();
    }, [activeTab, startDate, endDate]);

    const loadReport = async () => {
        setLoading(true);
        setData([]);
        try {
            const baseUrl = api.baseUrl || 'http://localhost:8000';
            let endpoint = '';
            const dateParams = `start_date=${startDate}&end_date=${endDate}`;

            switch (activeTab) {
                case 'reconciliation': endpoint = `/api/reports/reconciliation?${dateParams}`; break;
                case 'sales': endpoint = `/api/reports/sales?${dateParams}`; break;
                case 'dc_register': endpoint = `/api/reports/register/dc?${dateParams}`; break;
                case 'invoice_register': endpoint = `/api/reports/register/invoice?${dateParams}`; break;
                case 'pending': endpoint = `/api/reports/pending`; break;
            }

            const res = await fetch(`${baseUrl}${endpoint}`);
            if (!res.ok) throw new Error(`Server Error: ${res.status}`);
            const result = await res.json();
            setData(Array.isArray(result) ? result : []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const baseUrl = api.baseUrl || 'http://localhost:8000';
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
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6 space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="heading-xl">System Analysis</h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium italic">Deterministic ledger analysis and reporting</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExport} className="btn-premium btn-primary">
                        <Download className="w-4 h-4" />
                        Export Dataset
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex gap-2 p-1 bg-white/40 backdrop-blur-md rounded-xl border border-white/60 shadow-sm overflow-x-auto max-w-full">
                    {[
                        { id: 'reconciliation', label: 'Ledger Audit', icon: Activity },
                        { id: 'sales', label: 'Sales Growth', icon: BarChart },
                        { id: 'dc_register', label: 'DC Register', icon: Truck },
                        { id: 'invoice_register', label: 'Invoice Register', icon: Receipt },
                        { id: 'pending', label: 'Shortages', icon: AlertTriangle },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setData([]);
                                setActiveTab(tab.id as ReportType);
                            }}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all
                                ${activeTab === tab.id
                                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-100/50'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}
                            `}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className={`flex items-center gap-3 bg-white/40 p-1.5 rounded-xl border border-white/60 shadow-sm transition-all duration-300 ${activeTab === 'pending' ? "opacity-20 pointer-events-none" : ""}`}>
                    <div className="flex items-center gap-3 px-3 py-1.5 bg-white rounded-lg border border-slate-100/50 shadow-inner">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-xs font-bold bg-transparent outline-none text-slate-700 w-[110px]"
                        />
                        <span className="text-slate-300 font-bold">→</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-xs font-bold bg-transparent outline-none text-slate-700 w-[110px]"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="heading-md flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-500" />
                        {activeTab.replace('_', ' ').toUpperCase()} DATASET
                    </h2>
                    <div className="flex items-center gap-3 text-xs font-bold">
                        {loading && (
                            <div className="flex items-center gap-2 text-blue-600 animate-pulse">
                                <RotateCw className="w-3 h-3 animate-spin" />
                                Synchronizing...
                            </div>
                        )}
                        <span className="badge-premium badge-blue">
                            {data?.length || 0} RECORDS
                        </span>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden">
                    <DenseTable
                        loading={loading}
                        data={data}
                        columns={activeColumns}
                        className="bg-transparent border-none"
                    />
                </div>
            </div>
        </div>
    );
}
