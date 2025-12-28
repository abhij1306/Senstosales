"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  FileText,
  Download,
  FileDown,
  Edit2,
  Calendar,
  Receipt,
} from "lucide-react";
import { api, API_BASE_URL } from "@/lib/api";
import { formatDate, formatIndianCurrency, amountInWords } from "@/lib/utils";
import {
  H1,
  H3,
  Body,
  SmallText,
  Label,
  Accounting,
} from "@/components/design-system/atoms/Typography";
import { DocumentTemplate } from "@/components/design-system/templates/DocumentTemplate";
import { Button } from "@/components/design-system/atoms/Button";
import { Badge } from "@/components/design-system/atoms/Badge";
import { Card } from "@/components/design-system/atoms/Card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/molecules/Tabs";
import { type Column } from "@/components/design-system/organisms/DataTable";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const DataTable = dynamic(
  () =>
    import("@/components/design-system/organisms/DataTable").then(
      (mod) => mod.DataTable,
    ),
  {
    loading: () => (
      <div className="h-64 w-full bg-slate-50/50 rounded-xl animate-pulse" />
    ),
    ssr: false,
  },
);

const DocumentJourney = dynamic(
  () =>
    import("@/components/design-system/molecules/DocumentJourney").then(
      (mod) => mod.DocumentJourney,
    ),
  {
    loading: () => (
      <div className="h-6 w-48 bg-slate-100 rounded-full animate-pulse" />
    ),
    ssr: false,
  },
);

function InvoiceDetailContent() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("buyer");

  useEffect(() => {
    if (!invoiceId) return;
    const loadData = async () => {
      try {
        const invoiceData = await api.getInvoiceDetail(
          decodeURIComponent(invoiceId),
        );
        setData(invoiceData);
      } catch (err) {
        console.error("Invoice Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [invoiceId]);

  if (loading || !data || !data.header) {
    return (
      <DocumentTemplate
        title={loading ? "Synchronizing..." : "Invoice Not Found"}
        description={
          loading
            ? "Retrieving record data from ledger"
            : "Traceback failure in record retrieval"
        }
        onBack={() => router.push("/invoice")}
      >
        <div className="space-y-6">
          <div className="h-8 w-64 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-[200px] w-full bg-slate-50 rounded-xl border border-slate-100 animate-pulse" />
        </div>
      </DocumentTemplate>
    );
  }

  const { header, items = [], linked_dcs = [] } = data;

  const topActions = (
    <div className="flex gap-3">
      <Button
        variant="outline"
        size="sm"
        asChild
        className="text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800"
      >
        <a
          href={`${API_BASE_URL}/api/invoice/${encodeURIComponent(header.invoice_number)}/download`}
          target="_blank"
          rel="noreferrer"
        >
          <FileDown size={16} className="mr-2" />
          Excel
        </a>
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer size={16} />
        Print
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={() =>
          router.push(
            `/invoice/edit?id=${encodeURIComponent(header.invoice_number)}`,
          )
        }
      >
        <Edit2 size={16} />
        Edit
      </Button>
    </div>
  );

  const itemColumns: Column<any>[] = [
    {
      key: "material_code",
      label: "Code",
      width: "12%",
      render: (v) => <Accounting className="text-[12px]">{v}</Accounting>,
    },
    {
      key: "description",
      label: "Description",
      width: "32%",
      render: (_v, row) => (
        <div className="space-y-0.5">
          <Body className="text-slate-950">
            {row.material_description || row.description}
          </Body>
          {row.drg_no && (
            <SmallText className="text-[#1A3D7C] font-black uppercase tracking-widest block">
              DRG: {row.drg_no}
            </SmallText>
          )}
        </div>
      ),
    },
    {
      key: "ordered_quantity",
      label: "Ord",
      align: "center",
      width: "8%",
      render: (v) => <Accounting className="text-[12px]">{v}</Accounting>,
    },
    {
      key: "dispatched_quantity",
      label: "Dlv",
      align: "center",
      width: "8%",
      render: (v) => <Accounting className="text-[12px]">{v}</Accounting>,
    },
    {
      key: "quantity",
      label: "Inv",
      align: "center",
      width: "8%",
      render: (v) => (
        <Accounting className="text-[12px] text-emerald-930">
          {v || 0}
        </Accounting>
      ),
    },
    {
      key: "unit",
      label: "Unit",
      width: "6%",
      render: (v) => (
        <SmallText className="text-slate-600 uppercase font-black tracking-widest">
          {v}
        </SmallText>
      ),
    },
    {
      key: "rate",
      label: "Rate",
      align: "right",
      width: "10%",
      render: (v) => (
        <Accounting className="text-[12px]">
          {formatIndianCurrency(v)}
        </Accounting>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      width: "10%",
      render: (v) => (
        <Accounting className="text-[12px]">
          {formatIndianCurrency(v)}
        </Accounting>
      ),
    },
  ];

  return (
    <DocumentTemplate
      title={`Invoice #${header.invoice_number}`}
      description={`${header.buyer_name} • ${formatDate(header.invoice_date)}`}
      actions={topActions}
      onBack={() => router.back()}
      layoutId={`inv-title-${header.invoice_number}`}
      icon={<Receipt size={20} className="text-blue-700" />}
      iconLayoutId={`inv-icon-${header.invoice_number}`}
    >
      <div className="space-y-6">
        <DocumentJourney currentStage="Invoice" className="mb-2" />

        {/* Invoice Info Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="buyer">Buyer</TabsTrigger>
            <TabsTrigger value="references">Order Refs</TabsTrigger>
            <TabsTrigger value="logistics">Logistics</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 mt-4 border-none shadow-sm bg-white/50 backdrop-blur-sm">
                <TabsContent value="buyer" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label>Buyer Name</Label>
                      <Body className="text-slate-930 font-medium">
                        {header.buyer_name || "-"}
                      </Body>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Buyer GSTIN</Label>
                      <Accounting>{header.buyer_gstin || "-"}</Accounting>
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Buyer Address</Label>
                      <Body className="text-slate-930 font-medium">
                        {header.buyer_address || "-"}
                      </Body>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="references" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <Label>Buyer's Order No</Label>
                      <Accounting>{header.buyers_order_no || "-"}</Accounting>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Order Date</Label>
                      <Body className="text-slate-930 font-medium">
                        {header.buyers_order_date
                          ? formatDate(header.buyers_order_date)
                          : "-"}
                      </Body>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Challan Number</Label>
                      <Accounting
                        className="text-[#1A3D7C] cursor-pointer hover:underline"
                        onClick={() => router.push(`/dc/${header.dc_number}`)}
                      >
                        {header.dc_number || "-"}
                      </Accounting>
                    </div>
                    <div className="space-y-1.5">
                      <Label>GEMC Number</Label>
                      <Body className="text-slate-930 font-medium">
                        {header.gemc_number || "-"}
                      </Body>
                    </div>
                    <div className="space-y-1.5">
                      <Label>GEMC Date</Label>
                      <Body className="text-slate-930 font-medium">
                        {header.gemc_date ? formatDate(header.gemc_date) : "-"}
                      </Body>
                    </div>
                    <div className="space-y-1.5">
                      {/* Spacer or additional field */}
                    </div>
                    <div className="space-y-1.5">
                      <Label>SRV Number</Label>
                      <Body className="text-slate-930 font-medium">
                        {header.srv_no || "-"}
                      </Body>
                    </div>
                    <div className="space-y-1.5">
                      <Label>SRV Date</Label>
                      <Body className="text-slate-930 font-medium">
                        {header.srv_date ? formatDate(header.srv_date) : "-"}
                      </Body>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="logistics" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label>Dispatch Through</Label>
                      <Body className="text-slate-930 font-medium">
                        {header.dispatch_through || "-"}
                      </Body>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Destination</Label>
                      <Body className="text-slate-930 font-medium">
                        {header.destination || "-"}
                      </Body>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Terms of Delivery</Label>
                      <Body className="text-slate-930 font-medium">
                        {header.terms_of_delivery || "-"}
                      </Body>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Despatch Document No</Label>
                      <Body className="text-slate-930 font-medium">
                        {header.despatch_doc_no || "-"}
                      </Body>
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Payment Terms</Label>
                      <Body className="text-slate-930 font-medium">
                        {header.payment_terms ||
                          header.mode_of_payment ||
                          "45 Days"}
                      </Body>
                    </div>
                  </div>
                </TabsContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* Items Table */}
        <div className="space-y-2">
          <H3 className="px-1 text-[13px] font-medium text-slate-600 uppercase tracking-widest">
            Invoice Items ({items.length})
          </H3>
          <DataTable
            columns={itemColumns}
            data={items.map((item: any, idx: number) => ({
              ...item,
              _uniqueKey: `item-${idx}-${item.id || idx}`,
            }))}
            keyField="_uniqueKey"
          />
        </div>

        {/* Totals */}
        <Card className="p-6 bg-slate-50/50 border-none shadow-sm">
          <div className="grid grid-cols-2 gap-4 max-w-sm ml-auto">
            <Label className="text-[10px] uppercase tracking-widest text-slate-600 flex items-center">
              Taxable Value:
            </Label>
            <Accounting className="text-right">
              {formatIndianCurrency(header.total_taxable_value)}
            </Accounting>

            <Label className="text-[10px] uppercase tracking-widest text-slate-600 flex items-center">
              CGST @ 9%:
            </Label>
            <Accounting className="text-right">
              {formatIndianCurrency(header.cgst_total)}
            </Accounting>

            <Label className="text-[10px] uppercase tracking-widest text-slate-600 flex items-center">
              SGST @ 9%:
            </Label>
            <Accounting className="text-right">
              {formatIndianCurrency(header.sgst_total)}
            </Accounting>

            <div className="col-span-2 border-t border-slate-200 my-2" />

            <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-widest flex items-center">
              Grand Total:
            </Label>
            <Accounting className="text-right text-[16px] text-blue-930">
              {formatIndianCurrency(header.total_invoice_value)}
            </Accounting>

            <div className="col-span-2 mt-4 space-y-1 bg-white/50 p-3 rounded-lg border border-slate-100">
              <Label className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                Amount in words
              </Label>
              <Body className="text-[11px] text-slate-500 italic lowercase first-letter:uppercase">
                {amountInWords(header.total_invoice_value)} Only
              </Body>
            </div>
          </div>
        </Card>

        {/* Linked DCs */}
        {linked_dcs && linked_dcs.length > 0 && (
          <Card className="p-6 border-none shadow-sm bg-slate-50/30">
            <H3 className="mb-4 text-[13px] font-medium text-slate-600 uppercase tracking-widest">
              Linked Delivery Challans
            </H3>
            <div className="flex gap-2 flex-wrap">
              {linked_dcs.map((dc: any) => (
                <Badge
                  key={dc.dc_number}
                  variant="outline"
                  className="cursor-pointer hover:bg-slate-200 transition-colors font-medium text-slate-600"
                  onClick={() => router.push(`/dc/${dc.dc_number}`)}
                >
                  {dc.dc_number}
                </Badge>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DocumentTemplate>
  );
}

export default function InvoiceDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] w-full space-y-4 pt-6">
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="space-y-1">
              <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-3 w-32 bg-slate-100 rounded-md animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-8 w-64 bg-slate-100 rounded-full animate-pulse" />
            <div className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-[200px] w-full bg-slate-50 rounded-xl border border-slate-100 animate-pulse" />
          </div>
        </div>
      }
    >
      <InvoiceDetailContent />
    </Suspense>
  );
}
