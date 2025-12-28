"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api, DashboardSummary, ActivityItem } from "@/lib/api";
import {
  Receipt,
  Clock,
  Truck,
  Activity,
  Plus,
  BarChart3,
  ArrowRight,
  Users,
  FileText,
} from "lucide-react";
import { formatIndianCurrency, cn } from "@/lib/utils";
import {
  H1,
  H3,
  SmallText,
  Body,
  Accounting,
} from "@/components/design-system/atoms/Typography";
import { Button } from "@/components/design-system/atoms/Button";
import { Card } from "@/components/design-system/atoms/Card";
import { Badge } from "@/components/design-system/atoms/Badge";
import { SummaryCards } from "@/components/design-system/organisms/SummaryCards";
import {
  DataTable,
  Column,
} from "@/components/design-system/organisms/DataTable";
import { StatusBadge } from "@/components/design-system/organisms/StatusBadge";
import {
  SummaryCardSkeleton,
  TableRowSkeleton,
} from "@/components/design-system/atoms/Skeleton";
import { Flex, Stack, Grid, Box } from "@/components/design-system/atoms/Layout";

// --- OPTIMIZATION: Static Column Definitions ---
// Moved outside component to prevent re-creation on render.
const createActivityColumns = (router: any): Column<ActivityItem>[] => [
  {
    key: "number",
    label: "RECORD",
    width: "40%",
    render: (_value, item) => (
      <Flex
        align="center"
        gap={3}
        className="cursor-pointer group py-1"
        onClick={() => {
          const path =
            item.type === "PO"
              ? `/po/${item.number}`
              : item.type === "DC"
                ? `/dc/${item.number}`
                : `/invoice/${item.number}`;
          router.push(path);
        }}
      >
        <motion.div
          layoutId={
            item.type === "PO"
              ? `po-icon-${item.number}`
              : item.type === "DC"
                ? `dc-icon-${item.number}`
                : `inv-icon-${item.number}`
          }
          className={cn(
            "p-2 rounded-lg transition-colors border shrink-0",
            "border-transparent group-hover:border-slate-200",
            item.type === "Invoice"
              ? "bg-blue-50 text-blue-700"
              : item.type === "PO"
                ? "bg-slate-100 text-slate-700"
                : "bg-emerald-50 text-emerald-700",
          )}
        >
          {item.type === "Invoice" ? (
            <Receipt size={16} />
          ) : item.type === "PO" ? (
            <FileText size={16} />
          ) : (
            <Truck size={16} />
          )}
        </motion.div>
        <motion.div
          layoutId={
            item.type === "PO"
              ? `po-title-${item.number}`
              : item.type === "DC"
                ? `dc-title-${item.number}`
                : `inv-title-${item.number}`
          }
          className="font-semibold text-sm text-slate-900 group-hover:text-blue-700 transition-colors whitespace-nowrap"
        >
          {item.number}
        </motion.div>
      </Flex>
    ),
  },
  {
    key: "amount",
    label: "AMOUNT",
    width: "20%",
    align: "right",
    render: (_value, item) => (
      <Accounting isCurrency className="text-slate-900 font-semibold">
        {item.amount || 0}
      </Accounting>
    ),
  },
  {
    key: "status",
    label: "STATUS",
    width: "20%",
    render: (_value, item) => (
      <StatusBadge status={item.status} className="w-24 justify-center" />
    ),
  },
  {
    key: "date",
    label: "DATE",
    width: "20%",
    align: "right",
    render: (_value, item) => (
      <SmallText className="text-slate-500 font-medium whitespace-nowrap leading-none">
        {item.date}
      </SmallText>
    ),
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Memoize columns to prevent re-creation
  const activityColumns = useMemo(
    () => createActivityColumns(router),
    [router],
  );

  useEffect(() => {
    setIsMounted(true);
    const loadDashboard = async () => {
      try {
        const [summaryData, activityData] = await Promise.all([
          api.getDashboardSummary(),
          api.getRecentActivity(20),
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

  // --- OPTIMIZATION: Moved outside component ---
  // activityColumns definition moved to top-level

  return (
    <Stack gap={6}>
      {/* Header */}
      <Flex align="center" justify="between">
        <Stack>
          <H1>DASHBOARD</H1>
          <Body className="text-[#6B7280] mt-1">
            Business intelligence overview
          </Body>
        </Stack>
        <Flex align="center" gap={3}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/reports")}
          >
            <BarChart3 size={16} />
            Analytics
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push("/po/create")}
          >
            <Plus size={16} />
            New Purchase Order
          </Button>
        </Flex>
      </Flex>

      {/* KPI Summary Cards */}
      <Box className="min-h-[140px]">
        <SummaryCards
          cards={[
            {
              title: "Total Sales",
              value: formatIndianCurrency(summary?.total_sales_month || 0),
              icon: <Receipt size={24} />,
              variant: "default",
            },
            {
              title: "Total Purchase",
              value: formatIndianCurrency(summary?.total_po_value || 0),
              icon: <Activity size={24} />,
              variant: "default",
            },
            {
              title: "Active POs",
              value: summary?.active_po_count || 0,
              icon: <Activity size={24} />,
              variant: "default",
            },
            {
              title: "Pipeline Volume",
              value: formatIndianCurrency(summary?.total_po_value || 0),
              icon: <Activity size={24} />,
              variant: "default",
              trend: {
                value: String(summary?.po_value_growth || "0%"),
                direction: "up",
              },
            },
          ]}
          loading={loading}
        />
      </Box>

      {/* Two-column layout */}
      {/* Two-column layout */}
      <Grid cols="1" className="lg:grid-cols-12" gap={6}>
        {/* Recent Activity Table */}
        <Stack className="lg:col-span-8" gap={4}>
          <Flex align="center" justify="between">
            <H3>Recent Activity</H3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/reports")}
            >
              View All
              <ArrowRight size={16} />
            </Button>
          </Flex>

          <Box className="min-h-[400px]">
            {loading ? (
              <Card className="p-0 overflow-hidden">
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
              </Card>
            ) : (
              <DataTable
                columns={activityColumns}
                data={activity}
                keyField="number"
                pageSize={10}
              />
            )}
          </Box>
        </Stack>

        {/* Quick Actions */}
        <Stack className="lg:col-span-4" gap={4}>
          <H3>Quick Actions</H3>
          <Stack gap={3}>
            <QuickActionCard
              title="Create Purchase Order"
              description="Initiate new procurement request"
              icon={<Plus size={20} />}
              onClick={() => router.push("/po/create")}
              layoutId="create-po-icon"
            />
            <QuickActionCard
              title="Create Delivery Challan"
              description="Generate shipping documentation"
              icon={<Truck size={20} />}
              onClick={() => router.push("/dc/create")}
              layoutId="create-dc-icon"
            />
            <QuickActionCard
              title="Create Invoice"
              description="Issue billing document"
              icon={<Receipt size={20} />}
              onClick={() => router.push("/invoice/create")}
              layoutId="create-invoice-icon"
            />
          </Stack>
        </Stack>
      </Grid>
    </Stack>
  );
}

// Quick Action Card Component
function QuickActionCard({
  title,
  description,
  icon,
  onClick,
  layoutId,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  layoutId?: string;
}) {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:border-[#1A3D7C]/20",
      )}
      onClick={onClick}
    >
      <Flex align="center" gap={4}>
        <motion.div
          layoutId={layoutId}
          className="p-3 rounded-lg bg-[#1A3D7C]/10 text-[#1A3D7C] shrink-0"
        >
          {icon}
        </motion.div>
        <Stack className="flex-1 min-w-0">
          <Body className="text-[14px] font-medium text-slate-950 leading-none">{title}</Body>
          <SmallText className="text-[#6B7280] mt-0.5">{description}</SmallText>
        </Stack>
        <ArrowRight size={16} className="text-[#9CA3AF] shrink-0" />
      </Flex>
    </Card>
  );
}
