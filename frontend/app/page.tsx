"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, DashboardSummary, ActivityItem } from "@/lib/api";
import { FileText, Truck, Receipt, MoveUpRight, Clock, Sparkles, AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { DenseTable } from "@/components/ui/DenseTable";
import { formatDate } from "@/lib/utils";
import ReconciliationBadge from "@/components/ui/ReconciliationBadge";

export default function DashboardPage() {
  const router = useRouter();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [insights, setInsights] = useState<{ type: 'success' | 'warning' | 'error'; text: string; action: string }[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [insightsData, summaryData, activityData] = await Promise.all([
          api.getDashboardInsights(),
          api.getDashboardSummary(),
          api.getRecentActivity(15) // Increased count to leverage density
        ]);

        setInsights(insightsData);
        setSummary(summaryData);
        setActivity(activityData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh] text-slate-400 font-medium animate-pulse">
      Loading Financial Overview...
    </div>
  );

  if (error) return (
    <GlassCard className="border-red-200 bg-red-50/50 text-red-600 flex items-center gap-3">
      <AlertCircle className="w-5 h-5" />
      {error}
    </GlassCard>
  );

  if (!summary) return null;

  // Table Columns for Activity
  const activityColumns = [
    {
      header: "Reference ID",
      accessorKey: "number" as keyof ActivityItem,
      cell: (item: ActivityItem) => (
        <div className="flex items-center gap-2 font-medium">
          <span className={item.type === 'Invoice' ? 'text-blue-600' : 'text-purple-600'}>
            {item.type === 'Invoice' ? <FileText className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
          </span>
          <span className="text-slate-700">{item.type}-{item.number}</span>
        </div>
      )
    },
    {
      header: "Date",
      accessorKey: "date" as keyof ActivityItem,
      className: "w-32",
      cell: (item: ActivityItem) => <span className="text-slate-600 font-medium text-xs">{formatDate(item.date)}</span>
    },
    {
      header: "Amount",
      accessorKey: "amount" as keyof ActivityItem,
      className: "text-right font-medium text-slate-700",
      cell: (item: ActivityItem) => item.amount ? `₹${item.amount.toLocaleString()}` : '-'
    },
    {
      header: "Status",
      accessorKey: "status" as keyof ActivityItem,
      className: "text-right w-32",
      cell: (item: ActivityItem) => <StatusBadge status={item.status} className="ml-auto" />
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-4 md:p-6 space-y-6">
      {/* Header & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Financial Overview</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Snapshot for {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Compact Insight Pills */}
        {insights.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {insights.slice(0, 3).map((insight, idx) => (
              <div key={idx} onClick={() => router.push('/reports')}
                className="glass px-3 py-1.5 rounded-full flex items-center gap-2 text-xs cursor-pointer hover:bg-white/80 transition-colors whitespace-nowrap">
                <span className={insight.type === 'error' ? 'text-red-500' : insight.type === 'warning' ? 'text-amber-500' : 'text-emerald-500'}>
                  ●
                </span>
                <span className="text-slate-700 font-medium">{insight.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPI Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiTile
          title="Total Sales (Month)"
          value={`₹${summary.total_sales_month.toLocaleString('en-IN')}`}
          trend={summary.sales_growth}
          icon={FileText}
          color="blue"
        />
        <KpiTile
          title="Pending POs"
          value={summary.pending_pos}
          trend={`${summary.new_pos_today} new`}
          icon={Clock}
          color="amber"
        />
        <KpiTile
          title="Active Challans"
          value={summary.active_challans}
          trend="In Transit"
          icon={Truck}
          color="purple"
        />
        <KpiTile
          title="Total PO Value (YTD)"
          value={`₹${summary.total_po_value.toLocaleString('en-IN')}`}
          trend={summary.po_value_growth}
          icon={Receipt}
          color="emerald"
        />
      </div>

      {/* Global Reconciliation Snapshot (NEW) */}
      <GlassCard className="p-4 bg-white/40 border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">System Reconciliation Snapshot</h3>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Global Business Ledger Integrity</p>
            </div>
          </div>
          <div className="flex-1 max-w-md w-full md:px-8">
            <ReconciliationBadge
              ordered={summary.total_ordered || 0}
              delivered={summary.total_delivered || 0}
              received={summary.total_received || 0}
            />
          </div>
          <div className="hidden md:block">
            <button
              onClick={() => router.push('/reports')}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              Analyze Ledger
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dense Activity Feed */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Recent Movements</h3>
            <button onClick={() => router.push('/reports')} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
              View Full Ledger
            </button>
          </div>
          <DenseTable
            data={activity}
            columns={activityColumns}
            className="bg-white/40 shadow-sm"
            onRowClick={(item) => {
              if (item.type === 'PO') router.push(`/po/${item.number}`);
              else if (item.type === 'DC') router.push(`/dc/${item.number}`);
              else if (item.type === 'Invoice') router.push(`/invoice/${item.number}`);
            }}
          />
        </div>

        {/* Quick Actions (Sidebar) */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide px-1">Quick Actions</h3>
          <div className="space-y-2">
            <ActionTile
              title="New Purchase Order"
              desc="Draft supply order"
              icon={FileText}
              color="blue"
              onClick={() => router.push("/po/create")}
            />
            <ActionTile
              title="New Delivery Challan"
              desc="Dispatch material"
              icon={Truck}
              color="purple"
              onClick={() => router.push("/dc/create")}
            />
            <ActionTile
              title="Create Invoice"
              desc="Bill customer"
              icon={Receipt}
              color="emerald"
              onClick={() => router.push("/invoice/create")}
            />
            <ActionTile
              title="Upload SRV"
              desc="Reconcile receipt"
              icon={Sparkles}
              color="indigo"
              onClick={() => router.push("/srv")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Micro-components
function KpiTile({ title, value, trend, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50/50 border-blue-100",
    amber: "text-amber-600 bg-amber-50/50 border-amber-100",
    purple: "text-purple-600 bg-purple-50/50 border-purple-100",
    emerald: "text-emerald-600 bg-emerald-50/50 border-emerald-100",
  };

  return (
    <GlassCard className="p-4 flex flex-col justify-between h-[110px] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-16 h-16" />
      </div>

      <div className="flex justify-between items-start relative z-10">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">{title}</span>
        <div className={`p-1.5 rounded-lg ${colors[color]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="relative z-10">
        <div className="text-[28px] font-bold text-slate-900 tracking-tight">{value}</div>
        <div className="text-[10px] font-medium flex items-center gap-1 text-slate-500 mt-0.5">
          {typeof trend === 'number' && trend > 0 && <MoveUpRight className="w-2.5 h-2.5 text-emerald-500" />}
          <span>{typeof trend === 'number' && trend > 0 ? `+${trend}%` : trend}</span>
        </div>
      </div>
    </GlassCard>
  );
}

function ActionTile({ title, desc, icon: Icon, color, onClick }: any) {
  const colors: Record<string, string> = {
    blue: "text-blue-600 group-hover:bg-blue-50",
    purple: "text-purple-600 group-hover:bg-purple-50",
    emerald: "text-emerald-600 group-hover:bg-emerald-50",
    indigo: "text-indigo-600 group-hover:bg-indigo-50",
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-white/40 hover:bg-white/40 hover:shadow-sm transition-all group"
    >
      <div className={`p-2 rounded-md bg-white/50 border border-white/60 shadow-sm transition-colors ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-700">{title}</div>
        <div className="text-[10px] text-slate-500">{desc}</div>
      </div>
    </button>
  );
}
