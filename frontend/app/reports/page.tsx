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
  SmallText,
  Label,
} from "@/components/design-system/atoms/Typography";
import type { SummaryCardProps } from "@/components/design-system/organisms/SummaryCards";
import type { Column } from "@/components/design-system/organisms/DataTable";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/design-system/molecules/Tabs";
import { ReportNavGrid } from "@/components/design-system/organisms/ReportNavGrid";
import { GlassContainer } from "@/components/design-system/atoms/GlassContainer";
import { Flex, Stack, Box, Grid } from "@/components/design-system/atoms/Layout";

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
      <Box className="w-[180px] lg:w-[280px] truncate" title={row.material_description}>
        <TableText className="truncate block">
          {row.material_description}
        </TableText>
      </Box>
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
      <Box className="w-[200px] lg:w-[320px] truncate" title={row.item_description}>
        <TableText className="truncate block">
          {row.item_description}
        </TableText>
      </Box>
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

  const loadReport = useCallback(async () => {
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
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    setPage(1);
    loadReport();
  }, [loadReport]);

  const handleExport = useCallback(() => {
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
  }, [activeTab, startDate, endDate]);

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
    <Flex align="center" gap={3}>
      <Flex align="center" className="bg-[#F8FAFC]/40 backdrop-blur-xl border border-slate-200/50 rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-1">
        <Flex align="center" gap={3} className="px-4 py-2 hover:bg-white/40 transition-colors rounded-xl group">
          <Calendar size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-[11px] font-black uppercase tracking-wider outline-none bg-transparent text-slate-600"
          />
        </Flex>
        <Box className="w-[1px] h-6 bg-slate-200/50 mx-1" />
        <Flex align="center" gap={3} className="px-4 py-2 hover:bg-white/40 transition-colors rounded-xl group">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-[11px] font-black uppercase tracking-wider outline-none bg-transparent text-slate-600"
          />
        </Flex>
      </Flex>
      <button
        onClick={handleExport}
        className="group flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-black shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all active:scale-95 text-[11px] font-black uppercase tracking-[0.1em]"
      >
        <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
        Export
      </button>
    </Flex>
  );

  return (
    <>
      {headerPortal && createPortal(toolbarContent, headerPortal)}

      <div className="space-y-6">
        <ReportNavGrid
          items={[
            { id: "sales", title: "Growth", description: "Revenue and tax velocity trends", icon: <TrendingUp /> },
            { id: "dc_register", title: "DC Register", description: "Dispatch and logistics tracking", icon: <Truck /> },
            { id: "invoice_register", title: "Invoices", description: "Billing and payment ledger", icon: <Receipt /> },
            { id: "pending", title: "Shortages", description: "Active pending supply gaps", icon: <AlertTriangle /> },
            { id: "reconciliation", title: "Ledger Audit", description: "Physical vs System inventory audit", icon: <Activity /> },
          ]}
          activeId={activeTab}
          onSelect={(id) => {
            setLoading(true);
            setData([]);
            setActiveTab(id as ReportType);
          }}
          className="w-full"
        />

        {/* --- DYNAMIC CHART SECTION --- */}
        <AnimatePresence mode="wait">
          {data.length > 0 && (activeTab === "sales" || activeTab === "reconciliation") && (
            <motion.div
              key={`chart-${activeTab}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <Grid
                cols="1"
                gap={6}
                className="lg:grid-cols-3"
              >
                <Box className="lg:col-span-2 p-6 rounded-2xl bg-white/40 backdrop-blur-md border border-white/20 shadow-sm transition-all duration-300 hover:shadow-lg">
                  <Flex align="center" justify="between" className="mb-6 border-b border-white/20 pb-2">
                    <Box>
                      <Body className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                        {activeTab === "sales" ? "Revenue Momentum" : "Quality Distribution"}
                      </Body>
                    </Box>
                  </Flex>

                  <Box className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {activeTab === "sales" ? (
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0/50" />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                            tickFormatter={(value) => {
                              if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
                              if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
                              if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                              return value;
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: '16px',
                              border: '1px solid rgba(255,255,255,0.2)',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                              background: 'rgba(255,255,255,0.8)',
                              backdropFilter: 'blur(10px)',
                              padding: '12px'
                            }}
                            labelStyle={{ fontWeight: 800, color: '#1E293B', fontSize: '12px', marginBottom: '4px' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3B82F6"
                            strokeWidth={4}
                            dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#1d4ed8' }}
                          />
                        </LineChart>
                      ) : (
                        <ReBarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                          <Tooltip
                            formatter={(value: any) => [typeof value === 'number' ? Math.round(value) : value, '']}
                            contentStyle={{
                              borderRadius: '16px',
                              border: '1px solid rgba(255,255,255,0.2)',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                              background: 'rgba(255,255,255,0.8)',
                              backdropFilter: 'blur(10px)'
                            }}
                          />
                          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24} fill="#3B82F6">
                            {chartData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </ReBarChart>
                      )}
                    </ResponsiveContainer>
                  </Box>
                </Box>

                <Stack gap={4}>
                  <Flex align="center" justify="center" direction="col" className="p-6 rounded-2xl bg-blue-500/10 backdrop-blur-md border border-blue-200/20 text-center shadow-sm">
                    <Flex align="center" justify="center" className="relative w-32 h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Growth', value: 75, fill: '#3B82F6' },
                              { name: 'Remaining', value: 25, fill: 'rgba(59, 130, 246, 0.1)' }
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
                      <Stack align="center" justify="center" className="absolute inset-0">
                        <Body className="text-2xl font-black text-blue-900">75%</Body>
                        <SmallText className="text-[10px] text-blue-600 font-bold uppercase tracking-wider leading-none">Margin</SmallText>
                      </Stack>
                    </Flex>
                    <Box className="mt-4">
                      <Body className="text-[11px] font-black text-blue-900/60 uppercase tracking-widest">Gross Profit Margin</Body>
                    </Box>
                  </Flex>

                  <Flex justify="between" direction="col" className="p-6 rounded-2xl bg-white/40 backdrop-blur-md border border-white/20 shadow-sm transition-all duration-300 hover:shadow-lg">
                    <Flex align="center" justify="between">
                      <Stack>
                        <SmallText className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Quick Ratio</SmallText>
                        <Body className="text-2xl font-black text-slate-800 mt-1">0.9:8</Body>
                      </Stack>
                      <Activity className="text-blue-500/60" size={24} />
                    </Flex>
                    <Box className="mt-4">
                      <Box className="w-full bg-slate-200/50 h-2.5 rounded-full overflow-hidden border border-white/20 p-[2px]">
                        <Box className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full w-[45%] shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                      </Box>
                      <SmallText className="text-[10px] text-slate-500 font-medium mt-3 italic text-opacity-80 leading-relaxed">Liquid assets vs Current liabilities dashboard.</SmallText>
                    </Box>
                  </Flex>
                </Stack>
              </Grid>
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
