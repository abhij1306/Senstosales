/**
 * REPORTS PAGE - PO-CENTRIC WITH AI-POWERED INSIGHTS
 * 
 * PRIMARY ENTITY: Purchase Orders (not invoices)
 * REPORTS: Computed aggregations displayed on this page
 * AI: LLM-generated summaries from real data
 * NO NAVIGATION SHORTCUTS
 */

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText, Calendar, DollarSign, Package, AlertTriangle,
    Loader2, Percent, Clock, TrendingUp, Users, BarChart3, Activity
} from 'lucide-react';
import POHealthReport from '@/components/reports/POHealthReport';
import POAgingReport from '@/components/reports/POAgingReport';
import POEfficiencyReport from '@/components/reports/POEfficiencyReport';
import PODependencyReport from '@/components/reports/PODependencyReport';
import DateSummaryControls from '@/components/reports/DateSummaryControls';
import PODateSummary from '@/components/reports/PODateSummary';
import ChallanDateSummary from '@/components/reports/ChallanDateSummary';
import InvoiceDateSummary from '@/components/reports/InvoiceDateSummary';

interface KPIResponse {
    efficiency_pct: number;
    sales_total: number;
    pending_qty: number;
    avg_lag_days: number;
    alerts: {
        uninvoiced_dcs: number;
        overdue_pos: number;
    };
}

type ReportType = 'po_health' | 'po_aging' | 'po_efficiency' | 'po_dependency' | null;

export default function SmartReportsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month');
    const [kpis, setKpis] = useState<KPIResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Report state
    const [activeReport, setActiveReport] = useState<ReportType>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [aiSummary, setAiSummary] = useState('');

    // Date-wise summary state
    const [dateSummaryData, setDateSummaryData] = useState<any>(null);
    const [dateSummaryLoading, setDateSummaryLoading] = useState(false);
    const [dateSummaryEntity, setDateSummaryEntity] = useState('');
    const [dateSummaryParams, setDateSummaryParams] = useState<{ entity: string; startDate: string; endDate: string } | null>(null);

    useEffect(() => {
        loadData();

        // Reset report view when navigating to /reports
        const handleResetReports = () => {
            setActiveReport(null);
            setReportData(null);
            setAiSummary('');
        };

        window.addEventListener('reset-reports', handleResetReports);
        return () => window.removeEventListener('reset-reports', handleResetReports);
    }, [dateRange]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://localhost:8000/api/smart-reports/kpis?period=${dateRange}`);
            if (!res.ok) throw new Error('Failed to fetch KPIs');
            const data = await res.json();
            setKpis(data);
        } catch (err) {
            console.error("Failed to load data:", err);
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const loadReport = async (reportType: ReportType) => {
        if (!reportType) return;

        setReportLoading(true);
        setActiveReport(reportType);
        setAiSummary('');

        try {
            // Map report type to endpoint
            const endpointMap: Record<string, string> = {
                'po_health': 'po-health-summary',
                'po_aging': 'po-aging-risk',
                'po_efficiency': 'po-fulfillment-efficiency',
                'po_dependency': 'po-dependency-analysis'
            };

            const endpoint = endpointMap[reportType];
            const res = await fetch(`http://localhost:8000/api/ai-reports/${endpoint}?period=${dateRange}`);
            if (!res.ok) throw new Error('Failed to fetch report');
            const data = await res.json();
            setReportData(data);

            // Generate AI summary
            const summaryRes = await fetch('http://localhost:8000/api/ai-reports/generate-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_type: reportType,
                    period: dateRange,
                    data: data
                })
            });

            if (summaryRes.ok) {
                const summaryData = await summaryRes.json();
                setAiSummary(summaryData.summary || '');
            }
        } catch (err) {
            console.error("Failed to load report:", err);
            setError("Failed to load report");
        } finally {
            setReportLoading(false);
        }
    };

    const handleGeneratePDF = () => {
        // TODO: Implement PDF generation
        alert('PDF generation coming soon');
    };

    const handleViewDateSummary = async (entity: string, startDate: string, endDate: string) => {
        setDateSummaryLoading(true);
        setDateSummaryEntity(entity);
        setDateSummaryParams({ entity, startDate, endDate });

        try {
            const res = await fetch(
                `http://localhost:8000/api/smart-reports/date-summary?entity=${entity}&start_date=${startDate}&end_date=${endDate}`
            );
            if (!res.ok) throw new Error('Failed to fetch date summary');
            const data = await res.json();
            setDateSummaryData(data);
        } catch (err) {
            console.error("Failed to load date summary:", err);
            setError("Failed to load date summary");
            setDateSummaryData(null);
        } finally {
            setDateSummaryLoading(false);
        }
    };

    const handleExportDateSummary = () => {
        if (!dateSummaryParams) return;

        const { entity, startDate, endDate } = dateSummaryParams;
        const url = `http://localhost:8000/api/smart-reports/date-summary/export?entity=${entity}&start_date=${startDate}&end_date=${endDate}`;

        // Trigger download
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !kpis) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
                    <p className="text-text-primary font-medium">Failed to load reports</p>
                    <button
                        onClick={loadData}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const totalAlerts = kpis.alerts.uninvoiced_dcs + kpis.alerts.overdue_pos;

    // PO-CENTRIC sample queries (AI-generated for quick reference)
    const sampleQueries = [
        { text: "Show PO health summary", icon: Activity, action: () => loadReport('po_health') },
        { text: "Which POs are most delayed?", icon: Clock, action: () => loadReport('po_aging') },
        { text: "POs with zero dispatch", icon: Package, action: () => loadReport('po_efficiency') },
        { text: "Which POs are blocking billing?", icon: BarChart3, action: () => loadReport('po_dependency') },
        { text: "Show pending quantity breakdown", icon: TrendingUp, action: () => loadReport('po_health') },
        { text: "Identify dispatch bottlenecks", icon: AlertTriangle, action: () => loadReport('po_dependency') },
    ];

    // If a report is active, show it
    if (activeReport && reportData) {
        return (
            <div className="space-y-6">
                {/* Back button */}
                <button
                    onClick={() => {
                        setActiveReport(null);
                        setReportData(null);
                        setAiSummary('');
                    }}
                    className="text-[13px] text-primary hover:underline"
                >
                    ← Back to Dashboard
                </button>

                {/* Report Display */}
                {reportLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {activeReport === 'po_health' && (
                            <POHealthReport
                                data={reportData}
                                aiSummary={aiSummary}
                                onGeneratePDF={handleGeneratePDF}
                            />
                        )}
                        {activeReport === 'po_aging' && (
                            <POAgingReport
                                data={reportData}
                                aiSummary={aiSummary}
                                onGeneratePDF={handleGeneratePDF}
                            />
                        )}
                        {activeReport === 'po_efficiency' && (
                            <POEfficiencyReport
                                data={reportData}
                                aiSummary={aiSummary}
                                onGeneratePDF={handleGeneratePDF}
                            />
                        )}
                        {activeReport === 'po_dependency' && (
                            <PODependencyReport
                                data={reportData}
                                aiSummary={aiSummary}
                                onGeneratePDF={handleGeneratePDF}
                            />
                        )}
                    </>
                )}
            </div>
        );
    }

    // Default dashboard view
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[20px] font-semibold text-text-primary tracking-tight">Smart Reports & AI Assistant</h1>
                    <p className="text-[13px] text-text-secondary mt-1">PO-centric analytics with AI-powered insights</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary glass-card px-3 py-1.5 rounded-lg">
                    <Calendar className="w-4 h-4" />
                    <span>Period:</span>
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="font-medium text-text-primary bg-transparent border-none outline-none cursor-pointer"
                    >
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="glass-card p-4 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Efficiency</p>
                        <div className="p-2 bg-blue-50 rounded-lg text-primary">
                            <Percent className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-[22px] font-bold text-text-primary">{kpis.efficiency_pct}%</h3>
                    <p className="text-[10px] text-text-secondary mt-1">dispatch rate</p>
                </div>

                <div className="glass-card p-4 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Sales (YTD)</p>
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-[22px] font-bold text-text-primary">
                        ₹{(kpis.sales_total / 100000).toFixed(1)}L
                    </h3>
                    <p className="text-[10px] text-text-secondary mt-1">total invoiced</p>
                </div>

                <div className="glass-card p-4 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Pending Qty</p>
                        <div className="p-2 bg-amber-50 rounded-lg text-warning">
                            <Package className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-[22px] font-bold text-text-primary">{kpis.pending_qty.toLocaleString()}</h3>
                    <p className="text-[10px] text-text-secondary mt-1">units awaiting dispatch</p>
                </div>

                <div className="glass-card p-4 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Avg Lag</p>
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-[22px] font-bold text-text-primary">{kpis.avg_lag_days}</h3>
                    <p className="text-[10px] text-text-secondary mt-1">days (DC → Invoice)</p>
                </div>

                <div className="glass-card p-4 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Alerts</p>
                        <div className="p-2 bg-red-50 rounded-lg text-danger">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-[22px] font-bold text-text-primary">{totalAlerts}</h3>
                    <p className="text-[10px] text-text-secondary mt-1">
                        {kpis.alerts.uninvoiced_dcs} uninvoiced, {kpis.alerts.overdue_pos} overdue
                    </p>
                </div>
            </div>

            {/* PO-Centric Quick Insights */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-xl">✨</span>
                    </div>
                    <div>
                        <h2 className="text-[16px] font-semibold text-text-primary">PO-Centric Analysis</h2>
                        <p className="text-[12px] text-text-secondary">Click a query to view computed report with AI insights</p>
                    </div>
                </div>

                {/* Sample Query Chips - Single Row */}
                <div className="flex flex-wrap gap-3">
                    {sampleQueries.map((query, idx) => (
                        <button
                            key={idx}
                            onClick={query.action}
                            className="flex items-center gap-2 px-4 py-3 bg-white border border-border hover:border-primary hover:bg-primary/5 rounded-lg text-sm font-medium text-text-primary transition-all group"
                        >
                            <query.icon className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                            <span className="text-left">{query.text}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ========================================= */}
            {/* DATE-WISE OPERATIONAL SUMMARIES (NEW)    */}
            {/* ========================================= */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-[16px] font-semibold text-text-primary">Date-Wise Operational Summaries</h2>
                        <p className="text-[12px] text-text-secondary">View PO/Challan/Invoice summaries by date range</p>
                    </div>
                </div>

                {/* Controls */}
                <DateSummaryControls
                    onViewSummary={handleViewDateSummary}
                    onExport={handleExportDateSummary}
                    exportEnabled={!!dateSummaryData && dateSummaryData.rows && dateSummaryData.rows.length > 0}
                    loading={dateSummaryLoading}
                />

                {/* Summary Display */}
                {dateSummaryLoading ? (
                    <div className="flex items-center justify-center py-12 mt-6">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : dateSummaryData ? (
                    <div className="mt-6">
                        {dateSummaryEntity === 'po' && <PODateSummary data={dateSummaryData} />}
                        {dateSummaryEntity === 'challan' && <ChallanDateSummary data={dateSummaryData} />}
                        {dateSummaryEntity === 'invoice' && <InvoiceDateSummary data={dateSummaryData} />}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
