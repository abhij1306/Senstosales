"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Truck, CheckCircle, Clock, Download, ArrowRight, Activity, Layers } from "lucide-react";
import { api, DCListItem, DCStats } from "@/lib/api";
import { formatDate, formatIndianCurrency } from "@/lib/utils";
import GlassCard from "@/components/ui/GlassCard";
import { DenseTable } from "@/components/ui/DenseTable";

export default function DCListPage() {
  const router = useRouter();
  const [dcs, setDCs] = useState<DCListItem[]>([]);
  const [stats, setStats] = useState<DCStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
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

  const filteredDCs = dcs.filter(dc =>
    dc.dc_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (dc.po_number?.toString() || "").includes(searchQuery) ||
    (dc.consignee_name && dc.consignee_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns = [
    {
      header: "Dispatch ID",
      accessorKey: "dc_number" as keyof DCListItem,
      cell: (dc: DCListItem) => (
        <div onClick={() => router.push(`/dc/view?id=${dc.dc_number}`)} className="link font-bold text-sm">{dc.dc_number}</div>
      )
    },
    {
      header: "Movement Date",
      accessorKey: "dc_date" as keyof DCListItem,
      cell: (dc: DCListItem) => <span className="text-meta font-bold uppercase">{formatDate(dc.dc_date)}</span>
    },
    {
      header: "Consignee",
      accessorKey: "consignee_name" as keyof DCListItem,
      cell: (dc: DCListItem) => (
        <div className="flex items-center gap-3 max-w-[250px] truncate">
          <div className="w-8 h-8 rounded-lg bg-indigo-50/50 flex items-center justify-center text-indigo-700 font-black border border-indigo-100 uppercase shrink-0 text-[10px]">
            {dc.consignee_name ? dc.consignee_name.substring(0, 2) : 'CN'}
          </div>
          <span className="text-slate-700 truncate text-xs font-semibold">{dc.consignee_name}</span>
        </div>
      )
    },
    {
      header: "PO Reference",
      accessorKey: "po_number" as keyof DCListItem,
      cell: (dc: DCListItem) => (
        <span className="badge-premium badge-blue">
          {dc.po_number}
        </span>
      )
    },
    {
      header: "Consignment Value",
      accessorKey: "total_value" as keyof DCListItem,
      className: "text-right",
      cell: (dc: DCListItem) => (
        <span className="text-accounting font-bold text-slate-800">
          {dc.total_value > 0 ? formatIndianCurrency(dc.total_value) : 'NO VALUE'}
        </span>
      )
    },
    {
      header: "Logistics Status",
      accessorKey: "status" as keyof DCListItem,
      className: "text-right",
      cell: (dc: DCListItem) => (
        <span className={`badge-premium ${dc.status === 'Completed' ? 'badge-emerald' : 'badge-amber'}`}>
          {dc.status.toUpperCase()}
        </span>
      )
    },
    {
      header: "",
      accessorKey: "dc_number" as keyof DCListItem,
      className: "w-10",
      cell: (dc: DCListItem) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(`${api.baseUrl}/api/dc/${dc.dc_number}/download`, '_blank');
          }}
          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
          title="Export Ledger"
        >
          <Download className="w-4 h-4" />
        </button>
      )
    }
  ];

  if (loading) return <div className="p-32 text-center animate-pulse text-purple-500 font-bold uppercase tracking-widest text-xs">Initializing Logistics Hub...</div>;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-purple-50/20 p-6 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="heading-xl flex items-center gap-4">
            <Truck className="w-8 h-8 text-purple-600" />
            Delivery Challan
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium italic">Manage outbound dispatches</p>
        </div>
        <button
          onClick={() => router.push("/dc/create")}
          className="btn-premium btn-primary shadow-xl bg-gradient-to-r from-purple-600 to-indigo-600"
        >
          <Plus className="w-4 h-4" />
          Create DC
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <KpiCard title="Total DC" value={stats.total_challans} icon={Layers} color="purple" trend="Total" />
          <KpiCard title="Pending" value={stats.pending_delivery} icon={Clock} color="amber" trend="In Transit" />
          <KpiCard title="Completed" value={stats.completed_delivery} icon={CheckCircle} color="emerald" trend="Delivered" />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
          <h2 className="heading-md uppercase tracking-wider text-slate-800">Delivery Challans</h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-premium pl-12 font-bold uppercase tracking-widest text-[10px]"
            />
          </div>
        </div>

        <div className="glass-panel overflow-hidden">
          <DenseTable
            loading={loading}
            data={filteredDCs}
            columns={columns}
            onRowClick={(dc) => router.push(`/dc/view?id=${dc.dc_number}`)}
            className="bg-transparent border-none rounded-none"
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <GlassCard className="p-6 h-[110px] flex flex-col justify-between group border-white/60">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-label uppercase opacity-60 m-0">{title}</span>
          <div className="text-2xl font-black text-slate-800 tracking-tighter mt-1 group-hover:text-purple-600 transition-colors">{value.toLocaleString()}</div>
        </div>
        <div className={`p-2 rounded-xl bg-${color}-50/50 border border-${color}-100 group-hover:scale-110 transition-transform`}>
          <Icon className={`w-4 h-4 text-${color}-600`} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase mt-2">
        <Activity className="w-3 h-3" /> {trend}
      </div>
    </GlassCard>
  );
}
