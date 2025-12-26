"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Package,
  AlertTriangle,
  CheckCircle,
  Activity,
  ClipboardCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  H1,
  H3,
  SmallText,
  Body,
  Accounting,
  Label,
} from "@/components/design-system/atoms/Typography";
import { Button } from "@/components/design-system/atoms/Button";
import { Badge } from "@/components/design-system/atoms/Badge";
import { Card } from "@/components/design-system/atoms/Card";
import { DocumentTemplate } from "@/components/design-system/templates/DocumentTemplate";
import type { Column } from "@/components/design-system/organisms/DataTable";
import { DataTable } from "@/components/design-system/organisms/DataTable";

export default function SRVDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [srv, setSrv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Columns definition moved to top to prevent Hook order violation
  const itemColumns = useMemo<Column<any>[]>(
    () => [
      { key: "div_code", label: "DIV", align: "center", width: "5%" },
      {
        key: "po_item_no",
        label: "Item",
        width: "10%",
        render: (_v: any, row: any) => (
          <div className="text-center">
            <div className="font-medium text-slate-950">
              ITEM-{row.po_item_no}
            </div>
            <SmallText className="text-slate-500">Lot {row.lot_no}</SmallText>
          </div>
        ),
      },
      { key: "pmir_no", label: "PMIR", width: "8%" },
      {
        key: "challan_no",
        label: "Challan",
        width: "12%",
        render: (_v: any, row: any) => (
          <div>
            <div className="font-medium text-slate-950">
              {row.challan_no || "-"}
            </div>
            <SmallText className="text-slate-500">
              {row.challan_date ? formatDate(row.challan_date) : "-"}
            </SmallText>
          </div>
        ),
      },
      {
        key: "invoice_no",
        label: "Invoice",
        width: "12%",
        render: (_v: any, row: any) => (
          <div>
            <div
              className="font-medium text-[#1A3D7C] cursor-pointer hover:underline"
              onClick={() =>
                row.invoice_no &&
                window.open(
                  `/invoice/${encodeURIComponent(row.invoice_no.toString().trim())}`,
                  "_self",
                )
              }
            >
              {row.invoice_no || "-"}
            </div>
            <SmallText className="text-slate-500">
              {row.invoice_date ? formatDate(row.invoice_date) : "-"}
            </SmallText>
          </div>
        ),
      },
      { key: "unit", label: "UNIT", align: "center", width: "6%" },
      {
        key: "order_qty",
        label: "ORDERED",
        align: "right",
        width: "8%",
        render: (v: any) => <Accounting>{v}</Accounting>,
      },
      {
        key: "challan_qty",
        label: "CHALLAN",
        align: "right",
        width: "8%",
        render: (v: any) => <Accounting>{v}</Accounting>,
      },
      {
        key: "received_qty",
        label: "RECEIVED",
        align: "right",
        width: "8%",
        render: (_v: any, row: any) => (
          <Accounting className="font-medium text-[#1A3D7C]">
            {row.received_qty}
          </Accounting>
        ),
      },
      {
        key: "accepted_qty",
        label: "ACCEPTED",
        align: "right",
        width: "8%",
        render: (_v: any, row: any) => (
          <Accounting className="font-medium text-[#16A34A]">
            {row.accepted_qty}
          </Accounting>
        ),
      },
      {
        key: "rejected_qty",
        label: "REJECTED",
        align: "right",
        width: "8%",
        render: (_v: any, row: any) => (
          <Accounting className="font-medium text-[#DC2626]">
            {row.rejected_qty}
          </Accounting>
        ),
      },
    ],
    [],
  );

  useEffect(() => {
    if (params.id) {
      loadSRV(params.id as string);
    }
  }, [params.id]);

  const loadSRV = async (id: string) => {
    try {
      const baseUrl = api.baseUrl;
      const res = await fetch(`${baseUrl}/api/srv/${id}`);
      if (!res.ok) throw new Error("SRV not found");
      const data = await res.json();
      setSrv(data);
    } catch (err) {
      console.error("SRV Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !srv || !srv.header) {
    return (
      <DocumentTemplate
        title={loading ? "Synchronizing..." : "SRV Not Found"}
        description={
          loading
            ? "Retrieving record data from ledger"
            : "Traceback failure in record retrieval"
        }
        onBack={() => router.push("/srv")}
      >
        <div className="space-y-6">
          <div className="h-8 w-64 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-[200px] w-full bg-slate-50 rounded-xl border border-slate-100 animate-pulse" />
        </div>
      </DocumentTemplate>
    );
  }

  const { header, items = [] } = srv;

  const totalReceived = items.reduce(
    (acc: number, item: any) => acc + (item.received_qty || 0),
    0,
  );
  const totalRejected = items.reduce(
    (acc: number, item: any) => acc + (item.rejected_qty || 0),
    0,
  );

  return (
    <DocumentTemplate
      title={`SRV-${header.srv_number}`}
      description={`Certified ${formatDate(header.srv_date)} • Contract: ${header.po_number}`}
      onBack={() => router.back()}
      icon={<Package size={20} className="text-[#1A3D7C]" />}
      actions={
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <FileText size={16} />
            Export Report
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Badge variant="default">INSPECTED</Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-[#1A3D7C]/10 transition-colors"
            onClick={() => router.push(`/po/${header.po_number}`)}
          >
            Ref: {header.po_number}
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[#1A3D7C]/10 rounded-lg">
                <Package className="w-6 h-6 text-[#1A3D7C]" />
              </div>
              <Activity className="w-4 h-4 text-[#D1D5DB]" />
            </div>
            <Label className="text-[10px] uppercase tracking-widest text-[#6B7280] mb-1">
              Receipt Volume
            </Label>
            <div className="text-[28px] font-medium text-slate-950">
              <Accounting>{totalReceived}</Accounting>
            </div>
            <SmallText className="text-[#1A3D7C] mt-2">
              Aggregated Units
            </SmallText>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[#DC2626]/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
              </div>
              <Activity className="w-4 h-4 text-[#D1D5DB]" />
            </div>
            <Label className="text-[10px] uppercase tracking-widest text-[#6B7280] mb-1">
              Quality Deficiency
            </Label>
            <div className="text-[28px] font-medium text-[#DC2626]">
              <Accounting className="text-[#DC2626] font-medium">
                {totalRejected}
              </Accounting>
            </div>
            <SmallText className="text-[#DC2626] mt-2">
              Impacted Inventory
            </SmallText>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[#2BB7A0]/10 rounded-lg">
                <ClipboardCheck className="w-6 h-6 text-[#2BB7A0]" />
              </div>
              <CheckCircle className="w-4 h-4 text-[#D1D5DB]" />
            </div>
            <Label className="text-[10px] uppercase tracking-widest text-[#6B7280] mb-1">
              Verification Node
            </Label>
            <div className="text-[16px] font-medium text-slate-950 truncate">
              {items[0]?.invoice_no || "PENDING AUDIT"}
            </div>
            <SmallText className="text-[#2BB7A0] mt-2">
              {items[0]?.invoice_date
                ? `Finalized ${formatDate(items[0].invoice_date)}`
                : "Awaiting Sync"}
            </SmallText>
          </Card>
        </div>

        {/* Items Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <H3 className="text-[13px] font-medium text-slate-600 uppercase tracking-widest">
              Inspection Manifest
            </H3>
            <Badge variant="default" className="text-[10px]">
              {items.length} Quality Nodes
            </Badge>
          </div>
          <DataTable columns={itemColumns} data={items} keyField="id" />
        </div>
      </div>
    </DocumentTemplate>
  );
}
