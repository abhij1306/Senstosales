"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  Plus,
  CheckCircle,
  Clock,
  Download,
  Layers,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { api, DCListItem, DCStats } from "@/lib/api";
import { formatDate, formatIndianCurrency } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/hooks/useDebounce";
import { ListPageTemplate } from "@/components/design-system/templates/ListPageTemplate";
import { SearchBar as AtomicSearchBar } from "@/components/design-system/molecules/SearchBar";
import { Accounting, Body } from "@/components/design-system/atoms/Typography";
import { TableRowCell as TableCells } from "@/components/design-system/molecules/TableCells";
import { Button } from "@/components/design-system/atoms/Button";
import { Badge } from "@/components/design-system/atoms/Badge";
import type { Column } from "@/components/design-system/organisms/DataTable";
import type { SummaryCardProps } from "@/components/design-system/organisms/SummaryCards";

// --- OPTIMIZATION: Static Columns Definitions ---
const columns: Column<DCListItem>[] = [
  {
    key: "dc_number",
    label: "DC NUMBER",
    sortable: true,
    width: "15%",
    render: (_value, dc) => (
      <Link
        href={`/dc/${dc.dc_number}`}
        className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
      >
        {dc.dc_number}
      </Link>
    ),
  },
  {
    key: "dc_date",
    label: "CHALLAN DATE",
    sortable: true,
    width: "15%",
    render: (_value, dc) => (
      <Body className="text-slate-500 font-medium">{formatDate(dc.dc_date)}</Body>
    ),
  },
  {
    key: "consignee_name",
    label: "CONSIGNEE",
    sortable: true,
    width: "35%",
    render: (_value, dc) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-medium text-[10px] shrink-0">
          {dc.consignee_name
            ? dc.consignee_name.substring(0, 2).toUpperCase()
            : "CN"}
        </div>
        <Body className="truncate font-medium">{dc.consignee_name}</Body>
      </div>
    ),
  },
  {
    key: "po_number",
    label: "PO REFERENCE",
    sortable: true,
    width: "18%",
    render: (_value, dc) => (
      <Link href={`/po?search=${dc.po_number}`} className="hover:underline transition-all block">
        <Body className="text-slate-500 font-medium hover:text-blue-600">{dc.po_number || "N/A"}</Body>
      </Link>
    ),
  },
  {
    key: "status",
    label: "STATUS",
    sortable: true,
    align: "center",
    width: "5%",
    render: (_value, dc) => (
      <Badge variant={dc.status === "Delivered" ? "success" : "warning"}>
        {dc.status}
      </Badge>
    ),
  },
];

export default function DCListPage() {
  const router = useRouter();
  const [dcs, setDCs] = useState<DCListItem[]>([]);
  const [stats, setStats] = useState<DCStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("dc-search")?.focus();
      }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("dc-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dcData, statsData] = await Promise.all([
          api.listDCs(),
          api.getDCStats(),
        ]);
        const dcWithKeys = (dcData || []).map((dc, idx) => ({
          ...dc,
          unique_id: `dc-${dc.dc_number}-${idx}`
        }));
        setDCs(dcWithKeys);
        setStats(statsData);
      } catch (err) {
        console.error("DC Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredDCs = useMemo(() => {
    return dcs.filter(
      (dc) =>
        dc.dc_number.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (dc.po_number?.toString() || "").includes(debouncedSearch) ||
        (dc.consignee_name &&
          dc.consignee_name
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase())),
    );
  }, [dcs, debouncedSearch]);

  // --- OPTIMIZATION: Memoized Summary Cards ---
  const summaryCards = useMemo(
    (): SummaryCardProps[] => [
      {
        title: "Total Challans",
        value: (
          <Accounting short className="text-2xl text-white font-medium">
            {stats?.total_challans || dcs.length}
          </Accounting>
        ),
        icon: <Activity size={24} />,
        variant: "primary",
      },
      {
        title: "Delivered",
        value: (
          <Accounting short className="text-2xl text-white font-medium">
            {stats?.completed_delivery || 0}
          </Accounting>
        ),
        icon: <CheckCircle size={24} />,
        variant: "secondary",
      },
      {
        title: "Total Value",
        value: (
          <Accounting isCurrency short className="text-2xl text-white font-medium">
            {stats?.total_value || 0}
          </Accounting>
        ),
        icon: <Download size={24} />,
        variant: "success",
      },
      {
        title: "In Transit",
        value: (
          <Accounting short className="text-2xl text-white font-medium">
            {stats?.pending_delivery || 0}
          </Accounting>
        ),
        icon: <Truck size={24} />,
        variant: "warning",
      },
    ],
    [dcs.length, stats],
  );

  // Toolbar with search and actions
  const toolbar = (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      <div className="flex-1 w-full max-w-md">
        <AtomicSearchBar
          id="dc-search"
          name="dc-search"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by DC number, PO, or consignee..."
        />
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="default"
          size="sm"
          onClick={useCallback(() => router.push("/dc/create"), [router])}
        >
          <Plus size={16} />
          Create New
        </Button>
      </div>
    </div>
  );

  return (
    <ListPageTemplate
      title="DELIVERY CHALLANS"
      subtitle="Manage and track all delivery documentation"
      toolbar={toolbar}
      summaryCards={summaryCards}
      columns={columns}
      data={filteredDCs}
      keyField="unique_id"
      page={page}
      pageSize={pageSize}
      totalItems={filteredDCs.length}
      onPageChange={useCallback((newPage: number) => setPage(newPage), [])}
      exportable
      onExport={useCallback(() =>
        window.open(
          `${api.baseUrl}/api/reports/register/dc?export=true`,
          "_blank",
        ),
        [])}
      loading={loading}
      emptyMessage="No delivery challans found"
    />
  );
}
