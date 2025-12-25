"use client";

import { useState, useEffect } from 'react';
import {
    FileText, Download, Truck, Receipt,
    BarChart, AlertTriangle, Activity, ClipboardList, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { formatDate, formatIndianCurrency } from '@/lib/utils';
import { ReportsPageTemplate } from '@/components/design-system/templates/ReportsPageTemplate';
import { Button } from '@/components/design-system/atoms/Button';
import { Accounting, Body, TableText } from '@/components/design-system';
import type { Column } from '@/components/design-system';

type ReportType = 'reconciliation' | 'sales' | 'dc_register' | 'invoice_register' | 'pending';

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
            const finalData = Array.isArray(result) ? result.map((item: any) => {
                if (activeTab === 'reconciliation' || activeTab === 'pending') {
                    return { ...item, unique_id: `${item.po_number}-${item.po_item_no}` };
                }
                return item;
            }) : [];
            setData(finalData);
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

    // Column definitions - PRESERVED FROM ORIGINAL
    const reconciliationColumns: Column<any>[] = [
        { key: "po_number", label: "PO NUMBER", render: (_v, row) => <Body className="text-[#1A3D7C] font-medium">{row.po_number}</Body> },
        { key: "po_item_no", label: "ITEM NO", width: "80px", render: (_v, row) => <Accounting>{row.po_item_no}</Accounting> },
        { key: "item_description", label: "DESCRIPTION", render: (_v, row) => <TableText className="text-slate-600 truncate max-w-[400px] block">{row.item_description}</TableText> },
        { key: "total_accepted", label: "ACCEPTED", align: "right", render: (_v, row) => <Accounting className="text-[#16A34A] font-medium">{row.total_accepted}</Accounting> },
        { key: "total_rejected", label: "REJECTED", align: "right", render: (_v, row) => <Accounting className="text-[#DC2626] font-medium">{row.total_rejected}</Accounting> },
    ];

    const salesColumns: Column<any>[] = [
        { key: "month", label: "MONTH", render: (_v, row) => <Body className="font-medium text-slate-950">{row.month}</Body> },
        { key: "invoice_count", label: "INVOICES", align: "center", render: (_v, row) => <Accounting>{row.invoice_count}</Accounting> },
        { key: "total_taxable", label: "TAXABLE VALUE", align: "right", render: (_v, row) => <Accounting isCurrency className="text-slate-900 font-medium">{row.total_taxable}</Accounting> },
        { key: "total_value", label: "TOTAL VALUE", align: "right", render: (_v, row) => <Accounting isCurrency className="font-medium text-[#16A34A]">{row.total_value}</Accounting> },
    ];

    const dcColumns: Column<any>[] = [
        { key: "dc_number", label: "DC NUMBER", render: (_v, row) => <Body className="text-[#1A3D7C] font-medium">DC-{row.dc_number}</Body> },
        { key: "dc_date", label: "DATE", render: (_v, row) => <Body>{formatDate(row.dc_date)}</Body> },
        { key: "po_number", label: "PO REF" },
        { key: "consignee_name", label: "CONSIGNEE", render: (_v, row) => <Body className="max-w-[250px] truncate block">{row.consignee_name}</Body> },
        { key: "item_count", label: "ITEMS", align: "center", render: (_v, row) => <Accounting>{row.item_count}</Accounting> },
        { key: "total_qty", label: "TOTAL QTY", align: "right", render: (_v, row) => <Accounting className="font-medium">{row.total_qty}</Accounting> },
    ];

    const invoiceColumns: Column<any>[] = [
        { key: "invoice_number", label: "INVOICE NO", render: (_v, row) => <Body className="text-[#1A3D7C] font-medium">INV-{row.invoice_number}</Body> },
        { key: "invoice_date", label: "DATE", render: (_v, row) => <Body>{formatDate(row.invoice_date)}</Body> },
        { key: "buyer_name", label: "BUYER", render: (_v, row) => <Body className="max-w-[250px] truncate block">{row.buyer_name}</Body> },
        { key: "taxable_value", label: "TAXABLE", align: "right", render: (_v, row) => <Accounting isCurrency className="font-medium">{row.taxable_value}</Accounting> },
        { key: "total_invoice_value", label: "TOTAL AMOUNT", align: "right", render: (_v, row) => <Accounting isCurrency className="font-medium text-slate-950">{row.total_invoice_value}</Accounting> },
    ];

    const pendingColumns: Column<any>[] = [
        { key: "po_number", label: "PO NUMBER", render: (_v, row) => <Body className="font-medium text-slate-950">{row.po_number}</Body> },
        { key: "po_item_no", label: "ITEM", align: "center", render: (_v, row) => <Accounting>{row.po_item_no}</Accounting> },
        { key: "material_description", label: "MATERIAL", render: (_v, row) => <TableText className="max-w-[300px] truncate text-slate-500 block">{row.material_description}</TableText> },
        { key: "ord_qty", label: "ORDERED", align: "right", render: (_v, row) => <Accounting className="font-medium">{row.ord_qty}</Accounting> },
        { key: "delivered_qty", label: "DELIVERED", align: "right", render: (_v, row) => <Accounting className="text-[#16A34A] font-medium">{row.delivered_qty}</Accounting> },
        { key: "pending_qty", label: "SHORTAGE", align: "right", render: (_v, row) => <Accounting className="font-medium text-[#F59E0B]">{row.pending_qty}</Accounting> },
    ];

    // KPI Calculation Logic
    const calculateKPIs = () => {
        if (!data || data.length === 0) return [];

        switch (activeTab) {
            case 'reconciliation':
                const totalOrd = data.reduce((sum, r) => sum + (r.ordered_qty || 0), 0);
                const totalAcc = data.reduce((sum, r) => sum + (r.total_accepted || 0), 0);
                const totalRej = data.reduce((sum, r) => sum + (r.total_rejected || 0), 0);
                return [
                    { label: "TOTAL ORDERED", value: totalOrd, type: 'number', icon: <ClipboardList size={20} />, color: '#1A3D7C' },
                    { label: "TOTAL ACCEPTED", value: totalAcc, type: 'number', icon: <Activity size={20} />, color: '#16A34A', trend: { value: 12, isPositive: true } },
                    { label: "TOTAL REJECTED", value: totalRej, type: 'number', icon: <AlertTriangle size={20} />, color: '#DC2626' }
                ];
            case 'sales':
                const totalTaxableValue = data.reduce((sum, r) => sum + (r.total_taxable || 0), 0);
                const totalGross = data.reduce((sum, r) => sum + (r.total_value || 0), 0);
                const invCount = data.reduce((sum, r) => sum + (r.invoice_count || 0), 0);
                return [
                    { label: "REVENUE GROWTH", value: totalTaxableValue, type: 'currency', icon: <BarChart size={20} />, color: '#1A3D7C', trend: { value: 8.4, isPositive: true } },
                    { label: "GROSS TURNOVER", value: totalGross, type: 'currency', icon: <Receipt size={20} />, color: '#16A34A' },
                    { label: "TOTAL INVOICES", value: invCount, type: 'number', icon: <FileText size={20} />, color: '#6366F1' }
                ];
            case 'dc_register':
                const totalDispatchQty = data.reduce((sum, r) => sum + (r.total_qty || 0), 0);
                const uniquePOs = new Set(data.map(d => d.po_number)).size;
                return [
                    { label: "TOTAL DISPATCHED", value: totalDispatchQty, type: 'number', icon: <Truck size={20} />, color: '#1A3D7C' },
                    { label: "UNIQUE POs", value: uniquePOs, type: 'number', icon: <ClipboardList size={20} />, color: '#6366F1' },
                    { label: "ACTIVE CHALLANS", value: data.length, type: 'number', icon: <Activity size={20} />, color: '#16A34A' }
                ];
            case 'pending':
                const totalPendingQty = data.reduce((sum, r) => sum + (r.pending_qty || 0), 0);
                const highShortageItem = data.reduce((prev, curr) => (prev.pending_qty > curr.pending_qty) ? prev : curr, data[0]);
                return [
                    { label: "TOTAL SHORTAGE", value: totalPendingQty, type: 'number', icon: <AlertTriangle size={20} />, color: '#DC2626' },
                    { label: "HIGHEST SHORTAGE", value: highShortageItem?.pending_qty || 0, type: 'number', icon: <Activity size={20} />, subtitle: highShortageItem?.po_number?.toString(), color: '#F59E0B' },
                    { label: "PENDING ITEMS", value: data.length, type: 'number', icon: <ClipboardList size={20} />, color: '#1A3D7C' }
                ];
            default:
                return [];
        }
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

    // Custom tabs component for report types - REFINED AESTHETICS
    const customTabs = (
        <div className="flex gap-2 p-1.5 bg-slate-100/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-inner overflow-x-auto">
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
                        setActiveTab(tab.id as ReportType);
                    }}
                    className={`
                        flex items-center gap-2.5 px-5 py-2 rounded-xl text-[11px] font-bold tracking-tight uppercase transition-all duration-300
                        ${activeTab === tab.id
                            ? 'bg-white text-[#1A3D7C] shadow-md shadow-[#1A3D7C]/5 ring-1 ring-[#1A3D7C]/10 scale-[1.02]'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'}
                    `}
                >
                    <tab.icon size={14} className={activeTab === tab.id ? "text-[#1A3D7C]" : "text-slate-400"} />
                    {tab.label}
                </button>
            ))
            }
        </div >
    );

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
            >
                <ReportsPageTemplate
                    title="System Insights"
                    subtitle="Real-time multi-dimensional ledger analytics"
                    toolbar={{
                        startDate,
                        endDate,
                        onDateChange: (start, end) => {
                            setStartDate(start);
                            setEndDate(end);
                        },
                        module: activeTab,
                        modules: [],
                        onModuleChange: () => { },
                        onExport: handleExport,
                        loading,
                    }}
                    kpiCards={calculateKPIs() as any}
                    tableTitle={
                        <div className="flex items-center gap-4 py-2">
                            <div className="w-1 h-8 bg-blue-600 rounded-full hidden md:block" />
                            {customTabs}
                        </div>
                    }
                    columns={activeColumns}
                    data={data}
                    keyField={
                        activeTab === 'sales' ? 'month' :
                            (activeTab === 'reconciliation' || activeTab === 'pending') ? 'unique_id' :
                                `${activeTab.split('_')[0]}_number`
                    }
                    loading={loading}
                    emptyMessage={`No ${activeTab.replace('_', ' ')} data discovered for specified range`}
                />
            </motion.div>
        </AnimatePresence>
    );
}
