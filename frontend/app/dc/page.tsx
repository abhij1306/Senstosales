"use client";

import { useEffect, useState, useMemo } from "react";
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
import { StatusBadge } from "@/components/design-system/organisms/StatusBadge";
import { ListPageTemplate } from "@/components/design-system/templates/ListPageTemplate";
import { Input } from "@/components/design-system/atoms/Input";
import { Accounting } from "@/components/design-system/atoms/Typography";
import { Button } from "@/components/design-system/atoms/Button";
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
      <Link href={`/dc/${dc.dc_number}`} className="block">
        <div className="text-blue-600 font-semibold hover:underline">
          {dc.dc_number}
        </div>
      </Link>
    ),
  },
  {
    key: "dc_date",
    label: "CHALLAN DATE",
    sortable: true,
    width: "15%",
    render: (v) => (
      <span className="text-slate-500 font-medium">
        {formatDate(String(v))}
      </span>
    ),
  },
  {
    key: "consignee_name",
    label: "CONSIGNEE",
    sortable: true,
    width: "35%",
    render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0 border border-blue-100 uppercase text-[10px]">
          {String(v).substring(0, 2)}
        </div>
        <span className="truncate text-sm text-slate-700">{String(v)}</span>
      </div>
    ),
  },
  {
    key: "po_number",
    label: "PO REFERENCE",
    sortable: true,
    width: "18%",
    render: (v) => (
      <span className="text-slate-500 font-medium text-sm">
        {String(v) || "N/A"}
      </span>
    ),
  },
  {
    key: "status",
    label: "STATUS",
    sortable: true,
    align: "center",
    width: "5%",
    render: (v) => (
      <StatusBadge status={String(v)} />
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
    async function fetchDCs() {
      setLoading(true);
      try {
        const [dcsResponse, statsResponse] = await Promise.all([
          fetch("/api/dc/"),
          fetch("/api/dc/stats"),
        ]);

        if (!dcsResponse.ok) {
          throw new Error("Failed to fetch DCs");
        }

        const dcsResult = await dcsResponse.json();
        const statsResult = await statsResponse.json();

        // Handle unified response format
        const dcsData = dcsResult.data || dcsResult;
        const statsData = statsResult.data || statsResult;

        setDCs(dcsData);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching DCs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDCs();
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
        value: stats?.total_challans || dcs.length,
        icon: <Activity size={24} />,
        variant: "primary",
      },
      {
        title: "Delivered",
        value: stats?.completed_delivery || 0,
        icon: <CheckCircle size={24} />,
        variant: "success",
      },
      {
        title: "Total Value",
        value: formatIndianCurrency(stats?.total_value || 0),
        icon: <Download size={24} />,
        variant: "success",
      },
      {
        title: "In Transit",
        value: stats?.pending_delivery || 0,
        icon: <Truck size={24} />,
        variant: "warning",
      },
    ],
    [dcs.length, stats],
  );

  // Master Reference: Toolbar Construction (Atomic)
  const toolbar = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Input
          id="dc-search"
          name="dc-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search DCs..."
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
        onClick={() => router.push("/dc/create")}
        className="bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10"
      >
        <Plus size={16} className="mr-2" />
        New DC
      </Button>
    </div>
  );

  return (
    <ListPageTemplate
      title="DELIVERY CHALLANS"
      subtitle="Manage and track all delivery documentation"
      toolbar={toolbar}
      summaryCards={summaryCards}
      columns={columns as any}
      data={filteredDCs}
      keyField="dc_number"
      page={page}
      pageSize={pageSize}
      totalItems={filteredDCs.length}
      onPageChange={(newPage) => setPage(newPage)}
      loading={loading}
      emptyMessage="No delivery challans found"
    />
  );
}
