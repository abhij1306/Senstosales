"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Download,
  Truck,
  Receipt,
  BarChart,
  AlertTriangle,
  Activity,
  Calendar,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";

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
      <Accounting isCurrency className="font-medium">
        {row.total_taxable}
      </Accounting>
    ),
  },
  {
    key: "total_value",
    label: "TOTAL VALUE",
    align: "right",
    render: (_v, row) => (
      <Accounting isCurrency className="text-emerald-600 font-medium">
        {row.total_value}
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
      <Accounting isCurrency className="font-medium">
        {row.taxable_value}
      </Accounting>
    ),
  },
  {
    key: "total_invoice_value",
    label: "TOTAL",
    align: "right",
    render: (_v, row) => (
      <Accounting isCurrency className="text-slate-900 font-bold">
        {row.total_invoice_value}
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
    width: "25%",
    render: (_v, row) => (
      <TableText
        className="truncate font-medium block max-w-[200px]"
        title={row.material_description}
      >
        {row.material_description}
      </TableText>
    ),
  },
  {
    key: "ord_qty",
    label: "ORDERED",
    width: "20%",
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
      <TableText className="truncate font-medium">
        {row.item_description}
      </TableText>
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
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [headerPortal, setHeaderPortal] = useState<HTMLElement | null>(null);

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
            // Use a stable key prefix based on tab/page if possible, but random is okay for fetch-only
            unique_id: `${activeTab}-${index}-${Math.random().toString(36).substr(2, 9)}`,
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

  // --- FIX 3: Memoize KPIs to prevent recalc on every render ---
  const kpiCards = useMemo((): SummaryCardProps[] => {
    if (!data || data.length === 0) return [];

    switch (activeTab) {
      case "sales":
        return [
          {
            title: "TOTAL TAXABLE",
            value: (
              <Accounting isCurrency short className="text-xl text-white">
                {data.reduce((s, r) => s + (r.total_taxable || 0), 0)}
              </Accounting>
            ),
            icon: <BarChart size={24} />,
            variant: "primary",
          },
          {
            title: "CGST/SGST COLL",
            value: (
              <Accounting isCurrency short className="text-xl text-white">
                {data.reduce(
                  (s, r) => s + (r.total_cgst || 0) + (r.total_sgst || 0),
                  0,
                )}
              </Accounting>
            ),
            icon: <Receipt size={24} />,
            variant: "secondary",
          },
          {
            title: "TOTAL INVOICED",
            value: (
              <Accounting isCurrency short className="text-xl text-white">
                {data.reduce((s, r) => s + (r.total_value || 0), 0)}
              </Accounting>
            ),
            icon: <FileText size={24} />,
            variant: "success",
          },
          {
            title: "INVOICE COUNT",
            value: (
              <Accounting short className="text-xl text-white">
                {data.reduce((s, r) => s + (r.invoice_count || 0), 0)}
              </Accounting>
            ),
            icon: <BarChart size={24} />,
            variant: "warning",
          },
        ];
      // ... (Rest of KPI cases remain the same, just wrapped in the useMemo return)
      case "dc_register":
        return [
          {
            title: "TOTAL CHALLANS",
            value: (
              <Accounting short className="text-xl text-white">
                {data.length}
              </Accounting>
            ),
            icon: <Truck size={24} />,
            variant: "primary",
          },
          {
            title: "TOTAL DISPATCHED",
            value: (
              <Accounting short className="text-xl text-white">
                {data.reduce((s, r) => s + (r.total_qty || 0), 0)}
              </Accounting>
            ),
            icon: <Activity size={24} />,
            variant: "secondary",
          },
          {
            title: "TOTAL VALUE",
            value: (
              <Accounting isCurrency short className="text-xl text-white">
                {data.reduce((s, r) => s + (r.total_value || 0), 0)}
              </Accounting>
            ),
            icon: <BarChart size={24} />,
            variant: "success",
          },
          {
            title: "ACTIVE REGIONS",
            value: (
              <Accounting short className="text-xl text-white">
                {new Set(data.map((d) => d.consignee_name)).size}
              </Accounting>
            ),
            icon: <Search size={24} />,
            variant: "warning",
          },
        ];
      case "invoice_register":
        return [
          {
            title: "TOTAL INVOICES",
            value: (
              <Accounting short className="text-xl text-white">
                {data.length}
              </Accounting>
            ),
            icon: <Receipt size={24} />,
            variant: "primary",
          },
          {
            title: "TOTAL TAXABLE",
            value: (
              <Accounting isCurrency short className="text-xl text-white">
                {data.reduce((s, r) => s + (r.taxable_value || 0), 0)}
              </Accounting>
            ),
            icon: <BarChart size={24} />,
            variant: "secondary",
          },
          {
            title: "TOTAL REVENUE",
            value: (
              <Accounting isCurrency short className="text-xl text-white">
                {data.reduce((s, r) => s + (r.total_invoice_value || 0), 0)}
              </Accounting>
            ),
            icon: <FileText size={24} />,
            variant: "success",
          },
          {
            title: "AVG INV VALUE",
            value: (
              <Accounting isCurrency short className="text-xl text-white">
                {data.length > 0
                  ? data.reduce((s, r) => s + (r.total_invoice_value || 0), 0) /
                    data.length
                  : 0}
              </Accounting>
            ),
            icon: <Search size={24} />,
            variant: "warning",
          },
        ];
      case "pending":
        return [
          {
            title: "SHORTAGE ITEMS",
            value: (
              <Accounting short className="text-xl text-white">
                {data.length}
              </Accounting>
            ),
            icon: <AlertTriangle size={24} />,
            variant: "warning",
          },
          {
            title: "TOTAL PENDING",
            value: (
              <Accounting short className="text-xl text-white">
                {data.reduce((s, r) => s + (r.pending_qty || 0), 0)}
              </Accounting>
            ),
            icon: <Activity size={24} />,
            variant: "primary",
          },
          {
            title: "TOTAL ORDERED",
            value: (
              <Accounting short className="text-xl text-white">
                {data.reduce((s, r) => s + (r.ord_qty || 0), 0)}
              </Accounting>
            ),
            icon: <Truck size={24} />,
            variant: "secondary",
          },
          {
            title: "PENDING %",
            value: (
              <Accounting short className="text-xl text-white">
                {data.reduce((s, r) => s + (r.ord_qty || 0), 0) > 0
                  ? `${((data.reduce((s, r) => s + (r.pending_qty || 0), 0) / data.reduce((s, r) => s + (r.ord_qty || 0), 0)) * 100).toFixed(1)}%`
                  : "0%"}
              </Accounting>
            ),
            icon: <Search size={24} />,
            variant: "success",
          },
        ];
      case "reconciliation":
        return [
          {
            title: "TOTAL ACCEPTED",
            value: (
              <Accounting short className="text-xl text-white">
                {data.reduce((s, r) => s + (r.total_accepted || 0), 0)}
              </Accounting>
            ),
            icon: <Activity size={24} />,
            variant: "success",
          },
          {
            title: "TOTAL REJECTED",
            value: (
              <Accounting short className="text-xl text-white">
                {data.reduce((s, r) => s + (r.total_rejected || 0), 0)}
              </Accounting>
            ),
            icon: <AlertTriangle size={24} />,
            variant: "warning",
          },
          {
            title: "PO ITEMS",
            value: (
              <Accounting short className="text-xl text-white">
                {data.length}
              </Accounting>
            ),
            icon: <Truck size={24} />,
            variant: "primary",
          },
          {
            title: "PASS RATE",
            value: (
              <Accounting short className="text-xl text-white">
                {data.reduce((s, r) => s + (r.ordered_qty || 0), 0) > 0
                  ? `${((data.reduce((s, r) => s + (r.total_accepted || 0), 0) / data.reduce((s, r) => s + (r.ordered_qty || 0), 0)) * 100).toFixed(1)}%`
                  : "0%"}
              </Accounting>
            ),
            icon: <Search size={24} />,
            variant: "secondary",
          },
        ];
      default:
        return [];
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
      <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-100">
          <Calendar size={14} className="text-slate-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs font-bold outline-none bg-transparent"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs font-bold outline-none bg-transparent"
          />
        </div>
      </div>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-all active:scale-95 text-xs font-semibold"
      >
        <FileText size={16} />
        Excel
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
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="sales">
              <BarChart size={14} className="mr-2" />
              Sales Growth
            </TabsTrigger>
            <TabsTrigger value="dc_register">
              <Truck size={14} className="mr-2" />
              DC Register
            </TabsTrigger>
            <TabsTrigger value="invoice_register">
              <Receipt size={14} className="mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="pending">
              <AlertTriangle size={14} className="mr-2" />
              Shortages
            </TabsTrigger>
            <TabsTrigger value="reconciliation">
              <Activity size={14} className="mr-2" />
              Ledger Audit
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
                  ? "DC Register"
                  : activeTab === "invoice_register"
                    ? "Invoices"
                    : activeTab === "sales"
                      ? "Sales Growth"
                      : activeTab === "pending"
                        ? "Shortages"
                        : "Ledger Audit"
              }
              subtitle="Multi-dimensional ledger analytics"
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
              className={
                loading
                  ? "opacity-50 transition-opacity duration-300"
                  : "opacity-100 transition-opacity duration-300"
              }
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
