"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  FileText,
  ShoppingCart,
  Calendar,
  Info,
  Loader2,
  AlertCircle,
  Sparkles,
  Building,
  Landmark,
  Activity,
  Layers,
  Receipt,
  Trash2,
  ShieldCheck,
  Package,
  Download,
  FileDown,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
} from "lucide-react";

import { api, API_BASE_URL } from "@/lib/api";
import { formatDate, formatIndianCurrency, cn } from "@/lib/utils";
import { PODetail, POItem, PODelivery, SRVListItem } from "@/types";

// Atomic Design Components
import { DocumentTemplate } from "@/components/design-system/templates/DocumentTemplate";
import { GlassContainer } from "@/components/design-system/atoms/GlassContainer";
import { Button } from "@/components/design-system/atoms/Button";
import { Badge } from "@/components/design-system/atoms/Badge";
import { H1, H3, SmallText } from "@/components/design-system/atoms/Typography";
import { Input } from "@/components/design-system/atoms/Input";
import { DetailField } from "@/components/design-system/molecules/DetailField";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/molecules/Tabs";
// import { DataTable, Column } from "@/components/design-system/organisms/DataTable"; // Removed unused import
// import { DocumentJourney } from "@/components/design-system/molecules/DocumentJourney"; // Converted to dynamic
import { Accounting } from "@/components/design-system/atoms/Typography";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

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

function PODetailContent() {
  const router = useRouter();
  const params = useParams();
  const poId = params.id as string;
  const [data, setData] = useState<PODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [hasDC, setHasDC] = useState(false);
  const [dcId, setDCId] = useState<string | null>(null);
  const [srvs, setSrvs] = useState<SRVListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Restore tab state from v2 blueprint
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (!poId) return;
    const loadData = async () => {
      try {
        const [poData, dcCheck, srvData] = await Promise.all([
          api.getPODetail(parseInt(poId)),
          api.checkPOHasDC(parseInt(poId)).catch(() => null),
          api.listSRVs(parseInt(poId)).catch(() => []),
        ]);

        setData(poData);
        if (poData.items)
          setExpandedItems(
            new Set(poData.items.map((item: POItem) => item.po_item_no)),
          );

        if (dcCheck?.has_dc) {
          setHasDC(true);
          setDCId(dcCheck.dc_id || null);
        }
        setSrvs(srvData || []);
      } catch (err: any) {
        setError(err.message || "Traceback failure in record retrieval");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [poId]);

  const handleSave = async () => {
    if (!data || !data.header) return;
    setLoading(true);
    try {
      await api.updatePO(data.header.po_number, data.header, data.items);
      setEditMode(false);
      const poData = await api.getPODetail(parseInt(poId!));
      setData(poData);
    } catch (err: any) {
      setError(err.message || "Failed to sync changes");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (!data || !data.items) return;
    const maxItemNo = Math.max(
      ...data.items.map((i: POItem) => i.po_item_no || 0),
      0,
    );
    const newItem = {
      po_item_no: maxItemNo + 1,
      material_code: "",
      material_description: "NEW PROCUREMENT ITEM",
      drg_no: "",
      unit: "NOS",
      ordered_quantity: 0,
      po_rate: 0,
      item_value: 0,
      delivered_quantity: 0,
      deliveries: [],
    };
    setData({ ...data, items: [...data.items, newItem] });
    setExpandedItems(new Set([...Array.from(expandedItems), maxItemNo + 1]));
  };

  const toggleItem = (itemNo: number) => {
    const s = new Set(expandedItems);
    s.has(itemNo) ? s.delete(itemNo) : s.add(itemNo);
    setExpandedItems(s);
  };

  const updateHeader = (field: string, value: any) => {
    if (!data) return;
    setData({
      ...data,
      header: { ...data.header, [field]: value },
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    if (!data || !data.items) return;
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === "po_rate" || field === "ordered_quantity") {
      newItems[index].item_value =
        (newItems[index].ordered_quantity || 0) *
        (newItems[index].po_rate || 0);
    }
    setData({ ...data, items: newItems });
  };

  const addDelivery = (itemIdx: number) => {
    if (!data || !data.items) return;
    const newItems = [...data.items];
    const item = newItems[itemIdx];
    const maxLotNo = Math.max(
      ...(item.deliveries?.map((d: PODelivery) => d.lot_no || 0) || []),
      0,
    );
    const newLot = {
      lot_no: maxLotNo + 1,
      delivered_quantity: 0,
      dely_date: new Date().toISOString().split("T")[0],
    };
    newItems[itemIdx].deliveries = [...(item.deliveries || []), newLot];
    setData({ ...data, items: newItems });
  };

  const removeDelivery = (itemIdx: number, deliveryIdx: number) => {
    if (!data || !data.items) return;
    const newItems = [...data.items];
    newItems[itemIdx].deliveries = newItems[itemIdx].deliveries.filter(
      (_, i) => i !== deliveryIdx,
    );
    setData({ ...data, items: newItems });
  };

  const removeItem = (index: number) => {
    if (!data || !data.items) return;
    const newItems = data.items.filter((_, i) => i !== index);
    setData({ ...data, items: newItems });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-primary font-semibold animate-pulse uppercase tracking-[0.3em] text-[10px]">
        SYNCHRONIZING RECORD DATA...
      </div>
    );

  if (!data || !data.header)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 neo-flat">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="text-center space-y-2">
          <H3 className="text-rose-900 m-0 uppercase tracking-tighter">
            Contract Not Found
          </H3>
          <SmallText className="m-0 uppercase tracking-widest opacity-50">
            Traceback failed to locate record ID {poId}
          </SmallText>
        </div>
        <Button variant="outline" onClick={() => router.push("/po")}>
          RETURN TO PROCUREMENT
        </Button>
      </div>
    );

  const { header, items } = data;

  const topActions = (
    <div className="flex items-center gap-2.5">
      {editMode ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(false)}
            className="text-rose-600 border-rose-100 shadow-sm"
          >
            <X className="w-3.5 h-3.5 mr-2" />
            DISCARD
          </Button>
          <Button variant="default" size="sm" onClick={handleSave}>
            <Save className="w-3.5 h-3.5 mr-2" />
            SAVE CHANGES
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800"
          >
            <a
              href={`${API_BASE_URL}/api/po/${header.po_number}/download`}
              target="_blank"
              rel="noreferrer"
            >
              <FileDown className="w-3.5 h-3.5 mr-2" />
              EXCEL
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              hasDC && dcId
                ? router.push(`/dc/${dcId}`)
                : router.push(`/dc/create?po=${header.po_number}`)
            }
            className={cn(
              "border-slate-200",
              hasDC
                ? "bg-emerald-50 text-emerald-700 shadow-sm border-emerald-100"
                : "text-slate-600",
            )}
          >
            <FileText className="w-3.5 h-3.5 mr-2" />
            {hasDC ? "VIEW DC" : "GENERATE DC"}
          </Button>
          <Button variant="default" size="sm" onClick={() => setEditMode(true)}>
            <Edit2 className="w-3.5 h-3.5 mr-2" />
            MODIFY
          </Button>
        </>
      )}
    </div>
  );

  // Using Atomic Components for Fields - Unified for Zero Layout Shift
  const Field = ({
    label,
    value,
    field,
    readonly = false,
  }: {
    label: string;
    value: any;
    field?: string;
    readonly?: boolean;
  }) => {
    return (
      <div className="min-h-[44px] flex flex-col justify-center">
        <SmallText className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 leading-none">
          {label}
        </SmallText>
        {editMode && field && !readonly ? (
          <Input
            value={value ?? ""}
            onChange={(e) => updateHeader(field, e.target.value)}
            className="h-7 text-[13px] px-2 border-none bg-slate-100/50 focus:bg-white transition-all shadow-none focus:shadow-sm font-medium text-slate-950"
          />
        ) : (
          <div
            className="text-[13px] font-medium text-slate-950 leading-tight py-1 truncate"
            title={value?.toString()}
          >
            {value || (
              <span className="text-slate-400 font-normal italic opacity-60 uppercase tracking-tighter text-[10px]">
                Empty
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <DocumentTemplate
      title={`PO #${header.po_number}`}
      description={`${header.supplier_name} • ${formatDate(header.po_date)}`}
      actions={topActions}
      onBack={() => router.back()}
      layoutId={`po-title-${header.po_number}`}
    >
      <div className="space-y-6">
        {/* Document Journey */}
        <DocumentJourney currentStage="PO" className="mb-2" />

        {/* V2 Layout: Comprehensive Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 bg-slate-100/30 p-1 rounded-xl">
            <TabsTrigger
              value="basic"
              className="text-[11px] py-1.5 font-medium text-slate-600 data-[state=active]:text-slate-930"
            >
              <Info className="w-3.5 h-3.5 mr-1.5" />
              Basic
            </TabsTrigger>
            <TabsTrigger
              value="references"
              className="text-[11px] py-1.5 font-medium text-slate-600 data-[state=active]:text-slate-930"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Refs
            </TabsTrigger>
            <TabsTrigger
              value="financial"
              className="text-[11px] py-1.5 font-medium text-slate-600 data-[state=active]:text-slate-930"
            >
              <Landmark className="w-3.5 h-3.5 mr-1.5" />
              Finance
            </TabsTrigger>
            <TabsTrigger
              value="issuer"
              className="text-[11px] py-1.5 font-medium text-slate-600 data-[state=active]:text-slate-930"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              Issuer
            </TabsTrigger>
            <TabsTrigger
              value="srvs"
              className="text-[11px] py-1.5 font-medium text-slate-600 data-[state=active]:text-slate-930"
            >
              <Receipt className="w-3.5 h-3.5 mr-1.5" />
              SRVs ({srvs.length})
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GlassContainer className="p-6 neon-convex min-h-[180px] border-none shadow-xl shadow-slate-200/50">
                <TabsContent value="basic" className="m-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                    <Field
                      label="PO Number"
                      value={header.po_number}
                      field="po_number"
                      readonly
                    />
                    <Field
                      label="PO Date"
                      value={formatDate(header.po_date)}
                      field="po_date"
                      readonly
                    />
                    <Field
                      label="Supplier Name"
                      value={header.supplier_name}
                      field="supplier_name"
                    />
                    <Field
                      label="Supplier Code"
                      value={header.supplier_code}
                      field="supplier_code"
                    />
                    <Field
                      label="Phone"
                      value={header.supplier_phone}
                      field="supplier_phone"
                    />
                    <Field
                      label="Fax"
                      value={header.supplier_fax}
                      field="supplier_fax"
                    />
                    <Field
                      label="Email"
                      value={header.supplier_email}
                      field="supplier_email"
                    />
                    <Field
                      label="Dept No (DVN)"
                      value={header.department_no}
                      field="department_no"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="references" className="m-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                    <Field
                      label="Enquiry No"
                      value={header.enquiry_no}
                      field="enquiry_no"
                    />
                    <Field
                      label="Enquiry Date"
                      value={formatDate(header.enquiry_date)}
                      field="enquiry_date"
                    />
                    <Field
                      label="Quotation Ref"
                      value={header.quotation_ref}
                      field="quotation_ref"
                    />
                    <Field
                      label="Quotation Date"
                      value={formatDate(header.quotation_date)}
                      field="quotation_date"
                    />
                    <Field label="RC No" value={header.rc_no} field="rc_no" />
                    <Field
                      label="Order Type"
                      value={header.order_type}
                      field="order_type"
                    />
                    <Field
                      label="PO Status"
                      value={header.po_status}
                      field="po_status"
                    />
                    <Field
                      label="Amd No"
                      value={header.amend_no}
                      field="amend_no"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="m-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                    <Field
                      label="PO Value"
                      value={formatIndianCurrency(header.po_value)}
                      field="po_value"
                    />
                    <Field
                      label="FOB Value"
                      value={formatIndianCurrency(header.fob_value)}
                      field="fob_value"
                    />
                    <Field
                      label="Net Value"
                      value={formatIndianCurrency(header.net_po_value)}
                      field="net_po_value"
                    />
                    <Field
                      label="TIN No"
                      value={header.tin_no}
                      field="tin_no"
                    />
                    <Field
                      label="ECC No"
                      value={header.ecc_no}
                      field="ecc_no"
                    />
                    <Field
                      label="MPCT No"
                      value={header.mpct_no}
                      field="mpct_no"
                    />
                    <Field
                      label="Currency"
                      value={header.currency}
                      field="currency"
                    />
                    <Field
                      label="Ex Rate"
                      value={header.ex_rate}
                      field="ex_rate"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="issuer" className="m-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                    <Field
                      label="Inspection By"
                      value={header.inspection_by}
                      field="inspection_by"
                    />
                    <Field
                      label="Issuer Name"
                      value={header.issuer_name}
                      field="issuer_name"
                    />
                    <Field
                      label="Designation"
                      value={header.issuer_designation}
                      field="issuer_designation"
                    />
                    <Field
                      label="Issuer Phone"
                      value={header.issuer_phone}
                      field="issuer_phone"
                    />
                    {/* Truncated Remarks Section to Save a Row */}
                    <div className="col-span-2 md:col-span-4 mt-2">
                      <div className="flex flex-col">
                        <SmallText className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1 leading-none">
                          Remarks
                        </SmallText>
                        {editMode ? (
                          <input
                            value={header.remarks || ""}
                            onChange={(e) =>
                              updateHeader("remarks", e.target.value)
                            }
                            className="w-full h-8 px-2 text-[13px] border-none bg-slate-100/50 rounded focus:bg-white transition-all shadow-none font-medium text-slate-950"
                            placeholder="Enter remarks..."
                          />
                        ) : (
                          <div
                            className="text-[13px] text-slate-950 font-normal line-clamp-1 italic px-0.5 opacity-90"
                            title={header.remarks || ""}
                          >
                            {header.remarks || "No remarks provided."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="srvs" className="m-0">
                  {srvs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {srvs.map((srv) => (
                        <div
                          key={srv.srv_number}
                          className="p-4 rounded-xl shadow-sm bg-white/50 hover:bg-emerald-50/30 hover:shadow-md transition-all duration-300 group cursor-pointer border border-slate-100"
                          onClick={() => router.push(`/srv/${srv.srv_number}`)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="space-y-0.5">
                              <div className="text-[10px] font-bold text-slate-900 uppercase tracking-tight group-hover:text-emerald-600">
                                SRV-{srv.srv_number}
                              </div>
                              <div className="text-[9px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
                                <Calendar className="w-2.5 h-2.5" />
                                {formatDate(srv.srv_date)}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                                <Receipt className="w-3 h-3" />
                              </div>
                              {srv.invoice_numbers && (
                                <Badge
                                  variant="default"
                                  className="text-[8px] py-0 px-1 font-bold bg-slate-900 text-white border-none"
                                >
                                  INV: {srv.invoice_numbers.split(",")[0]}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 pt-2 border-t border-slate-50 gap-2">
                            <div>
                              <div className="text-[7px] font-bold text-emerald-500 uppercase tracking-widest leading-tight">
                                Accepted
                              </div>
                              <div className="text-[11px] font-bold text-slate-900">
                                <Accounting>
                                  {srv.total_accepted_qty || 0}
                                </Accounting>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[7px] font-bold text-rose-500 uppercase tracking-widest leading-tight">
                                Rejected
                              </div>
                              <div className="text-[11px] font-bold text-slate-900">
                                <Accounting>
                                  {srv.total_rejected_qty || 0}
                                </Accounting>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      No linked SRVs found.
                    </div>
                  )}
                </TabsContent>
              </GlassContainer>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* Items & Deliveries - Custom Table matching Atomic Vibe + V2 Layout */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <H3 className="m-0 uppercase tracking-widest text-[12px] font-black text-slate-600">
                Bill of Materials
              </H3>
            </div>
            {editMode && (
              <Button
                size="sm"
                onClick={addItem}
                variant="ghost"
                className="h-8 text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                ADD ITEM
              </Button>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/40 border-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100/50">
                  <tr>
                    <th className="py-2.5 px-4 text-[10px] font-medium text-slate-600 uppercase tracking-widest text-center w-12">
                      #
                    </th>
                    <th className="py-2.5 px-4 text-[10px] font-medium text-slate-600 uppercase tracking-widest text-left w-32">
                      Code
                    </th>
                    <th className="py-2.5 px-4 text-[10px] font-medium text-slate-600 uppercase tracking-widest text-left">
                      Description
                    </th>
                    <th className="py-2.5 px-4 text-[10px] font-medium text-slate-600 uppercase tracking-widest text-left w-20">
                      Unit
                    </th>
                    <th className="py-2.5 px-4 text-[10px] font-medium text-slate-600 uppercase tracking-widest text-right w-28">
                      Rate
                    </th>
                    <th className="py-2.5 px-4 text-[10px] font-medium text-slate-600 uppercase tracking-widest text-center w-16">
                      Ord
                    </th>
                    <th className="py-2.5 px-4 text-[10px] font-medium text-slate-600 uppercase tracking-widest text-center w-16">
                      Dlv
                    </th>
                    <th className="py-2.5 px-4 text-[10px] font-medium text-slate-600 uppercase tracking-widest text-center w-16">
                      Bal
                    </th>
                    <th className="py-2.5 px-4 text-[10px] font-medium text-slate-600 uppercase tracking-widest text-center w-16">
                      Rec
                    </th>
                    <th className="py-2.5 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <React.Fragment key={item.po_item_no}>
                      <tr
                        className={cn(
                          "hover:bg-slate-50 transition-colors group",
                          expandedItems.has(item.po_item_no)
                            ? "bg-slate-50/50"
                            : "",
                        )}
                      >
                        <td className="py-2 px-4 text-center text-[11px] font-normal text-slate-400 align-top pt-3.5 italic">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-4 align-top pt-2.5">
                          {editMode ? (
                            <Input
                              value={item.material_code}
                              onChange={(e) =>
                                updateItem(idx, "material_code", e.target.value)
                              }
                              className="h-7 text-[13px] w-full px-1.5 border-none bg-slate-100/50 font-medium text-slate-930"
                            />
                          ) : (
                            <Accounting className="tracking-tighter">
                              {item.material_code}
                            </Accounting>
                          )}
                        </td>
                        <td className="py-2 px-4 align-top pt-2.5">
                          {editMode ? (
                            <div className="space-y-1">
                              <Input
                                value={item.material_description}
                                onChange={(e) =>
                                  updateItem(
                                    idx,
                                    "material_description",
                                    e.target.value,
                                  )
                                }
                                className="h-7 text-[13px] font-medium w-full px-1.5 border-none bg-slate-100/50 text-slate-950"
                              />
                              <Input
                                value={item.drg_no}
                                onChange={(e) =>
                                  updateItem(idx, "drg_no", e.target.value)
                                }
                                placeholder="Drawing"
                                className="h-6 text-[11px] w-32 px-1.5 border-none bg-slate-200/80 font-medium text-slate-950"
                              />
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div
                                className="text-[13px] font-medium text-slate-950 leading-tight truncate max-w-[400px]"
                                title={item.material_description}
                              >
                                {item.material_description}
                              </div>
                              {item.drg_no && (
                                <div className="text-[10px] font-medium text-[#1A3D7C] uppercase tracking-tight">
                                  DRG: {item.drg_no}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-4 align-top pt-2.5">
                          {editMode ? (
                            <Input
                              value={item.unit}
                              onChange={(e) =>
                                updateItem(idx, "unit", e.target.value)
                              }
                              className="h-7 text-[13px] w-14 px-1 border-none bg-slate-100/50 font-medium text-slate-950"
                            />
                          ) : (
                            <span className="text-[11px] font-medium text-slate-600 uppercase">
                              {item.unit}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-right align-top pt-3">
                          {editMode ? (
                            <Input
                              type="number"
                              value={item.po_rate}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "po_rate",
                                  parseFloat(e.target.value),
                                )
                              }
                              className="h-7 text-[13px] text-right w-full px-1.5 border-none bg-slate-100/50 font-mono font-medium text-slate-930"
                            />
                          ) : (
                            <Accounting className="tracking-tighter">
                              {formatIndianCurrency(item.po_rate)}
                            </Accounting>
                          )}
                        </td>
                        <td className="py-2 px-4 text-center align-top pt-3">
                          {editMode ? (
                            <Input
                              type="number"
                              value={item.ordered_quantity}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "ordered_quantity",
                                  parseFloat(e.target.value),
                                )
                              }
                              className="h-7 text-[13px] text-center w-full px-1 font-medium border-none bg-slate-100/50 text-slate-930"
                            />
                          ) : (
                            <Accounting className="tracking-tighter">
                              {item.ordered_quantity}
                            </Accounting>
                          )}
                        </td>
                        <td className="py-2 px-4 text-center align-top pt-3">
                          {editMode ? (
                            <Input
                              type="number"
                              value={item.delivered_quantity}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "delivered_quantity",
                                  parseFloat(e.target.value),
                                )
                              }
                              className="h-7 text-[13px] text-center w-full px-1 font-medium border-none bg-blue-100/50 text-blue-930 focus:bg-white"
                            />
                          ) : (
                            <Accounting className="text-blue-930 tracking-tighter">
                              {item.delivered_quantity}
                            </Accounting>
                          )}
                        </td>
                        <td className="py-2 px-4 text-center align-top pt-3">
                          <Accounting className="tracking-tighter">
                            {(item.ordered_quantity || 0) -
                              (item.delivered_quantity || 0)}
                          </Accounting>
                        </td>
                        <td className="py-2 px-4 text-center align-top pt-3">
                          {editMode ? (
                            <Input
                              type="number"
                              value={item.received_quantity}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "received_quantity",
                                  parseFloat(e.target.value),
                                )
                              }
                              className="h-7 text-[13px] text-center w-full px-1 font-medium border-none bg-emerald-100/50 text-emerald-930 focus:bg-white"
                            />
                          ) : (
                            <Accounting className="text-emerald-930 tracking-tighter">
                              {item.received_quantity}
                            </Accounting>
                          )}
                        </td>
                        <td className="py-2 px-4 align-top pt-2">
                          <div className="flex flex-col gap-1 items-center">
                            <button
                              onClick={() => toggleItem(item.po_item_no)}
                              className={cn(
                                "p-1.5 rounded-md transition-all text-slate-400 hover:text-slate-700",
                                expandedItems.has(item.po_item_no) &&
                                  "text-blue-600 bg-blue-50",
                              )}
                            >
                              {expandedItems.has(item.po_item_no) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            {editMode && (
                              <button
                                onClick={() => removeItem(idx)}
                                className="p-1.5 rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedItems.has(item.po_item_no) && (
                        <tr className="bg-slate-50/30">
                          <td colSpan={10} className="p-0">
                            <div className="p-4 pt-1 bg-slate-50/30">
                              <div className="flex items-center justify-between mb-2 px-4">
                                <h4 className="text-[10px] font-medium text-slate-600 uppercase tracking-widest p-4 border-b border-slate-100 flex items-center justify-between">
                                  <span>Delivery Lots & Schedules</span>
                                  {editMode && (
                                    <button
                                      onClick={() => addDelivery(idx)}
                                      className="text-[10px] font-medium text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-tight flex items-center"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Lot
                                    </button>
                                  )}
                                </h4>
                              </div>
                              <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                                <table className="w-full text-left">
                                  <thead className="bg-slate-100/50">
                                    <tr>
                                      <th className="px-4 py-2 text-[9px] uppercase font-medium text-slate-600 tracking-widest">
                                        Lot
                                      </th>
                                      <th className="px-4 py-2 text-right text-[9px] uppercase font-medium text-slate-600 tracking-widest w-24">
                                        Ord QTY
                                      </th>
                                      <th className="px-4 py-2 text-left text-[9px] uppercase font-medium text-slate-600 tracking-widest pl-8">
                                        Dely Date
                                      </th>
                                      <th className="px-4 py-2 text-left text-[9px] uppercase font-medium text-slate-600 tracking-widest">
                                        Entry Allow
                                      </th>
                                      <th className="px-4 py-2 text-left text-[9px] uppercase font-medium text-slate-600 tracking-widest text-center">
                                        Dest
                                      </th>
                                      {editMode && (
                                        <th className="px-4 py-2 w-8"></th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.deliveries &&
                                    item.deliveries.length > 0 ? (
                                      item.deliveries.map((d, dIdx) => (
                                        <tr
                                          key={dIdx}
                                          className="hover:bg-slate-50/80 transition-colors"
                                        >
                                          <td className="px-4 py-1.5">
                                            <span className="text-[11px] font-bold text-slate-400 font-mono tracking-tight">
                                              L{d.lot_no}
                                            </span>
                                          </td>
                                          <td className="px-4 py-1.5 text-right font-medium text-blue-900 text-[12px] font-mono tracking-tighter">
                                            {editMode ? (
                                              <input
                                                type="number"
                                                value={d.delivered_quantity}
                                                onChange={(e) => {
                                                  const n = [...items];
                                                  n[idx].deliveries[
                                                    dIdx
                                                  ].delivered_quantity =
                                                    parseFloat(e.target.value);
                                                  setData({
                                                    ...data,
                                                    items: n,
                                                  });
                                                }}
                                                className="w-16 text-right text-[11px] bg-blue-100/30 rounded px-1 py-0.5 border-none outline-none font-medium text-blue-900"
                                              />
                                            ) : (
                                              d.delivered_quantity
                                            )}
                                          </td>
                                          <td className="px-4 py-1.5 pl-8 text-[11px] text-slate-950 font-medium font-mono">
                                            {editMode ? (
                                              <input
                                                type="date"
                                                value={
                                                  d.dely_date
                                                    ? new Date(d.dely_date)
                                                        .toISOString()
                                                        .split("T")[0]
                                                    : ""
                                                }
                                                onChange={(e) => {
                                                  const n = [...items];
                                                  n[idx].deliveries[
                                                    dIdx
                                                  ].dely_date = e.target.value;
                                                  setData({
                                                    ...data,
                                                    items: n,
                                                  });
                                                }}
                                                className="text-[11px] bg-slate-200/80 rounded px-1 py-0.5 border-none outline-none text-slate-950 font-medium"
                                              />
                                            ) : (
                                              formatDate(d.dely_date)
                                            )}
                                          </td>
                                          <td className="px-4 py-1.5 text-[11px] text-slate-400 font-medium font-mono">
                                            {formatDate(d.entry_allow_date)}
                                          </td>
                                          <td className="px-4 py-1.5 text-[11px] text-slate-400 font-medium font-mono text-center">
                                            {d.dest_code || "-"}
                                          </td>
                                          {editMode && (
                                            <td className="px-4 py-1.5 text-right">
                                              <button
                                                onClick={() =>
                                                  removeDelivery(idx, dIdx)
                                                }
                                                className="text-slate-400 hover:text-rose-600 transition-all"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                            </td>
                                          )}
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td
                                          colSpan={6}
                                          className="text-center py-3 text-[11px] text-slate-400 font-medium italic"
                                        >
                                          No lots defined
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DocumentTemplate>
  );
}

export default function PODetailPage() {
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
      <PODetailContent />
    </Suspense>
  );
}
