"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Download,
  TrendingUp,
  FileText,
  AlertCircle,
  Layers,
  Clock,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { api, InvoiceListItem, InvoiceStats } from "@/lib/api";
import { formatDate, formatIndianCurrency } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/hooks/useDebounce";
import { StatusBadge } from "@/components/design-system/organisms/StatusBadge";
import { ListPageTemplate } from "@/components/design-system/templates/ListPageTemplate";
import { Input } from "@/components/design-system/atoms/Input";
import { Accounting } from "@/components/design-system/atoms/Typography";
import { Button } from "@/components/design-system/atoms/Button";
import type { Column } from "@/components/design-system/organisms/DataTable";
import type { SummaryCardProps } from "@/components/design-system/organisms/SummaryCards";

// --- OPTIMIZATION: Static Columns Definitions ---
const columns: Column<InvoiceListItem>[] = [
  {
    key: "invoice_number",
    label: "INVOICE NUMBER",
    sortable: true,
    width: "12%",
    render: (_value, inv) => (
      <Link href={`/invoice/${inv.invoice_number}`} className="block">
        <div className="text-blue-600 font-semibold hover:underline">
          {inv.invoice_number}
        </div>
      </Link>
    ),
  },
  {
    key: "invoice_date",
    label: "DATE",
    sortable: true,
    width: "10%",
    render: (v) => (
      <span className="text-slate-500 font-medium whitespace-nowrap text-sm">
        {formatDate(String(v))}
      </span>
    ),
  },
  {
    key: "linked_dc_numbers",
    label: "Linked DCs",
    width: "14%",
    render: (v) => (
      <div className="flex flex-wrap gap-1">
        {String(v) && String(v) !== "null" ? (
          String(v).split(",").map((dc: string, i: number) => (
            <Link
              key={i}
              href={`/dc/`}
              className="no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
                {dc.trim()}
              </div>
            </Link>
          ))
        ) : (
          <span className="text-slate-400 italic text-xs">Direct</span>
        )}
      </div>
    ),
  },
  {
    key: "po_numbers",
    label: "Linked POs",
    width: "14%",
    render: (v) => (
      <div className="flex flex-wrap gap-1">
        {String(v) && String(v) !== "null" ? (
          String(v).split(",").map((po: string, i: number) => (
            <Link
              key={i}
              href={`/po/`}
              className="no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-600 text-[10px] font-bold border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                {po.trim()}
              </div>
            </Link>
          ))
        ) : (
          <span className="text-slate-400 italic text-xs">Direct</span>
        )}
      </div>
    ),
  },
  {
    key: "customer_gstin",
    label: "CUSTOMER GSTIN",
    width: "15%",
    render: (v) => (
      <span className="font-mono text-sm text-slate-600">
        {String(v) || "N/A"}
      </span>
    ),
  },
  {
    key: "total_invoice_value",
    label: "TOTAL VALUE",
    sortable: true,
    align: "right",
    width: "15%",
    render: (v) => (
      <Accounting isCurrency className="text-slate-950 font-medium">
        {Number(v)}
      </Accounting>
    ),
  },
  {
    key: "igst",
    label: "IGST",
    align: "right",
    width: "10%",
    render: (v) => (
      <span className="text-slate-500 tabular-nums text-sm">
        {formatIndianCurrency(Number(v) || 0)}
      </span>
    ),
  },
  {
    key: "status",
    label: "STATUS",
    sortable: true,
    width: "10%",
    render: (v) => (
      <StatusBadge status={String(v || "Pending")} />
    ),
  },
];

export default function InvoicePage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("invoice-search")?.focus();
      }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("invoice-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      try {
        // Fetch invoice stats
        const statsResponse = await fetch("/api/invoice/stats");
        if (!statsResponse.ok) {
          throw new Error("Failed to fetch invoice stats");
        }
        const statsResult = await statsResponse.json();
        setStats(statsResult);

        // Fetch invoices list
        const response = await fetch("/api/invoice/");

        if (!response.ok) {
          throw new Error("Failed to fetch invoices");
        }

        const result = await response.json();

        // Handle unified response format
        const invoicesData = result.data || result;

        setInvoices(invoicesData);
        // Assuming filteredInvoices is now derived from invoices or managed separately
        // If filteredInvoices was a state, it would need to be declared and set here.
        // For now, we'll rely on the useMemo below to filter `invoices`.
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(
      (inv) =>
        inv.invoice_number
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        (inv.customer_gstin &&
          inv.customer_gstin
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase())),
    );
  }, [invoices, debouncedSearch]);

  // --- OPTIMIZATION: Memoized Summary Cards ---
  const summaryCards = useMemo(
    (): SummaryCardProps[] => [
      {
        title: "Total Invoices",
        value: invoices.length,
        icon: <Receipt size={24} />,
        variant: "default",
      },
      {
        title: "Paid Invoices",
        value: formatIndianCurrency(stats?.total_invoiced || 0),
        icon: <Clock size={24} />,
        variant: "success",
      },
      {
        title: "Pending Payments",
        value: formatIndianCurrency(stats?.pending_payments || 0),
        icon: <Clock size={24} />,
        variant: "warning",
      },
      {
        title: "Total Invoiced",
        value: formatIndianCurrency(stats?.total_invoiced || 0),
        icon: <Activity size={24} />,
        variant: "success",
      },
    ],
    [invoices.length, stats],
  );

  // Toolbar
  // Master Reference: Toolbar Construction (Atomic)
  const toolbar = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Input
          id="invoice-search"
          name="invoice-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Invoices..."
          className="w-64 pl-9 bg-white/50 border-slate-200 focus:bg-white transition-all"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>

      <Button
        variant="default"
        size="sm"
        onClick={() => router.push("/invoice/create")}
        className="bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10"
      >
        <Plus size={16} className="mr-2" />
        New Invoice
      </Button>
    </div>
  );

  return (
    <ListPageTemplate
      title="GST INVOICES"
      subtitle="Manage all billing documentation and compliance"
      toolbar={toolbar}
      summaryCards={summaryCards}
      columns={columns as any}
      data={filteredInvoices}
      keyField="invoice_number"
      page={page}
      pageSize={pageSize}
      totalItems={filteredInvoices.length}
      onPageChange={(newPage) => setPage(newPage)}
      loading={loading}
      emptyMessage="No invoices found"
    />
  );
}
