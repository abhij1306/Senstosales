"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Truck, CheckCircle, Clock } from "lucide-react";
import { api, DCListItem, DCStats } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { DenseTable } from "@/components/ui/DenseTable";

export default function DCListPage() {
  const router = useRouter();
  const [dcs, setDCs] = useState<DCListItem[]>([]);
  const [stats, setStats] = useState<DCStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dcData, statsData] = await Promise.all([
          api.listDCs(),
          api.getDCStats()
        ]);
        setDCs(dcData);
        setStats(statsData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load DC data:", err);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredDCs = dcs.filter(dc => {
    const matchesSearch =
      dc.dc_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dc.po_number?.toString() || "").includes(searchQuery) ||
      (dc.consignee_name && dc.consignee_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "All Status" || dc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: "DC Number",
      accessorKey: "dc_number" as keyof DCListItem,
      cell: (dc: DCListItem) => (
        <div className="font-medium text-purple-600">{dc.dc_number}</div>
      )
    },
    {
      header: "Date",
      accessorKey: "dc_date" as keyof DCListItem,
      cell: (dc: DCListItem) => <span className="text-slate-500">{formatDate(dc.dc_date)}</span>
    },
    {
      header: "Consignee",
      accessorKey: "consignee_name" as keyof DCListItem,
      cell: (dc: DCListItem) => (
        <div className="flex items-center gap-2 max-w-[200px] truncate">
          <div className="w-5 h-5 rounded bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold border border-indigo-100 uppercase shrink-0">
            {dc.consignee_name ? dc.consignee_name.substring(0, 2) : 'CN'}
          </div>
          <span className="text-slate-700 truncate">{dc.consignee_name}</span>
        </div>
      )
    },
    {
      header: "PO Ref",
      accessorKey: "po_number" as keyof DCListItem,
      cell: (dc: DCListItem) => (
        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
          PO-{dc.po_number}
        </span>
      )
    },
    {
      header: "Value",
      accessorKey: "total_value" as keyof DCListItem,
      className: "text-right font-medium",
      cell: (dc: DCListItem) => dc.total_value > 0 ? `₹${dc.total_value.toLocaleString('en-IN')}` : '-'
    },
    {
      header: "Status",
      accessorKey: "status" as keyof DCListItem,
      className: "text-right",
      cell: (dc: DCListItem) => <StatusBadge status={dc.status} className="ml-auto" />
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-slate-400 font-medium animate-pulse">
        Loading Dispatches...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-slate-900 tracking-tight">Delivery Challans</h1>
          <p className="text-xs text-slate-500 mt-0.5">Outbound delivery management</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/dc/create")}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm shadow-purple-500/20 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Challan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="flex flex-col justify-between h-[90px] p-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Dispatched</span>
              <Truck className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex flex-col">
              <div className="text-[28px] font-bold text-slate-800">{stats.total_challans}</div>
              <div className="text-[10px] text-emerald-600 font-medium">+5% vs last month</div>
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between h-[90px] p-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Transit</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-[28px] font-bold text-slate-800">{stats.pending_delivery}</div>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between h-[90px] p-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <div className="text-[28px] font-bold text-slate-800">{stats.completed_delivery}</div>
              <div className="text-[10px] text-emerald-600 font-medium">98% delivery success</div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by DC, PO or Consignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white/60 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-8 pr-8 py-1.5 bg-white/60 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-slate-700 font-medium h-[34px]"
          >
            <option>All Status</option>
            <option>Pending</option>
            <option>Delivered</option>
          </select>
          <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <DenseTable
        loading={loading}
        data={filteredDCs}
        columns={columns}
        onRowClick={(dc) => router.push(`/dc/view?id=${dc.dc_number}`)}
        className="bg-white/60 shadow-sm backdrop-blur-sm min-h-[500px]"
      />
    </div>
  );
}
