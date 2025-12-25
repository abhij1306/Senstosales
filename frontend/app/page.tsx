"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, DashboardSummary, ActivityItem } from "@/lib/api";
import { FileText, Truck, Receipt, MoveUpRight, Clock, Sparkles, AlertCircle, BarChart3, ArrowRight, Plus, Activity } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { formatIndianCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [summaryData, activityData] = await Promise.all([
          api.getDashboardSummary(),
          api.getRecentActivity(15)
        ]);
        setSummary(summaryData);
        setActivity(activityData);
      } catch (err) {
        console.error("Dashboard Load Error:", err);
        setError("System synchronization failure. Please verify backend connectivity.");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-blue-500 font-bold animate-pulse uppercase tracking-widest text-xs">
      Initialising Business Engine...
    </div>
  );

  if (error || !summary) return (
    <div className="p-12">
      <GlassCard className="border-rose-200 bg-rose-50/50 text-rose-700 flex items-center gap-4 p-8">
        <AlertCircle className="w-8 h-8" />
        <div>
          <h2 className="heading-md uppercase">Critical Interface Error</h2>
          <p className="text-xs font-medium opacity-80">{error || "Data stream interrupted."}</p>
        </div>
      </GlassCard>
    </div>
  );

  const activityColumns = [
    {
      header: "Movement ID",
      accessorKey: "number" as keyof ActivityItem,
      cell: (item: ActivityItem) => (
        <div className="flex items-center gap-3 font-bold">
          <div className={`p-1.5 rounded-lg ${item.type === 'Invoice' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
            {item.type === 'Invoice' ? <Receipt className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
          </div>
          <span className="text-slate-800 tracking-tight">{item.number}</span>
        </div>
      )
    },
    {
      header: "Movement Date",
      accessorKey: "date" as keyof ActivityItem,
      cell: (item: ActivityItem) => <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">{new Date(item.date).toLocaleDateString()}</span>
    },
    {
      header: "Gross Amount",
      accessorKey: "amount" as keyof ActivityItem,
      className: "text-right font-bold text-slate-800",
      cell: (item: ActivityItem) => <span className="text-accounting">{item.amount ? formatIndianCurrency(item.amount) : 'N/A'}</span>
    },
    {
      header: "Execution Status",
      accessorKey: "status" as keyof ActivityItem,
      className: "text-right w-32",
      cell: (item: ActivityItem) => (
        <span className={`badge-premium ${item.status === 'Completed' ? 'badge-emerald' : item.status === 'Pending' ? 'badge-amber' : 'badge-blue'}`}>
          {item.status.toUpperCase()}
        </span>
      )
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6 space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="heading-xl">Enterprise Overview</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium font-mono uppercase tracking-[0.2em]">
            Live Sync: {new Date().toLocaleTimeString()} • {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/reports')}
            className="btn-premium btn-ghost"
          >
            <BarChart3 className="w-4 h-4" />
            Analytical Ledger
          </button>
          <button
            onClick={() => router.push('/po/create')}
            className="btn-premium btn-primary shadow-xl"
          >
            <Plus className="w-4 h-4" />
            Initiate Purchase
          </button>
        </div>
      </div>

      {/* KPI Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiTile
          title="Monthly Revenue"
          value={formatIndianCurrency(summary.total_sales_month)}
          trend={summary.sales_growth}
          icon={Receipt}
          color="blue"
        />
        <KpiTile
          title="Open Procurement"
          value={summary.pending_pos}
          trend={`${summary.new_pos_today} New Today`}
          icon={Clock}
          color="amber"
        />
        <KpiTile
          title="Dispatched Logistics"
          value={summary.active_challans}
          trend="In Transit Flow"
          icon={Truck}
          color="purple"
        />
        <KpiTile
          title="YTD Volume"
          value={formatIndianCurrency(summary.total_po_value)}
          trend={summary.po_value_growth}
          icon={Activity}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Activity Ledger (Left) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="heading-md uppercase tracking-wider text-slate-800">Operational Real-time Feed</h3>
            <button onClick={() => router.push('/reports')} className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-2 group">
              Full System Audit <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="glass-panel overflow-hidden border-blue-50/50">
            <DenseTable
              data={activity}
              columns={activityColumns}
              className="bg-transparent border-none rounded-none"
              onRowClick={(item) => {
                if (item.type === 'PO') router.push(`/po/view?id=${item.number}`);
                else if (item.type === 'DC') router.push(`/dc/view?id=${item.number}`);
                else if (item.type === 'Invoice') router.push(`/invoice/view?id=${item.number}`);
              }}
            />
          </div>
        </div>

        {/* Global Strategy & Quick Actions (Right) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-panel p-6 bg-blue-600 text-white border-none shadow-blue-200/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest">Business Integrity</h3>
            </div>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-[10px] font-bold uppercase opacity-60">Ordered</span>
                <span className="text-lg font-bold tracking-tighter">{(summary.total_ordered || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-[10px] font-bold uppercase opacity-60">Delivered</span>
                <span className="text-lg font-bold tracking-tighter">{(summary.total_delivered || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase opacity-60">Fulfilled</span>
                <span className="text-lg font-bold tracking-tighter">{(summary.total_received || 0).toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => router.push('/reports')}
              className="w-full py-3 bg-white text-blue-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-lg active:scale-95"
            >
              Run Integrity Audit
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="heading-md uppercase tracking-wider text-slate-800 px-2">Rapid Execution</h3>
            <div className="grid grid-cols-1 gap-3">
              <ActionTile
                title="Draft PO"
                desc="Generate new supply chain order"
                icon={FileText}
                color="blue"
                onClick={() => router.push("/po/create")}
              />
              <ActionTile
                title="Log Dispatch"
                desc="Execute material movement"
                icon={Truck}
                color="purple"
                onClick={() => router.push("/dc/create")}
              />
              <ActionTile
                title="Issue Invoice"
                desc="Finalize financial billing cycle"
                icon={Receipt}
                color="emerald"
                onClick={() => router.push("/invoice/create")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiTile({ title, value, trend, icon: Icon, color }: any) {
  return (
    <GlassCard className="p-6 flex flex-col justify-between h-[130px] group border-white/60">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-label mb-0">{title}</span>
          <div className="text-2xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors uppercase">{value}</div>
        </div>
        <div className={`p-2 rounded-xl bg-${color}-50/50 border border-${color}-100 group-hover:scale-110 transition-transform`}>
          <Icon className={`w-4 h-4 text-${color}-600`} />
        </div>
      </div>
      <div className="text-[10px] font-bold flex items-center gap-1.5 text-slate-400 mt-2">
        {trend && (typeof trend === 'number' || trend.includes('%')) && (
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            <MoveUpRight className="w-2.5 h-2.5" />
            <span>{trend}</span>
          </div>
        )}
        {!trend?.toString().includes('%') && <span>{trend}</span>}
      </div>
    </GlassCard>
  );
}

function ActionTile({ title, desc, icon: Icon, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="glass-panel glass-panel-interactive w-full text-left flex items-center gap-4 p-4 group"
    >
      <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 border border-${color}-100 group-hover:bg-white group-hover:shadow-md transition-all`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs font-black text-slate-800 uppercase tracking-tighter">{title}</div>
        <div className="text-[10px] text-slate-400 font-medium italic mt-0.5">{desc}</div>
      </div>
    </button>
  );
}
