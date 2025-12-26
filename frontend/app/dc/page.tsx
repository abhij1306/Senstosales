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
        className="text-[#1A3D7C] font-medium hover:underline"
      >
        <motion.span layoutId={`dc-title-${dc.dc_number}`}>
          {dc.dc_number}
        </motion.span>
      </Link>
    ),
  },
  {
    key: "dc_date",
    label: "CHALLAN DATE",
    sortable: true,
    width: "15%",
    render: (_value, dc) => (
      <Body className="text-[#6B7280]">{formatDate(dc.dc_date)}</Body>
    ),
  },
  {
    key: "consignee_name",
    label: "CONSIGNEE",
    sortable: true,
    width: "35%",
    render: (_value, dc) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#1A3D7C]/10 flex items-center justify-center text-[#1A3D7C] font-medium text-[10px] shrink-0">
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
      <span className="text-[#6B7280]">{dc.po_number || "N/A"}</span>
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
    const loadData = async () => {
      try {
        const [dcData, statsData] = await Promise.all([
          api.listDCs(),
          api.getDCStats(),
        ]);
        setDCs(dcData || []);
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
          <Accounting short className="text-xl text-white">
            {stats?.total_challans || dcs.length}
          </Accounting>
        ),
        icon: <Activity size={24} />,
        variant: "primary",
      },
      {
        title: "Delivered",
        value: (
          <Accounting short className="text-xl text-white">
            {stats?.completed_delivery || 0}
          </Accounting>
        ),
        icon: <CheckCircle size={24} />,
        variant: "secondary",
      },
      {
        title: "Total Value",
        value: (
          <Accounting isCurrency short className="text-xl text-white">
            {stats?.total_value || 0}
          </Accounting>
        ),
        icon: <Download size={24} />,
        variant: "success",
      },
      {
        title: "In Transit",
        value: (
          <Accounting short className="text-xl text-white">
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
          onClick={() => router.push("/dc/create")}
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
      keyField="dc_number"
      page={page}
      pageSize={pageSize}
      totalItems={filteredDCs.length}
      onPageChange={(newPage) => setPage(newPage)}
      exportable
      onExport={() =>
        window.open(
          `${api.baseUrl}/api/reports/register/dc?export=true`,
          "_blank",
        )
      }
      loading={loading}
      emptyMessage="No delivery challans found"
    />
  );
}
