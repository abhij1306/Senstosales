"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, DashboardSummary, ActivityItem } from "@/lib/api";
import { FileText, Truck, Receipt, TrendingUp, Plus, MoveUpRight, Clock, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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
          api.getRecentActivity(10)
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

  const getStatusBadgeVariant = (status: string) => {
    const s = status.toLowerCase();
    if (['paid', 'active', 'completed'].includes(s)) return 'success';
    if (['pending', 'draft', 'open'].includes(s)) return 'warning';
    if (['overdue', 'cancelled', 'rejected'].includes(s)) return 'danger';
    return 'secondary';
  };

  if (loading) return <div className="text-text-muted animate-pulse p-8">Loading insights...</div>;
  if (error) return <div className="p-8 text-danger">{error}</div>;
  if (!summary) return null;

  return (
    <div className="space-y-8">
      {/* Header & Morning Briefing */}
      {/* Header & Compact Morning Briefing */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">Overview for {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Compact Morning Briefing */}
        {insights.length > 0 && (
          <div className="flex-1 max-w-2xl">
            <Card variant="glass" padding="sm" className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-100 flex items-center gap-3">
              <div className="p-1.5 bg-white/60 rounded-lg shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex flex-col">
                  {/* Show only the top insight in a very compact way, or maybe a ticker if multiple? 
                                 For now, let's show the most important one and a "+X more" badge if needed, 
                                 or just a clean list without big headers.
                             */}
                  {insights.slice(0, 2).map((insight, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs truncate">
                      <span className="shrink-0">{insight.type === 'error' ? '🔴' : insight.type === 'warning' ? '🟠' : '🟢'}</span>
                      <span className="text-text-primary font-medium truncate">{insight.text}</span>
                      <button
                        onClick={() => {
                          if (insight.action === 'view_pending') router.push('/reports?tab=pending');
                          else if (insight.action === 'view_uninvoiced') router.push('/reports?tab=uninvoiced');
                          else router.push('/reports');
                        }}
                        className="text-primary hover:underline font-semibold shrink-0"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Sales (Month)"
          value={`₹${summary.total_sales_month.toLocaleString('en-IN')}`}
          trend={`+${summary.sales_growth}%`}
          icon={FileText}
          variant="primary"
        />
        <KpiCard
          title="Pending POs"
          value={summary.pending_pos.toString()}
          trend={`${summary.new_pos_today} new`}
          icon={Clock}
          variant="warning"
        />
        <KpiCard
          title="Active Challans"
          value={summary.active_challans.toString()}
          trend="Active"
          icon={Truck}
          variant="purple"
        />
        <KpiCard
          title="Total PO Value"
          value={`₹${summary.total_po_value.toLocaleString('en-IN')}`}
          trend={`+${summary.po_value_growth}%`}
          icon={Receipt}
          variant="success"
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions (Dense Table) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Recent Transactions</h3>
            <button onClick={() => router.push("/reports")} className="text-xs font-medium text-primary hover:underline">View All</button>
          </div>

          <Card padding="none" className="overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-2/50 text-text-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider pl-6">ID</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {activity.map((item, i) => (
                  <tr key={i} className="hover:bg-surface-2/30 transition-colors group cursor-pointer">
                    <td className="px-4 py-2.5 pl-6 font-medium text-text-primary">
                      <div className="flex items-center gap-2">
                        <span className={item.type === 'Invoice' ? 'text-blue-600' : 'text-purple-600'}>
                          {item.type === 'Invoice' ? <FileText className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                        </span>
                        {item.type}-{item.number}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-text-muted">{item.date}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-text-primary">
                      {item.amount ? `₹${item.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right pr-6">
                      <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-text-primary">Quick Actions</h3>
          <div className="grid gap-3">
            <ActionCard
              icon={FileText}
              title="New Purchase Order"
              desc="Draft a new PO for suppliers"
              onClick={() => router.push("/po/create")}
              color="blue"
            />
            <ActionCard
              icon={Truck}
              title="New Delivery Challan"
              desc="Generate DC for dispatch"
              onClick={() => router.push("/dc/create")}
              color="purple"
            />
            <ActionCard
              icon={Receipt}
              title="Create Invoice"
              desc="Create GST invoice for sales"
              onClick={() => router.push("/invoice/create")}
              color="green"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for cleaner file
function KpiCard({ title, value, trend, icon: Icon, variant }: any) {
  const colors: any = {
    primary: "text-blue-600 bg-blue-50",
    warning: "text-amber-600 bg-amber-50",
    purple: "text-purple-600 bg-purple-50",
    success: "text-emerald-600 bg-emerald-50",
  };

  return (
    <Card className="flex flex-col justify-between h-[130px]">
      <div className="flex justify-between items-start">
        <p className="label-muted">{title}</p>
        <div className={`p-2 rounded-lg ${colors[variant] || colors.primary}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-text-primary tracking-tight">{value}</h3>
        <div className="flex items-center mt-1 text-xs font-medium text-text-secondary">
          {variant !== 'purple' && <MoveUpRight className="w-3 h-3 mr-1 text-success" />}
          <span>{trend}</span>
        </div>
      </div>
    </Card>
  );
}

function ActionCard({ icon: Icon, title, desc, onClick, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
    purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
    green: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-3 border border-border bg-white hover:border-primary/20 hover:shadow-sm rounded-xl transition-all group text-left"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-semibold text-text-primary text-sm">{title}</div>
        <div className="text-xs text-text-muted">{desc}</div>
      </div>
    </button>
  );
}
