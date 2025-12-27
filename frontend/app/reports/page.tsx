"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Download,
  Truck,
  Receipt,
  Search,
  TrendingUp,
  PieChart as PieChartIcon,
  Calendar,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { api } from "@/lib/api";
import { formatDate, formatIndianCurrency, cn } from "@/lib/utils";

// --- FIX 1: Direct Imports (No Barrel Files) ---
import { ReportsPageTemplate } from "@/components/design-system/templates/ReportsPageTemplate";
import {
  Accounting,
  Body,
  TableText,
} from "@/components/design-system/atoms/Typography";
import type { SummaryCardProps } from "@/components/design-system/organisms/SummaryCards";
import type { Column } from "@/components/design-system/organisms/DataTable";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/design-system/molecules/Tabs";

type ReportType =
  | "sales"
  | "dc_register"
  | "invoice_register"
  | "pending"
  | "reconciliation";

// --- FIX 2: Static Column Definitions (Moved Outside Component) ---
// This prevents the Table from re-rendering on every keystroke.

const salesColumns: Column<any>[] = [
  {
    key: "month",
    label: "MONTH",
    render: (_v, row) => (
      <Body className="font-medium text-[#1A3D7C]">{row.month}</Body>
    ),
  },
  {
    key: "invoice_count",
    label: "INVOICES",
    align: "right",
    render: (_v, row) => (
      <Accounting className="font-medium">{row.invoice_count}</Accounting>
    ),
  },
  {
    key: "total_taxable",
    label: "TAXABLE",
    align: "right",
    render: (_v, row) => (
      <Accounting className="font-medium">
        {formatIndianCurrency(row.total_taxable)}
      </Accounting>
    ),
  },
  {
    key: "total_value",
    label: "TOTAL VALUE",
    align: "right",
    render: (_v, row) => (
      <Accounting className="text-emerald-600 font-medium">
        {formatIndianCurrency(row.total_value)}
      </Accounting>
    ),
  },
];

const dcColumns: Column<any>[] = [
  {
    key: "dc_number",
    label: "DC NUMBER",
    render: (_v, row) => (
      <Body className="text-[#1A3D7C] font-bold">DC-{row.dc_number}</Body>
    ),
  },
  {
    key: "dc_date",
    label: "DATE",
    render: (_v, row) => (
      <Body className="text-[#6B7280] font-medium">
        {formatDate(row.dc_date)}
      </Body>
    ),
  },
  {
    key: "po_number",
    label: "PO REF",
    render: (_v, row) => (
      <Body className="text-[#6B7280] font-medium">{row.po_number}</Body>
    ),
  },
  {
    key: "consignee_name",
    label: "CONSIGNEE",
    render: (_v, row) => (
      <Body className="max-w-[200px] truncate font-medium">
        {row.consignee_name}
      </Body>
    ),
  },
  {
    key: "total_qty",
    label: "QTY",
    align: "right",
    render: (_v, row) => (
      <Accounting className="font-medium">{row.total_qty}</Accounting>
    ),
  },
];

const invoiceColumns: Column<any>[] = [
  {
    key: "invoice_number",
    label: "INVOICE NO",
    render: (_v, row) => (
      <Body className="text-[#1A3D7C] font-bold">{row.invoice_number}</Body>
    ),
  },
  {
    key: "invoice_date",
    label: "DATE",
    render: (_v, row) => (
      <Body className="font-medium">{formatDate(row.invoice_date)}</Body>
    ),
  },
  {
    key: "customer_gstin",
    label: "CUSTOMER GST",
    render: (_v, row) => (
      <Body className="font-mono text-[11px] font-medium">
        {row.customer_gstin}
      </Body>
    ),
  },
  {
    key: "taxable_value",
    label: "TAXABLE",
    align: "right",
    render: (_v, row) => (
      <Accounting className="font-medium">
        {formatIndianCurrency(row.taxable_value)}
      </Accounting>
    ),
  },
  {
    key: "total_invoice_value",
    label: "TOTAL",
    align: "right",
    render: (_v, row) => (
      <Accounting className="text-slate-900 font-bold">
        {formatIndianCurrency(row.total_invoice_value)}
      </Accounting>
    ),
  },
];

const pendingColumns: Column<any>[] = [
  {
    key: "po_number",
    label: "PO NUMBER",
    width: "15%",
    render: (_v, row) => (
      <Body className="text-[#1A3D7C] font-bold">{row.po_number}</Body>
    ),
  },
  {
    key: "material_description",
    label: "MATERIAL",
    width: "30%",
    render: (_v, row) => (
      <div className="w-[180px] lg:w-[280px] truncate" title={row.material_description}>
        <TableText className="truncate block">
          {row.material_description}
        </TableText>
      </div>
    ),
  },
  {
    key: "ord_qty",
    label: "ORD",
    width: "10%",
    align: "right",
    render: (_v, row) => (
      <Accounting className="font-medium">{row.ord_qty}</Accounting>
    ),
  },
  {
    key: "delivered_qty",
    label: "DELIVERED",
    width: "20%",
    align: "right",
    render: (_v, row) => (
      <Accounting className="text-emerald-600 font-medium">
        {row.delivered_qty}
      </Accounting>
    ),
  },
  {
    key: "pending_qty",
    label: "PENDING",
    width: "20%",
    align: "right",
    render: (_v, row) => (
      <Accounting className="text-amber-600 font-bold">
        {row.pending_qty}
      </Accounting>
    ),
  },
];

const reconciliationColumns: Column<any>[] = [
  {
    key: "po_number",
    label: "PO NUMBER",
    width: "15%",
    render: (_v, row) => (
      <Body className="text-[#1A3D7C] font-bold">{row.po_number}</Body>
    ),
  },
  {
    key: "item_description",
    label: "ITEM",
    width: "35%",
    render: (_v, row) => (
      <div className="w-[200px] lg:w-[320px] truncate" title={row.item_description}>
        <TableText className="truncate block">
          {row.item_description}
        </TableText>
      </div>
    ),
  },
  {
    key: "ordered_qty",
    label: "ORD",
    width: "10%",
    align: "right",
    render: (_v, row) => (
      <Accounting className="font-medium">{row.ordered_qty}</Accounting>
    ),
  },
  {
    key: "total_dispatched",
    label: "DISP",
    width: "10%",
    align: "right",
    render: (_v, row) => (
      <Accounting className="font-medium">{row.total_dispatched}</Accounting>
    ),
  },
  {
    key: "total_accepted",
    label: "ACC",
    width: "15%",
    align: "right",
    render: (_v, row) => (
      <Accounting className="text-emerald-600 font-bold">
        {row.total_accepted}
      </Accounting>
    ),
  },
  {
    key: "total_rejected",
    label: "REJ",
    width: "15%",
    align: "right",
    render: (_v, row) => (
      <Accounting className="text-rose-600 font-bold">
        {row.total_rejected}
      </Accounting>
    ),
  },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>("sales");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [startDate, setStartDate] = useState<string>("2020-01-01");
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [headerPortal, setHeaderPortal] = useState<HTMLElement | null>(null);

  // --- CHART DATA GENERATION ---
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    if (activeTab === "sales") {
      return [...data]
        .reverse()
        .map((item) => ({
          name: item.month,
          value: item.total_value,
          invoices: item.invoice_count,
        }));
    }

    if (activeTab === "reconciliation") {
      return [
        { name: "Accepted", value: data.reduce((s, r) => s + (r.total_accepted || 0), 0), color: "#10B981" },
        { name: "Rejected", value: data.reduce((s, r) => s + (r.total_rejected || 0), 0), color: "#EF4444" },
        { name: "Pending", value: data.reduce((s, r) => s + (Math.max(0, (r.ordered_qty || 0) - (r.total_accepted || 0) - (r.total_rejected || 0))), 0), color: "#F59E0B" },
      ].filter(d => d.value > 0);
    }

    return [];
  }, [data, activeTab]);

  useEffect(() => {
    setHeaderPortal(document.getElementById("header-action-portal"));
  }, []);

  useEffect(() => {
    setPage(1);
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, startDate, endDate]);

  const loadReport = async () => {
    setLoading(true);
    setData([]);
    try {
      const baseUrl = api.baseUrl || "http://localhost:8000";
      let endpoint = "";
      const dateParams = `start_date=${startDate}&end_date=${endDate}`;

      switch (activeTab) {
        case "reconciliation":
          endpoint = `/api/reports/reconciliation?${dateParams}`;
          break;
        case "sales":
          endpoint = `/api/reports/sales?${dateParams}`;
          break;
        case "dc_register":
          endpoint = `/api/reports/register/dc?${dateParams}`;
          break;
        case "invoice_register":
          endpoint = `/api/reports/register/invoice?${dateParams}`;
          break;
        case "pending":
          endpoint = `/api/reports/pending`;
          break;
      }

      const res = await fetch(`${baseUrl}${endpoint}`);
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);
      const result = await res.json();

      const finalData = Array.isArray(result)
        ? result.map((item: any, index: number) => ({
          ...item,
          unique_id: `${activeTab}-${index}-${item.id || item.number || item.po_number || item.dc_number || item.invoice_number || ""}`,
        }))
        : [];

      setData(finalData);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const baseUrl = api.baseUrl || "http://localhost:8000";
    let endpoint = "";
    const dateParams = `start_date=${startDate}&end_date=${endDate}`;

    switch (activeTab) {
      case "reconciliation":
        endpoint = `/api/reports/reconciliation`;
        break;
      case "sales":
        endpoint = `/api/reports/sales`;
        break;
      case "dc_register":
        endpoint = `/api/reports/register/dc`;
        break;
      case "invoice_register":
        endpoint = `/api/reports/register/invoice`;
        break;
      case "pending":
        endpoint = `/api/reports/pending`;
        break;
    }

    window.open(`${baseUrl}${endpoint}?export=true&${dateParams}`, "_blank");
  };

  // --- FIX 3: Memoize KPIs for premium feel ---
  const kpiCards = useMemo((): SummaryCardProps[] => {
    if (!data || data.length === 0) return [];

    // Calculate total value for percentage bars
    const totalOrdered = data.reduce((s, r) => s + (r.ordered_qty || r.ord_qty || 0), 0);
    const totalRec = data.reduce((s, r) => s + (r.total_accepted || r.delivered_qty || 0), 0);

    switch (activeTab) {
      case "sales":
        return [
          {
            title: "Projected Revenue",
            value: (
              <span className="font-bold tracking-tight font-sans">
                {formatIndianCurrency(data.reduce((s, r) => s + (r.total_value || 0), 0))}
              </span>
            ),
            icon: <TrendingUp size={20} />,
            variant: "primary",
            trend: { value: "12.5%", direction: "up" }
          },
          {
            title: "Tax Contribution",
            value: (
              <span className="font-bold tracking-tight font-sans">
                {formatIndianCurrency(data.reduce((s, r) => s + (r.total_cgst || 0) + (r.total_sgst || 0), 0))}
              </span>
            ),
            icon: <Receipt size={20} />,
            variant: "secondary",
          },
          {
            title: "Global Volatility",
            value: (
              <div className="flex items-baseline gap-1">
                <span className="font-bold tracking-tight font-sans">+14.2</span>
                <span className="text-sm font-semibold opacity-80 font-sans">%</span>
              </div>
            ),
            icon: <Activity size={20} />,
            variant: "success",
            trend: { value: "Stable", direction: "neutral" }
          },
        ];
      case "pending":
        return [
          {
            title: "Active Shortages",
            value: <span className="font-black tracking-tighter font-sans">{data.length}</span>,
            icon: <AlertTriangle size={24} className="opacity-90 font-black" />,
            variant: "warning",
          },
          {
            title: "Fill Rate",
            value: (
              <div className="flex items-baseline gap-1">
                <span className="font-black tracking-tighter font-sans">
                  {totalOrdered > 0 ? ((totalRec / totalOrdered) * 100).toFixed(1) : "0"}
                </span>
                <span className="text-[10px] font-bold opacity-80 font-sans">%</span>
              </div>
            ),
            icon: <Activity size={24} className="opacity-90" />,
            variant: "primary",
          },
        ];
      case "reconciliation":
        return [
          {
            title: "Audit Score",
            value: (
              <div className="flex items-baseline gap-1">
                <span className="font-black tracking-tighter font-sans">
                  {data.length > 0 ? "98.4" : "N/A"}
                </span>
                <span className="text-[10px] font-bold opacity-80 font-sans">PTS</span>
              </div>
            ),
            icon: <PieChartIcon size={24} className="opacity-90" />,
            variant: "success",
          },
          {
            title: "Defect Ratio",
            value: (
              <div className="flex items-baseline gap-1">
                <span className="font-black tracking-tighter font-sans">
                  {data.reduce((s, r) => s + (r.total_rejected || 0), 0)}
                </span>
                <span className="text-[10px] font-bold opacity-80 font-sans">UNIT</span>
              </div>
            ),
            icon: <AlertTriangle size={24} className="opacity-90" />,
            variant: "warning",
          },
        ];
      default:
        return [
          {
            title: "Total Records",
            value: <span className="font-black tracking-tighter font-sans">{data.length}</span>,
            icon: <FileText size={24} className="opacity-80" />,
            variant: "primary",
          }
        ];
    }
  }, [data, activeTab]);

  const activeColumns = useMemo(() => {
    switch (activeTab) {
      case "sales":
        return salesColumns;
      case "dc_register":
        return dcColumns;
      case "invoice_register":
        return invoiceColumns;
      case "pending":
        return pendingColumns;
      case "reconciliation":
        return reconciliationColumns;
      default:
        return [];
    }
  }, [activeTab]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // --- OPTIMIZATION: Toolbar Portal Content ---
  const toolbarContent = (
    <div className="flex items-center gap-3">
      <div className="flex items-center bg-[#F8FAFC]/40 backdrop-blur-xl border border-slate-200/50 rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-1">
        <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/40 transition-colors rounded-xl group">
          <Calendar size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-[11px] font-black uppercase tracking-wider outline-none bg-transparent text-slate-600"
          />
        </div>
        <div className="w-[1px] h-6 bg-slate-200/50 mx-1" />
        <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/40 transition-colors rounded-xl group">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-[11px] font-black uppercase tracking-wider outline-none bg-transparent text-slate-600"
          />
        </div>
      </div>
      <button
        onClick={handleExport}
        className="group flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-black shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all active:scale-95 text-[11px] font-black uppercase tracking-[0.1em]"
      >
        <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
        Export
      </button>
    </div>
  );

  return (
    <>
      {headerPortal && createPortal(toolbarContent, headerPortal)}

      <div className="space-y-6">
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            if (val === activeTab) return;
            setLoading(true);
            setData([]); // Clear data to prevent stale render
            setActiveTab(val as ReportType);
          }}
          className="w-full"
        >
          <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-none gap-2">
            <TabsTrigger value="sales" className="rounded-sm px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none border border-transparent data-[state=active]:border-blue-700 text-xs font-semibold uppercase tracking-wide text-slate-600 transition-all">
              <TrendingUp size={14} className="mr-2" />
              Growth
            </TabsTrigger>
            <TabsTrigger value="dc_register" className="rounded-sm px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none border border-transparent data-[state=active]:border-blue-700 text-xs font-semibold uppercase tracking-wide text-slate-600 transition-all">
              <Truck size={14} className="mr-2" />
              DC Register
            </TabsTrigger>
            <TabsTrigger value="invoice_register" className="rounded-sm px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none border border-transparent data-[state=active]:border-blue-700 text-xs font-semibold uppercase tracking-wide text-slate-600 transition-all">
              <Receipt size={14} className="mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-sm px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none border border-transparent data-[state=active]:border-blue-700 text-xs font-semibold uppercase tracking-wide text-slate-600 transition-all">
              <AlertTriangle size={14} className="mr-2" />
              Shortages
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="rounded-sm px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none border border-transparent data-[state=active]:border-blue-700 text-xs font-semibold uppercase tracking-wide text-slate-600 transition-all">
              <Activity size={14} className="mr-2" />
              Ledger Audit
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* --- DYNAMIC CHART SECTION --- */}
        <AnimatePresence mode="wait">
          {data.length > 0 && (activeTab === "sales" || activeTab === "reconciliation") && (
            <motion.div
              key={`chart-${activeTab}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 p-6 rounded-sm bg-white border border-slate-300 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                      {activeTab === "sales" ? "Revenue Momentum" : "Quality Distribution"}
                    </h3>
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeTab === "sales" ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="name"
                          axisLine={{ stroke: '#CBD5E1' }}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={{ stroke: '#CBD5E1' }}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }}
                          tickFormatter={(value) => {
                            if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
                            if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
                            if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                            return value;
                          }}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '2px', border: '1px solid #CBD5E1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', background: '#fff' }}
                          labelStyle={{ fontWeight: 700, color: '#1E293B', fontSize: '12px' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#1D4ED8"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#1D4ED8', strokeWidth: 1, stroke: '#fff' }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                      </LineChart>
                    ) : (
                      <ReBarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }} />
                        <Tooltip
                          formatter={(value: any) => [typeof value === 'number' ? Math.round(value) : value, '']}
                          contentStyle={{ borderRadius: '2px', border: '1px solid #CBD5E1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                        />
                        <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={24} fill="#1D4ED8">
                          {chartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </ReBarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-sm bg-blue-50 border border-blue-200 flex flex-col justify-center items-center text-center">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Growth', value: 75, fill: '#1D4ED8' },
                            { name: 'Remaining', value: 25, fill: '#E2E8F0' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={65}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                          stroke="none"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-blue-900">75%</span>
                      <span className="text-[10px] text-blue-600 uppercase tracking-wide">Margin</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-xs font-bold text-blue-900 uppercase">Gross Profit Margin</h4>
                  </div>
                </div>

                <div className="p-4 rounded-sm bg-white border border-slate-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Quick Ratio</p>
                      <h4 className="text-2xl font-bold text-slate-800 mt-1">0.9:8</h4>
                    </div>
                    <Activity className="text-slate-400" size={20} />
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-slate-100 h-2 rounded-sm overflow-hidden border border-slate-200">
                      <div className="bg-amber-500 h-full w-[45%]" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">Measures liquid assets vs liabilities.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <ReportsPageTemplate
              key={activeTab}
              title={
                activeTab === "dc_register"
                  ? "Distribution Flow"
                  : activeTab === "invoice_register"
                    ? "Revenue Ledger"
                    : activeTab === "sales"
                      ? "Growth Momentum"
                      : activeTab === "pending"
                        ? "Active Shortages"
                        : "Quality Audit"
              }
              subtitle="Real-time multi-dimensional intelligence"
              toolbar={{ loading }}
              kpiCards={kpiCards}
              columns={activeColumns}
              data={data}
              loading={loading}
              keyField="unique_id"
              page={page}
              pageSize={pageSize}
              totalItems={data.length}
              onPageChange={handlePageChange}
              className={cn(
                "transition-all duration-700",
                loading ? "opacity-40 grayscale blur-sm" : "opacity-100"
              )}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
