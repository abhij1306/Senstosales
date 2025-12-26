"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  FileText,
  Plus,
  Trash2,
  Truck,
  AlertCircle,
  Download,
  FileDown,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { api, API_BASE_URL } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { DCItemRow as DCItemRowType } from "@/types";
import {
  H1,
  H3,
  Body,
  SmallText,
  Label,
  Accounting,
} from "@/components/design-system/atoms/Typography";
// import { DocumentJourney } from "@/components/design-system/molecules/DocumentJourney";
import { DocumentTemplate } from "@/components/design-system/templates/DocumentTemplate";
import { Button } from "@/components/design-system/atoms/Button";
import { Badge } from "@/components/design-system/atoms/Badge";
import { Input } from "@/components/design-system/atoms/Input";
import { Card } from "@/components/design-system/atoms/Card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/molecules/Tabs";
import type { Column } from "@/components/design-system/organisms/DataTable";
// import { DataTable } from "@/components/design-system/organisms/DataTable";
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

function DCDetailContent() {
  const router = useRouter();
  const params = useParams();
  const dcId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [hasInvoice, setHasInvoice] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DCItemRowType[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    dc_number: "",
    dc_date: "",
    po_number: "",
    supplier_phone: "0755 – 4247748",
    supplier_gstin: "23AACFS6810L1Z7",
    consignee_name: "The Sr. Manager (CRX)",
    consignee_address: "M/S Bharat Heavy Eletrical Ltd. Bhopal",
    department_no: "",
    eway_bill_number: "",
  });
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (!dcId) return;
    const loadDCData = async () => {
      try {
        const [data, invoiceData] = await Promise.all([
          api.getDCDetail(dcId),
          api.checkDCHasInvoice(dcId),
        ]);

        if (data.header) {
          setFormData({
            dc_number: data.header.dc_number || "",
            dc_date: data.header.dc_date || "",
            po_number: data.header.po_number?.toString() || "",
            supplier_phone: data.header.supplier_phone || "0755 – 4247748",
            supplier_gstin: data.header.supplier_gstin || "23AACFS6810L1Z7",
            consignee_name:
              data.header.consignee_name || "The Sr. Manager (CRX)",
            consignee_address:
              data.header.consignee_address ||
              "M/S Bharat Heavy Eletrical Ltd. Bhopal",
            department_no: data.header.department_no?.toString() || "",
            eway_bill_number: data.header.eway_bill_no || "",
          });
          if (data.items) {
            setItems(
              data.items.map((item: any, idx: number) => ({
                id: `item-${idx}`,
                lot_no: item.lot_no?.toString() || (idx + 1).toString(),
                material_code: item.material_code || "",
                description:
                  item.material_description || item.description || "",
                ordered_quantity: item.lot_ordered_qty || item.ordered_qty || 0,
                remaining_post_dc: item.remaining_post_dc || 0,
                dispatch_quantity:
                  item.dispatch_qty || item.dispatch_quantity || 0,
                received_quantity: item.received_quantity || 0,
                po_item_id: item.po_item_id,
              })),
            );
          }
          if (data.header.remarks) setNotes(data.header.remarks.split("\n\n"));
        }

        if (invoiceData?.has_invoice) {
          setHasInvoice(true);
          setInvoiceNumber(invoiceData.invoice_number || null);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load DC");
      } finally {
        setLoading(false);
      }
    };
    loadDCData();
  }, [dcId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.updateDC(dcId!, formData, items);
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.deleteDC(dcId!);
      router.push("/dc");
    } catch (err: any) {
      setError(err.message || "Failed to delete DC");
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const itemColumns: Column<any>[] = [
    {
      key: "material_code",
      label: "Code",
      width: "10%",
      render: (v) => <Accounting className="text-[12px]">{v}</Accounting>,
    },
    {
      key: "description",
      label: "Description",
      width: "35%",
      render: (_v, row) => (
        <div className="space-y-0.5">
          <div className="font-medium text-slate-950">{row.description}</div>
          {row.drg_no && (
            <div className="text-[10px] text-[#1A3D7C] font-medium uppercase tracking-tight">
              DRG: {row.drg_no}
            </div>
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
      key: "dispatch_quantity",
      label: "Dlv",
      align: "center",
      width: "8%",
      render: (_v, row) => (
        <Accounting className="text-[12px] text-blue-930">
          {row?.dispatch_quantity || 0}
        </Accounting>
      ),
    },
    {
      key: "remaining_post_dc",
      label: "Bal",
      align: "center",
      width: "8%",
      render: (v) => <Accounting className="text-[12px]">{v}</Accounting>,
    },
    {
      key: "received_quantity",
      label: "Rec",
      align: "center",
      width: "8%",
      render: (_v, row) => (
        <Accounting className="text-[12px] text-emerald-930">
          {row?.received_quantity || 0}
        </Accounting>
      ),
    },
  ];

  const topActions = (
    <div className="flex gap-3">
      {!editMode ? (
        <>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800"
          >
            <a
              href={`${API_BASE_URL}/api/dc/${dcId}/download`}
              target="_blank"
              rel="noreferrer"
            >
              <FileDown size={16} className="mr-2" />
              Excel
            </a>
          </Button>
          {hasInvoice && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/invoice/${invoiceNumber}`)}
            >
              <FileText size={16} />
              View Invoice
            </Button>
          )}
          {!hasInvoice && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/invoice/create?dc=${dcId}`)}
            >
              <Plus size={16} />
              Create Invoice
            </Button>
          )}
          <Button variant="default" size="sm" onClick={() => setEditMode(true)}>
            <Edit2 size={16} />
            Edit
          </Button>
          {!hasInvoice && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={16} />
              Delete
            </Button>
          )}
        </>
      ) : (
        <>
          <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
            <X size={16} />
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={handleSave}>
            <Save size={16} />
            Save
          </Button>
        </>
      )}
    </div>
  );

  if (loading)
    return (
      <div className="p-32 text-center">
        <Body className="text-[#6B7280] animate-pulse">Loading...</Body>
      </div>
    );

  return (
    <DocumentTemplate
      title={`DC #${formData.dc_number}`}
      description={`${formData.consignee_name} • ${formatDate(formData.dc_date)}`}
      actions={topActions}
      onBack={() => router.back()}
      layoutId={`dc-title-${formData.dc_number}`}
    >
      <div className="space-y-6">
        <DocumentJourney currentStage="DC" className="mb-2" />

        {error && (
          <Card className="p-4 bg-[#DC2626]/10 border-[#DC2626]/20">
            <div className="flex items-center gap-2 text-[#DC2626]">
              <AlertCircle size={16} />
              <SmallText className="font-semibold">{error}</SmallText>
            </div>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <Card className="p-6 bg-[#FEF2F2] border-[#DC2626]/30">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#DC2626]/10 rounded-full">
                  <Trash2 size={20} className="text-[#DC2626]" />
                </div>
                <div>
                  <H3 className="text-[15px] font-semibold text-slate-930">
                    Delete Delivery Challan?
                  </H3>
                  <SmallText className="text-slate-600 mt-1">
                    This action cannot be undone. The DC and all its items will
                    be permanently deleted.
                  </SmallText>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 size={16} />
                  Delete DC
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-slate-100/30 p-1 rounded-xl">
            <TabsTrigger
              value="basic"
              className="text-[11px] py-1.5 font-medium text-slate-600 data-[state=active]:text-slate-930"
            >
              Basic Info
            </TabsTrigger>
            <TabsTrigger
              value="supplier"
              className="text-[11px] py-1.5 font-medium text-slate-600 data-[state=active]:text-slate-930"
            >
              Supplier
            </TabsTrigger>
            <TabsTrigger
              value="consignee"
              className="text-[11px] py-1.5 font-medium text-slate-600 data-[state=active]:text-slate-930"
            >
              Consignee
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
              <Card className="p-6 mt-4 border-none shadow-sm bg-white/50 backdrop-blur-sm">
                <TabsContent value="basic" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-600">
                        DC Number
                      </Label>
                      <Input
                        value={formData.dc_number}
                        readOnly
                        className="bg-[#F9FAFB] font-medium text-slate-930 border-none h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-600">
                        DC Date
                      </Label>
                      <Input
                        type="date"
                        value={formData.dc_date}
                        onChange={(e) =>
                          setFormData({ ...formData, dc_date: e.target.value })
                        }
                        readOnly={!editMode}
                        className="font-medium text-slate-930 border-none h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-600">
                        PO Number
                      </Label>
                      <Input
                        value={formData.po_number}
                        readOnly
                        className="bg-[#F9FAFB] cursor-pointer font-medium text-slate-930 border-none h-8"
                        onClick={() => router.push(`/po/${formData.po_number}`)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-600">
                        Department No
                      </Label>
                      <Input
                        value={formData.department_no}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department_no: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                        className="font-medium text-slate-930 border-none h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-600">
                        E-Way Bill Number
                      </Label>
                      <Input
                        value={formData.eway_bill_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            eway_bill_number: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                        className="font-medium text-slate-930 border-none h-8"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="supplier" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-600">
                        Supplier Phone
                      </Label>
                      <Input
                        value={formData.supplier_phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            supplier_phone: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                        className="font-medium text-slate-930 border-none h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-600">
                        Supplier GSTIN
                      </Label>
                      <Input
                        value={formData.supplier_gstin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            supplier_gstin: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                        className="font-medium text-slate-930 border-none h-8"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="consignee" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-600">
                        Consignee Name
                      </Label>
                      <Input
                        value={formData.consignee_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            consignee_name: e.target.value,
                          })
                        }
                        readOnly={!editMode}
                        className="font-medium text-slate-930 border-none h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-600">
                        Consignee Address
                      </Label>
                      <textarea
                        value={formData.consignee_address}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            consignee_address: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-[13px] border-none bg-slate-50/50 rounded-md focus:outline-none focus:ring-0 resize-none font-medium text-slate-930"
                        rows={2}
                        readOnly={!editMode}
                      />
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
            Dispatched Items ({items.length})
          </H3>
          <DataTable columns={itemColumns} data={items} keyField="id" />
        </div>

        {/* Notes */}
        {notes.length > 0 && (
          <Card className="p-6 border-none shadow-sm bg-slate-50/30">
            <H3 className="mb-4 text-[13px] font-medium text-slate-600 uppercase tracking-widest">
              Notes
            </H3>
            <div className="space-y-2">
              {notes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white/50 rounded-lg border border-slate-100 italic text-[13px] text-slate-600"
                >
                  {note}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DocumentTemplate>
  );
}

export default function DCDetailPage() {
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
      <DCDetailContent />
    </Suspense>
  );
}
