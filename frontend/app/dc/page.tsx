"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Truck, Plus, CheckCircle, Clock, Download, Layers, Activity } from "lucide-react";
import { api, DCListItem, DCStats } from "@/lib/api";
import { formatDate, formatIndianCurrency } from "@/lib/utils";
import { ListPageTemplate } from "@/components/design-system/templates/ListPageTemplate";
import { SearchBar as AtomicSearchBar } from "@/components/design-system/molecules/SearchBar";
import { Accounting, TableCells, Body } from '@/components/design-system';
import { Button } from "@/components/design-system/atoms/Button";
import { Badge } from "@/components/design-system/atoms/Badge";
import type { Column, SummaryCardProps } from "@/components/design-system";

export default function DCListPage() {
  const router = useRouter();
  const [dcs, setDCs] = useState<DCListItem[]>([]);
  const [stats, setStats] = useState<DCStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dcData, statsData] = await Promise.all([
          api.listDCs(),
          api.getDCStats()
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
    return dcs.filter(dc =>
      dc.dc_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dc.po_number?.toString() || "").includes(searchQuery) ||
      (dc.consignee_name && dc.consignee_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [dcs, searchQuery]);

  // Table columns
  const columns: Column<DCListItem>[] = [
    {
      key: "dc_number",
      label: "DC Number",
      sortable: true,
      width: "15%",
      render: (_value, dc) => (
        <div
          onClick={() => router.push(`/dc/${dc.dc_number}`)}
          className="text-[#1A3D7C] font-medium cursor-pointer hover:underline"
        >
          {dc.dc_number}
        </div>
      )
    },
    {
      key: "dc_date",
      label: "Date",
      sortable: true,
      width: "15%",
      render: (_value, dc) => (
        <span className="text-[#6B7280]">{formatDate(dc.dc_date)}</span>
      )
    },
    {
      key: "consignee_name",
      label: "Consignee",
      sortable: true,
      width: "25%",
      render: (_value, dc) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#1A3D7C]/10 flex items-center justify-center text-[#1A3D7C] font-medium text-[10px] shrink-0">
            {dc.consignee_name ? dc.consignee_name.substring(0, 2).toUpperCase() : 'CN'}
          </div>
          <Body className="truncate font-medium">{dc.consignee_name}</Body>
        </div>
      )
    },
    {
      key: "po_number",
      label: "PO Reference",
      sortable: true,
      width: "15%",
      render: (_value, dc) => (
        <span className="text-[#6B7280]">{dc.po_number || 'N/A'}</span>
      )
    },
    {
      key: "total_value",
      label: "Total Value",
      sortable: true,
      align: "right",
      width: "15%",
      render: (_v, dc) => (
        <Accounting className="text-slate-950 font-medium">{dc.total_value}</Accounting>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      width: "15%",
      render: (_value, dc) => (
        <Badge variant={dc.status === 'Delivered' ? 'success' : 'warning'}>
          {dc.status}
        </Badge>
      )
    }
  ];

  // Summary cards
  const summaryCards: SummaryCardProps[] = [
    {
      title: 'Total Challans',
      value: <Accounting className="text-xl text-white">{dcs.length}</Accounting>,
      icon: <Truck size={24} />,
      variant: 'primary',
    },
    {
      title: 'Delivered',
      value: <Accounting className="text-xl text-white">{stats?.completed_delivery || 0}</Accounting>,
      icon: <Clock size={24} />,
      variant: 'secondary'
    },
    {
      title: 'In Transit',
      value: <Accounting className="text-xl text-white">{stats?.pending_delivery || 0}</Accounting>,
      icon: <Truck size={24} />,
      variant: 'warning'
    },
    {
      title: 'Total Challans',
      value: <Accounting className="text-xl text-white">{stats?.total_challans || 0}</Accounting>,
      icon: <Activity size={24} />,
      variant: 'primary',
      trend: {
        value: '+8.2%',
        direction: 'up'
      }
    }
  ];

  // Toolbar with search and actions
  const toolbar = (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      <div className="flex-1 w-full max-w-md">
        <AtomicSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by DC number, PO, or consignee..."
        />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="default" size="sm" onClick={() => router.push('/dc/create')}>
          <Plus size={16} />
          Create New
        </Button>
      </div>
    </div>
  );

  return (
    <ListPageTemplate
      title="Delivery Challans"
      subtitle="Manage and track all delivery documentation"
      toolbar={toolbar}
      summaryCards={summaryCards}
      columns={columns}
      data={filteredDCs}
      keyField="dc_number"
      exportable
      onExport={() => window.open(`${api.baseUrl}/api/reports/register/dc?export=true`, '_blank')}
      loading={loading}
      emptyMessage="No delivery challans found"
    />
  );
}
