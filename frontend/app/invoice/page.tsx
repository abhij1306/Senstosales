"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Clock,
  Activity,
} from "lucide-react";
import { api, InvoiceListItem, InvoiceStats } from "@/lib/api";
import { formatDate, formatIndianCurrency } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/hooks/useDebounce";
import { ListPageTemplate } from "@/components/design-system/templates/ListPageTemplate";
import { SearchBar as AtomicSearchBar } from "@/components/design-system/molecules/SearchBar";
import { Accounting, Body } from "@/components/design-system/atoms/Typography";
import { Button } from "@/components/design-system/atoms/Button";
import { Badge } from "@/components/design-system/atoms/Badge";
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
      <Link
        href={`/invoice/${encodeURIComponent(inv.invoice_number)}`}
        className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
      >
        {inv.invoice_number}
      </Link>
    ),
  },
  {
    key: "invoice_date",
    label: "DATE",
    sortable: true,
    width: "10%",
    render: (_value, inv) => (
      <Body className="text-slate-500 font-medium whitespace-nowrap">
        {formatDate(inv.invoice_date)}
      </Body>
    ),
  },
  {
    key: "linked_dc_numbers",
    label: "Linked DCs",
    width: "14%",
    render: (_value, inv) => (
      <div className="flex flex-wrap gap-1">
        {inv.linked_dc_numbers ? (
          inv.linked_dc_numbers.split(",").map((dc: string, i: number) => (
            <Link key={i} href={`/dc?search=${dc.trim()}`}>
              <Badge
                variant="secondary"
                className="px-2 py-0.5 hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer"
              >
                {dc.trim()}
              </Badge>
            </Link>
          ))
        ) : (
          <Body className="text-slate-400 font-medium italic text-[11px]">Direct</Body>
        )}
      </div>
    ),
  },
  {
    key: "po_numbers",
    label: "Linked POs",
    width: "14%",
    render: (_value, inv) => (
      <div className="flex flex-wrap gap-1">
        {inv.po_numbers ? (
          inv.po_numbers.split(",").map((po: string, i: number) => (
            <Link key={i} href={`/po?search=${po.trim()}`}>
              <Badge
                variant="outline"
                className="px-2 py-0.5 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
              >
                {po.trim()}
              </Badge>
            </Link>
          ))
        ) : (
          <Body className="text-slate-400 font-medium italic text-[11px]">Direct</Body>
        )}
      </div>
    ),
  },
  {
    key: "customer_gstin",
    label: "CUSTOMER GSTIN",
    width: "15%",
    render: (_value, inv) => (
      <Body className="font-mono text-[12px] font-medium">
        {inv.customer_gstin || "N/A"}
      </Body>
    ),
  },
  {
    key: "total_invoice_value",
    label: "TOTAL VALUE",
    sortable: true,
    align: "right",
    width: "15%",
    render: (_value, inv) => (
      <Accounting isCurrency className="text-slate-950 font-medium">
        {inv.total_invoice_value}
      </Accounting>
    ),
  },
  {
    key: "igst",
    label: "IGST",
    align: "right",
    width: "10%",
    render: (_value, inv) => (
      <Accounting className="text-slate-500 font-medium">
        {formatIndianCurrency(inv.igst || 0)}
      </Accounting>
    ),
  },
  {
    key: "status",
    label: "STATUS",
    sortable: true,
    width: "10%",
    render: (_value, inv) => (
      <Badge variant={inv.status === "Paid" ? "success" : "warning"}>
        {inv.status || "Pending"}
      </Badge>
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
    const fetchData = async () => {
      try {
        const [invoicesData, statsData] = await Promise.all([
          api.listInvoices(),
          api.getInvoiceStats(),
        ]);
        const invoicesWithKeys = (invoicesData || []).map((inv, idx) => ({
          ...inv,
          unique_id: `inv-${inv.invoice_number}-${idx}`
        }));
        setInvoices(invoicesWithKeys);
        setStats(statsData);
      } catch (err) {
        console.error("Invoice Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const summaryCards = useMemo(
    (): SummaryCardProps[] => [
      {
        title: "Total Invoices",
        value: (
          <Accounting className="text-2xl text-white font-medium">
            {invoices.length}
          </Accounting>
        ),
        icon: <Receipt size={24} />,
        variant: "primary",
      },
      {
        title: "Paid Invoices",
        value: (
          <Accounting isCurrency short className="text-2xl text-white font-medium">
            {stats?.total_invoiced || 0}
          </Accounting>
        ),
        icon: <Clock size={24} />,
        variant: "success",
      },
      {
        title: "Pending Payments",
        value: (
          <Accounting isCurrency short className="text-2xl text-white font-medium">
            {stats?.pending_payments || 0}
          </Accounting>
        ),
        icon: <Clock size={24} />,
        variant: "warning",
      },
      {
        title: "Total Invoiced",
        value: (
          <Accounting isCurrency short className="text-2xl text-white font-medium">
            {stats?.total_invoiced || 0}
          </Accounting>
        ),
        icon: <Activity size={24} />,
        variant: "secondary",
      },
    ],
    [invoices.length, stats],
  );

  const toolbar = (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      <div className="flex-1 w-full max-w-md">
        <AtomicSearchBar
          id="invoice-search"
          name="invoice-search"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by invoice number or GSTIN..."
        />
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="default"
          size="sm"
          onClick={useCallback(() => router.push("/invoice/create"), [router])}
        >
          <Plus size={16} />
          Create New
        </Button>
      </div>
    </div>
  );

  return (
    <ListPageTemplate
      title="GST INVOICES"
      subtitle="Manage all billing documentation and compliance"
      toolbar={toolbar}
      summaryCards={summaryCards}
      columns={columns}
      data={filteredInvoices}
      keyField="unique_id"
      page={page}
      pageSize={pageSize}
      totalItems={filteredInvoices.length}
      onPageChange={useCallback((newPage: number) => setPage(newPage), [])}
      exportable
      onExport={useCallback(() =>
        window.open(
          `${api.baseUrl}/api/reports/register/invoice?export=true`,
          "_blank",
        ),
        [])}
      loading={loading}
      emptyMessage="No invoices found"
    />
  );
}
