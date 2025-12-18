"use client";

import { useEffect, useState } from "react";
import { api, DashboardSummary, ActivityItem } from "@/lib/api";
import KpiCard from "@/components/KpiCard";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboardSummary(),
      api.getRecentActivity(10)
    ]).then(([summaryData, activityData]) => {
      setSummary(summaryData);
      setActivity(activityData);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load dashboard:", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Purchase Orders"
          value={summary?.total_pos || 0}
          subtitle="Total POs"
        />
        <KpiCard
          title="Delivery Challans"
          value={summary?.total_dcs || 0}
          subtitle="Total DCs"
        />
        <KpiCard
          title="Invoices"
          value={summary?.total_invoices || 0}
          subtitle="Total Invoices"
        />
        <KpiCard
          title="PO Value"
          value={`₹${(summary?.total_po_value || 0).toLocaleString()}`}
          subtitle="Total Value"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {activity.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs font-medium rounded ${item.type === 'PO' ? 'bg-blue-100 text-blue-700' :
                    item.type === 'DC' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                  }`}>
                  {item.type}
                </span>
                <div>
                  <div className="font-medium text-gray-900">{item.number}</div>
                  <div className="text-sm text-gray-500">{item.description}</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">{item.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
