/**
 * REPORTS PAGE - PO-CENTRIC WITH AI-POWERED INSIGHTS
 * 
 * PRIMARY ENTITY: Purchase Orders (not invoices)
 * REPORTS: Computed aggregations displayed on this page
 * AI: LLM-generated summaries from real data
 * NO NAVIGATION SHORTCUTS
 */

"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    FileText, Calendar, DollarSign, Package, AlertTriangle,
    Loader2, Percent, Clock, TrendingUp, Users, BarChart3, Activity
} from 'lucide-react';
import { api, API_BASE_URL } from '@/lib/api';
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

// ... (keep start of file and imports) ...
// NOTE: This assumes imports are handled or existing ones are sufficient. 
// I will replace the main component logic.

// Add searchParams to props
function SmartReportsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'summary';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [dateRange, setDateRange] = useState('month');

    // Data States
    const [kpis, setKpis] = useState<KPIResponse | null>(null);
    const [pendingItems, setPendingItems] = useState<any[]>([]);
    const [uninvoicedDCs, setUninvoicedDCs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sub-report states
    const [activeReport, setActiveReport] = useState<ReportType>('po_health'); // Default to health in Analysis tab
    const [reportData, setReportData] = useState<any>(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [aiSummary, setAiSummary] = useState('');

    // Date-wise summary state
    const [dateSummaryData, setDateSummaryData] = useState<any>(null);
    const [dateSummaryLoading, setDateSummaryLoading] = useState(false);
    const [dateSummaryEntity, setDateSummaryEntity] = useState('');
    const [dateSummaryParams, setDateSummaryParams] = useState<{ entity: string; startDate: string; endDate: string } | null>(null);

    // Sync local state with URL param if it changes externally
    useEffect(() => {
        const currentTab = searchParams.get('tab');
        if (currentTab) {
            setActiveTab(currentTab);
        } else {
            // Default to summary if no tab param (e.g. clicking sidebar link)
            setActiveTab('summary');
            // Also clear deep-dive validation states
            setActiveReport(null);
            setReportData(null);
            setAiSummary('');
        }
    }, [searchParams]);

    // Fetch Data based on Tab
    useEffect(() => {
        loadTabContent();
        if (activeTab === 'analysis' && activeReport) {
            loadReport(activeReport);
        }
    }, [activeTab, dateRange]);

    const loadTabContent = async () => {
        setLoading(true);
        setError(null);
        try {
            // Always fetch KPIs for the header
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const kpiRes = await fetch(`${baseUrl}/api/smart-reports/kpis?period=${dateRange}`);
            if (kpiRes.ok) setKpis(await kpiRes.json());

            if (activeTab === 'pending') {
                // Fetch Smart Table with Pending Filter (or just process on client for now if endpoint is generic)
                // Using smart-table endpoint which has pending logic
                const res = await fetch(`http://localhost:8000/api/reports/smart-table`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter for pending items on client for now if endpoint returns all
                    setPendingItems(data.filter((i: any) => i.status === 'Pending'));
                }
            } else if (activeTab === 'uninvoiced') {
                const res = await fetch(`http://localhost:8000/api/reports/dc-without-invoice`);
                if (res.ok) setUninvoicedDCs(await res.json());
            }
        } catch (err) {
            console.error("Failed to load data:", err);
            setError("Failed to load report data");
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        router.push(`/reports?tab=${tab}`);
    };



    // ... (Keep existing helper methods like loadReport, handleViewDateSummary, handleExportDateSummary) ...


    const getDateRangeFromPeriod = (period: string) => {
        const today = new Date();
        let startDate = new Date();
        const endDate = new Date(); // To end of today

        if (period === 'month') {
            startDate.setDate(1);
        } else if (period === 'quarter') {
            const currentMonth = today.getMonth();
            const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
            startDate.setMonth(quarterStartMonth, 1);
        } else if (period === 'year') {
            startDate.setMonth(0, 1); // Jan 1st
        }

        return {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
        };
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

    const handleViewDateSummary = async (entity: string, startDate: string, endDate: string) => {
        setDateSummaryLoading(true);
        setDateSummaryEntity(entity);
        setDateSummaryParams({ entity, startDate, endDate });

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(
                `${baseUrl}/api/smart-reports/date-summary?entity=${entity}&start_date=${startDate}&end_date=${endDate}`
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


    if (loading && !kpis) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // ... (Error handling) ...
    if (error || !kpis) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
                    <p className="text-text-primary font-medium">Failed to load reports</p>
                    <button
                        onClick={loadTabContent}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const totalAlerts = kpis.alerts.uninvoiced_dcs + kpis.alerts.overdue_pos;

    // ... (sampleQueries definitions) ...
    const sampleQueries = [
        { text: "Show PO health summary", icon: Activity, action: () => loadReport('po_health') },
        { text: "Which POs are most delayed?", icon: Clock, action: () => loadReport('po_aging') },
        { text: "POs with zero dispatch", icon: Package, action: () => loadReport('po_efficiency') },
        { text: "Which POs are blocking billing?", icon: BarChart3, action: () => loadReport('po_dependency') },
        { text: "Show pending quantity breakdown", icon: TrendingUp, action: () => loadReport('po_health') },
        { text: "Identify dispatch bottlenecks", icon: AlertTriangle, action: () => loadReport('po_dependency') },
    ];


    // ... (Active Report View - keep same) ...
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
                            />
                        )}
                        {activeReport === 'po_aging' && (
                            <POAgingReport
                                data={reportData}
                                aiSummary={aiSummary}
                            />
                        )}
                        {activeReport === 'po_efficiency' && (
                            <POEfficiencyReport
                                data={reportData}
                                aiSummary={aiSummary}
                            />
                        )}
                        {activeReport === 'po_dependency' && (
                            <PODependencyReport
                                data={reportData}
                                aiSummary={aiSummary}
                            />
                        )}
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header and KPIs are persistent */}
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

            {/* Tab Navigation */}
            <div className="flex border-b border-border">
                <button
                    onClick={() => handleTabChange('summary')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'summary' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => handleTabChange('pending')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending' ? 'border-amber-500 text-amber-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    Pending Limit ({kpis?.pending_qty || 0})
                </button>
                <button
                    onClick={() => handleTabChange('analysis')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'analysis' ? 'border-purple-500 text-purple-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    Detailed Analysis
                </button>
                <button
                    onClick={() => handleTabChange('uninvoiced')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'uninvoiced' ? 'border-red-500 text-red-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    Uninvoiced DCs ({kpis?.alerts.uninvoiced_dcs || 0})
                </button>
            </div>

            {/* TAB CONTENT: SUMMARY */}
            {activeTab === 'summary' && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* ... (Existing KPI Cards Code) ... */}
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

                    {/* DATE-WISE OPERATIONAL SUMMARIES - DIRECT ACCESS */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-[16px] font-semibold text-text-primary">Instant Data Summaries</h2>
                                <p className="text-[12px] text-text-secondary">One-click generation for current selected period ({dateRange})</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                const { start, end } = getDateRangeFromPeriod(dateRange);
                                handleViewDateSummary('po', start, end);
                            }}
                            className="p-4 border border-border rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left group"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gray-100 group-hover:bg-white rounded-lg transition-colors">
                                    <FileText className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                                </div>
                                <span className="font-semibold text-gray-700 group-hover:text-emerald-700">PO Summary</span>
                            </div>
                            <p className="text-xs text-gray-500">View Purchase Orders created in this {dateRange}</p>
                        </button>

                        <button
                            onClick={() => {
                                const { start, end } = getDateRangeFromPeriod(dateRange);
                                handleViewDateSummary('challan', start, end);
                            }}
                            className="p-4 border border-border rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left group"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gray-100 group-hover:bg-white rounded-lg transition-colors">
                                    <Package className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                                </div>
                                <span className="font-semibold text-gray-700 group-hover:text-emerald-700">DC Summary</span>
                            </div>
                            <p className="text-xs text-gray-500">Track delivery challans in this {dateRange}</p>
                        </button>

                        <button
                            onClick={() => {
                                const { start, end } = getDateRangeFromPeriod(dateRange);
                                handleViewDateSummary('invoice', start, end);
                            }}
                            className="p-4 border border-border rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left group"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gray-100 group-hover:bg-white rounded-lg transition-colors">
                                    <DollarSign className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                                </div>
                                <span className="font-semibold text-gray-700 group-hover:text-emerald-700">Invoice Summary</span>
                            </div>
                            <p className="text-xs text-gray-500">Financial overview for this {dateRange}</p>
                        </button>
                    </div>

                    {/* Summary Display Inline */}
                    {dateSummaryLoading && (
                        <div className="flex items-center justify-center py-12 mt-6">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span className="ml-2 text-sm text-text-muted">Generating Report...</span>
                        </div>
                    )}

                    {!dateSummaryLoading && dateSummaryData && (
                        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Summary Component handles its own header/export now */}
                            {dateSummaryEntity === 'po' && <PODateSummary data={dateSummaryData} />}
                            {dateSummaryEntity === 'challan' && <ChallanDateSummary data={dateSummaryData} />}
                            {dateSummaryEntity === 'invoice' && <InvoiceDateSummary data={dateSummaryData} />}
                        </div>
                    )}
                </>
            )}
            {/* TAB CONTENT: ANALYSIS */}
            {
                activeTab === 'analysis' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-2">
                            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">Analysis Type</h3>

                            <button
                                onClick={() => loadReport('po_health')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeReport === 'po_health' ? 'bg-primary text-white shadow-md' : 'bg-white hover:bg-gray-50 text-text-primary border border-transparent'}`}
                            >
                                <Activity className="w-4 h-4" /> PO Health Check
                                {activeReport === 'po_health' && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                            </button>

                            <button
                                onClick={() => loadReport('po_aging')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeReport === 'po_aging' ? 'bg-primary text-white shadow-md' : 'bg-white hover:bg-gray-50 text-text-primary border border-transparent'}`}
                            >
                                <Clock className="w-4 h-4" /> Delay & Aging
                            </button>

                            <button
                                onClick={() => loadReport('po_efficiency')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeReport === 'po_efficiency' ? 'bg-primary text-white shadow-md' : 'bg-white hover:bg-gray-50 text-text-primary border border-transparent'}`}
                            >
                                <Package className="w-4 h-4" /> Fulfillment Efficiency
                            </button>

                            <button
                                onClick={() => loadReport('po_dependency')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeReport === 'po_dependency' ? 'bg-primary text-white shadow-md' : 'bg-white hover:bg-gray-50 text-text-primary border border-transparent'}`}
                            >
                                <BarChart3 className="w-4 h-4" /> Dependency Analysis
                            </button>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-3">
                            {reportLoading ? (
                                <div className="glass-card h-96 flex flex-col items-center justify-center">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                                    <p className="text-text-secondary">Analyzing Data with AI...</p>
                                </div>
                            ) : reportData ? (
                                <div className="animate-in fade-in duration-300">
                                    {activeReport === 'po_health' && <POHealthReport data={reportData} aiSummary={aiSummary} />}
                                    {activeReport === 'po_aging' && <POAgingReport data={reportData} aiSummary={aiSummary} />}
                                    {activeReport === 'po_efficiency' && <POEfficiencyReport data={reportData} aiSummary={aiSummary} />}
                                    {activeReport === 'po_dependency' && <PODependencyReport data={reportData} aiSummary={aiSummary} />}
                                </div>
                            ) : (
                                <div className="glass-card h-64 flex flex-col items-center justify-center text-center p-8">
                                    <div className="p-4 bg-blue-50 rounded-full mb-4">
                                        <BarChart3 className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-text-primary">Select an Analysis</h3>
                                    <p className="text-text-secondary mt-2 max-w-sm">Choose a report type from the sidebar to view detailed analytics and AI insights.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* TAB CONTENT: PENDING */}
            {
                activeTab === 'pending' && (
                    <div className="glass-card p-0 overflow-hidden">
                        <div className="p-4 border-b border-border bg-gray-50/50">
                            <h3 className="font-semibold text-text-primary flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-warning" />
                                Pending PO Items
                            </h3>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-surface-2 text-text-secondary font-medium border-b border-border">
                                <tr>
                                    <th className="px-4 py-3">PO Number</th>
                                    <th className="px-4 py-3">Item</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 text-right">Ordered</th>
                                    <th className="px-4 py-3 text-right">Dispatched</th>
                                    <th className="px-4 py-3 text-right text-danger font-semibold">Pending</th>
                                    <th className="px-4 py-3 text-right">Age</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {pendingItems.map((item, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-primary">{item.po_number}</td>
                                        <td className="px-4 py-3 text-text-secondary">{item.po_item_no}</td>
                                        <td className="px-4 py-3 text-text-primary">{item.material_description}</td>
                                        <td className="px-4 py-3 text-right text-text-secondary">{item.ord_qty}</td>
                                        <td className="px-4 py-3 text-right text-text-secondary">{item.dispatched_qty}</td>
                                        <td className="px-4 py-3 text-right font-bold text-danger bg-red-50/50">{item.pending_qty}</td>
                                        <td className="px-4 py-3 text-right text-text-muted">{item.age_days} days</td>
                                    </tr>
                                ))}
                                {pendingItems.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                                            No pending items found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            }

            {/* TAB CONTENT: UNINVOICED */}
            {
                activeTab === 'uninvoiced' && (
                    <div className="glass-card p-0 overflow-hidden">
                        <div className="p-4 border-b border-border bg-gray-50/50">
                            <h3 className="font-semibold text-text-primary flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-danger" />
                                Uninvoiced Delivery Challans
                            </h3>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-surface-2 text-text-secondary font-medium border-b border-border">
                                <tr>
                                    <th className="px-4 py-3">DC Number</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">PO Number</th>
                                    <th className="px-4 py-3">Consignee</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {uninvoicedDCs.map((dc, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-purple-600">{dc.dc_number}</td>
                                        <td className="px-4 py-3 text-text-secondary">{dc.dc_date}</td>
                                        <td className="px-4 py-3 text-primary hover:underline cursor-pointer">{dc.po_number}</td>
                                        <td className="px-4 py-3 text-text-primary">{dc.consignee_name}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Pending Invoice</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => router.push(`/invoice/create?dc=${dc.dc_number}`)}
                                                className="px-3 py-1 bg-primary text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                                            >
                                                Generate Invoice
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {uninvoicedDCs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                                            All challans have been invoiced.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            }
        </div >
    );
}

export default function SmartReportsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <SmartReportsContent />
        </Suspense>
    );
}
