"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, DashboardSummary, ActivityItem } from "@/lib/api";
import { Receipt, Clock, Truck, Activity, Plus, BarChart3, ArrowRight, Users, FileText } from "lucide-react";
import { formatIndianCurrency, cn } from "@/lib/utils";
import { H1, H3, SmallText, Body } from "@/components/design-system/atoms/Typography";
import { Button } from "@/components/design-system/atoms/Button";
import { Card } from "@/components/design-system/atoms/Card";
import { Badge } from "@/components/design-system/atoms/Badge";
import { SummaryCards } from "@/components/design-system/organisms/SummaryCards";
import { DataTable, Column } from "@/components/design-system/organisms/DataTable";
import { Accounting } from "@/components/design-system";

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [summaryData, activityData] = await Promise.all([
          api.getDashboardSummary(),
          api.getRecentActivity(20)
        ]);
        setSummary(summaryData);
        setActivity(activityData);
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  // Table columns for recent activity (no description)
  const activityColumns: Column<ActivityItem>[] = [
    {
      key: "number",
      label: "Record",
      width: "25%",
      render: (_value, item) => (
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => {
            const path = item.type === 'PO' ? `/po/${item.number}`
              : item.type === 'DC' ? `/dc/${item.number}`
                : `/invoice/${item.number}`;
            router.push(path);
          }}
        >
          <div className={cn(
            "p-1.5 rounded-md transition-colors",
            item.type === 'Invoice' ? 'bg-[#1A3D7C]/10 text-[#1A3D7C] group-hover:bg-[#1A3D7C]/20' :
              item.type === 'PO' ? 'bg-slate-100 text-slate-600 group-hover:bg-slate-200' :
                'bg-[#2BB7A0]/10 text-[#2BB7A0] group-hover:bg-[#2BB7A0]/20'
          )}>
            {item.type === 'Invoice' ? <Receipt size={14} /> : item.type === 'PO' ? <FileText size={14} /> : <Truck size={14} />}
          </div>
          <div className="font-medium truncate text-slate-950 group-hover:text-[#1A3D7C] transition-colors">{item.number}</div>
        </div>
      )
    },
    {
      key: "amount",
      label: "Amount",
      width: "25%",
      align: "right",
      render: (_value, item) => (
        <Accounting isCurrency className="text-slate-900 font-medium">{item.amount}</Accounting>
      )
    },
    {
      key: "status",
      label: "Status",
      width: "25%",
      render: (_value, item) => (
        <Badge variant={item.status === 'Completed' ? 'success' : 'warning'}>
          {item.status}
        </Badge>
      )
    },
    {
      key: "date",
      label: "Date",
      width: "25%",
      align: "right",
      render: (_value, item) => (
        <span className="text-[#6B7280] text-[12px] whitespace-nowrap">{item.date}</span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Body className="text-[#6B7280] animate-pulse">Loading dashboard...</Body>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <H1>Dashboard</H1>
          <Body className="text-[#6B7280] mt-1">
            Business intelligence overview
          </Body>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => router.push('/reports')}>
            <BarChart3 size={16} />
            Analytics
          </Button>
          <Button variant="default" size="sm" onClick={() => router.push('/po/create')}>
            <Plus size={16} />
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <SummaryCards
        cards={[
          {
            title: 'Total Sales',
            value: <Accounting isCurrency className="text-xl text-white">{summary?.total_sales_month || 0}</Accounting>,
            icon: <Receipt size={20} />,
            variant: 'primary',
          },
          {
            title: 'Total Purchase',
            value: <Accounting isCurrency className="text-xl text-white">{summary?.total_po_value || 0}</Accounting>,
            icon: <Activity size={20} />,
            variant: 'success',
          },
          {
            title: 'Active POs',
            value: <Accounting className="text-xl text-white">{summary?.active_po_count || 0}</Accounting>,
            icon: <Activity size={20} />,
            variant: 'warning',
          },
          {
            title: 'Pipeline Volume',
            value: <Accounting isCurrency className="text-xl text-white">{summary?.total_po_value || 0}</Accounting>,
            icon: <Activity size={20} />,
            variant: 'secondary',
            trend: {
              value: String(summary?.po_value_growth || "0%"),
              direction: 'up'
            }
          }
        ]}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <H3>Recent Activity</H3>
            <Button variant="ghost" size="sm" onClick={() => router.push('/reports')}>
              View All
              <ArrowRight size={16} />
            </Button>
          </div>

          <DataTable
            columns={activityColumns}
            data={activity}
            keyField="number"
            pageSize={10}
          />
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          <H3>Quick Actions</H3>
          <div className="space-y-3">
            <QuickActionCard
              title="Create Purchase Order"
              description="Initiate new procurement request"
              icon={<Plus size={20} />}
              onClick={() => router.push("/po/create")}
            />
            <QuickActionCard
              title="Create Delivery Challan"
              description="Generate shipping documentation"
              icon={<Truck size={20} />}
              onClick={() => router.push("/dc/create")}
            />
            <QuickActionCard
              title="Create Invoice"
              description="Issue billing document"
              icon={<Receipt size={20} />}
              onClick={() => router.push("/invoice/create")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({
  title,
  description,
  icon,
  onClick
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void
}) {
  return (
    <Card
      className={cn(
        "p-4 flex items-center gap-4 cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:border-[#1A3D7C]/20"
      )}
      onClick={onClick}
    >
      <div className="p-3 rounded-lg bg-[#1A3D7C]/10 text-[#1A3D7C] shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-slate-950">{title}</div>
        <SmallText className="text-[#6B7280] mt-0.5">{description}</SmallText>
      </div>
      <ArrowRight size={16} className="text-[#9CA3AF] shrink-0" />
    </Card>
  );
}
