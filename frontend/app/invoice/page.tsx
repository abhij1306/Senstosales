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
import { SearchBar } from "@/components/design-system/molecules/SearchBar";
import { ListPageTemplate } from "@/components/design-system/templates/ListPageTemplate";
import { Input } from "@/components/design-system/atoms/Input";
import { Accounting, Body, SmallText } from "@/components/design-system/atoms/Typography";
import { Button } from "@/components/design-system/atoms/Button";
import { Badge } from "@/components/design-system/atoms/Badge";
import { type Column } from "@/components/design-system/organisms/DataTable";
import { type SummaryCardProps } from "@/components/design-system/organisms/SummaryCards";
import { useCallback } from "react";
import { Flex, Stack, Box } from "@/components/design-system/atoms/Layout";

// --- OPTIMIZATION: Static Columns Definitions ---
const columns: Column<InvoiceListItem>[] = [
  {
    key: "invoice_number",
    label: "INVOICE NUMBER",
    sortable: true,
    width: "12%",
    render: (_value, inv) => (
      <Link href={`/invoice/${inv.invoice_number}`} className="block">
        <Body className="text-blue-600 font-semibold hover:underline">
          {inv.invoice_number}
        </Body>
      </Link>
    ),
  },
  {
    key: "invoice_date",
    label: "DATE",
    sortable: true,
    width: "10%",
    render: (v) => (
      <Body className="text-slate-500 font-medium whitespace-nowrap">
        {formatDate(String(v))}
      </Body>
    ),
  },
  {
    key: "linked_dc_numbers",
    label: "Linked DCs",
    width: "14%",
    render: (v) => (
      <Flex wrap gap={1}>
        {String(v) && String(v) !== "null" ? (
          String(v).split(",").map((dc: string, i: number) => (
            <Link
              key={i}
              href={`/dc/`}
              className="no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Box className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
                <SmallText className="text-inherit font-bold leading-none">{dc.trim()}</SmallText>
              </Box>
            </Link>
          ))
        ) : (
          <SmallText className="text-slate-400 italic">Direct</SmallText>
        )}
      </Flex>
    ),
  },
  {
    key: "po_numbers",
    label: "Linked POs",
    width: "14%",
    render: (v) => (
      <Flex wrap gap={1}>
        {String(v) && String(v) !== "null" ? (
          String(v).split(",").map((po: string, i: number) => (
            <Link
              key={i}
              href={`/po/`}
              className="no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Box className="px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <SmallText className="text-inherit font-bold leading-none">{po.trim()}</SmallText>
              </Box>
            </Link>
          ))
        ) : (
          <SmallText className="text-slate-400 italic">Direct</SmallText>
        )}
      </Flex>
    ),
  },
  {
    key: "customer_gstin",
    label: "CUSTOMER GSTIN",
    width: "15%",
    render: (v) => (
      <Body className="font-mono text-slate-600">
        {String(v) || "N/A"}
      </Body>
    ),
  },
  {
    key: "total_invoice_value",
    label: "TOTAL VALUE",
    sortable: true,
    align: "right",
    width: "15%",
    isCurrency: true,
  },
  {
    key: "igst",
    label: "IGST",
    align: "right",
    width: "10%",
    isCurrency: true,
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
        variant: "default",
      },
      {
        title: "Pending Payments",
        value: formatIndianCurrency(stats?.pending_payments || 0),
        icon: <Clock size={24} />,
        variant: "default",
      },
      {
        title: "Total Invoiced",
        value: formatIndianCurrency(stats?.total_invoiced || 0),
        icon: <Activity size={24} />,
        variant: "default",
      },
    ],
    [invoices.length, stats],
  );

  // Toolbar
  // Master Reference: Toolbar Construction (Atomic)
  const handleSearch = useCallback((val: string) => {
    setSearchQuery(val);
  }, []);

  const toolbar = (
    <Flex align="center" gap={3}>
      <SearchBar
        value={searchQuery}
        onChange={handleSearch}
        placeholder="Search Invoices..."
        className="w-64"
      />

      <Button
        variant="default"
        size="sm"
        onClick={() => router.push("/invoice/create")}
        className="bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10"
      >
        <Flex align="center">
          <Plus size={16} className="mr-2" />
          <Body className="text-inherit">New Invoice</Body>
        </Flex>
      </Button>
    </Flex>
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
