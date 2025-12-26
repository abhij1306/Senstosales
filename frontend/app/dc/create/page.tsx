"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, Search, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DCItemRow, POHeader } from "@/types";
import {
  H3,
  Label,
  SmallText,
  Body,
  Accounting,
} from "@/components/design-system/atoms/Typography";
import { DocumentJourney } from "@/components/design-system/molecules/DocumentJourney";
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

function CreateDCPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPoNumber = searchParams ? searchParams.get("po") : "";

  const [poNumber, setPONumber] = useState(initialPoNumber || "");
  const [items, setItems] = useState<DCItemRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poData, setPOData] = useState<POHeader | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const [formData, setFormData] = useState({
    dc_number: "",
    dc_date: new Date().toISOString().split("T")[0],
    supplier_phone: "0755 – 4247748",
    supplier_gstin: "23AACFS6810L1Z7",
    consignee_name: "",
    consignee_address: "",
  });

  useEffect(() => {
    if (initialPoNumber) {
      handleLoadItems(initialPoNumber);
      fetchPOData(initialPoNumber);
    }
  }, [initialPoNumber]);

  const checkNumberDuplicate = async (num: string, date: string) => {
    if (!num || num.length < 3) return;
    setIsChecking(true);
    try {
      const res = await api.checkDuplicateNumber("DC", num, date);
      setIsDuplicate(res.exists);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  const fetchPOData = async (po: string) => {
    try {
      const data = await api.getPODetail(parseInt(po));
      if (data?.header) {
        setPOData(data.header);
        setFormData((prev) => ({
          ...prev,
          consignee_name: (data.header as any)?.consignee_name || "",
          consignee_address: (data.header as any)?.consignee_address || "",
          supplier_phone: data.header?.supplier_phone || "0755 – 4247748",
          supplier_gstin: data.header?.supplier_gstin || "23AACFS6810L1Z7",
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadItems = async (po: string) => {
    if (!po) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getReconciliationLots(parseInt(po));
      const lotsData = Array.isArray(data) ? data : (data as any)?.lots || [];
      const mappedItems: DCItemRow[] = lotsData.map((lot: any) => ({
        id: `${lot.po_item_id}-${lot.lot_no}`,
        lot_no: lot.lot_no?.toString() || "",
        description: lot.material_description || "",
        drg_no: lot.drg_no || "",
        ordered_quantity: lot.ordered_qty || 0,
        remaining_post_dc: lot.remaining_qty || 0,
        dispatch_quantity: 0,
        po_item_id: lot.po_item_id,
      }));
      setItems(mappedItems);
      if (mappedItems.length === 0) setError("No items available for dispatch");
    } catch (err: any) {
      setError(err.message || "Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    const itemsToDispatch = items.filter(
      (item) => item.dispatch_quantity && item.dispatch_quantity > 0,
    );
    if (itemsToDispatch.length === 0) {
      setError("At least one item must have dispatch quantity");
      setIsSubmitting(false);
      return;
    }
    try {
      const dcPayload = {
        dc_number: formData.dc_number,
        dc_date: formData.dc_date,
        po_number: poNumber ? parseInt(poNumber) : undefined,
        supplier_phone: formData.supplier_phone,
        supplier_gstin: formData.supplier_gstin,
        consignee_name: formData.consignee_name,
        consignee_address: formData.consignee_address,
        remarks: notes.join("\n\n"),
      };
      const itemsPayload = itemsToDispatch.map((item) => ({
        po_item_id: item.po_item_id,
        lot_no: item.lot_no ? parseInt(item.lot_no.toString()) : undefined,
        dispatch_qty: item.dispatch_quantity,
        hsn_code: null,
        hsn_rate: null,
      }));
      const response = (await api.createDC(dcPayload, itemsPayload)) as any;
      router.push(`/dc/${response.dc_number || formData.dc_number}`);
    } catch (err: any) {
      console.error("DC creation failed:", err);
      // Handle Pydantic 422 errors specifically to show something readable
      if (err.status === 422 && Array.isArray(err.data?.detail)) {
        const details = err.data.detail
          .map((d: any) => `${d.loc.join(".")}: ${d.msg}`)
          .join(", ");
        setError(`Validation Error: ${details}`);
      } else {
        const msg =
          typeof err.message === "object"
            ? JSON.stringify(err.message)
            : err.message || "Failed to create challan";
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const topActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        color="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={
          isSubmitting ||
          items.length === 0 ||
          isDuplicate ||
          isChecking ||
          !formData.dc_number
        }
      >
        {isSubmitting ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : (
          <Save size={16} className="mr-2" />
        )}
        {isSubmitting ? "Generating..." : "Generate Challan"}
      </Button>
    </div>
  );

  return (
    <DocumentTemplate
      title="Create Delivery Challan"
      description="Generate dispatch documentation from PO"
      actions={topActions}
    >
      <div className="mb-6">
        <DocumentJourney currentStage="DC" />
      </div>

      <div className="space-y-6">
        {error && (
          <Card className="p-4 bg-red-50 border-red-100">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={16} />
              <SmallText className="font-medium">{error}</SmallText>
            </div>
          </Card>
        )}

        {/* PO Selection */}
        {!initialPoNumber && (
          <Card className="p-6">
            <Label className="text-[10px] uppercase tracking-widest text-slate-600 mb-2 block font-medium">
              Purchase Order Reference
            </Label>
            <div className="flex gap-3 mt-1">
              <div className="flex-1">
                <Input
                  value={poNumber}
                  onChange={(e) => setPONumber(e.target.value)}
                  placeholder="Enter PO number"
                  className="font-medium text-slate-930"
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => handleLoadItems(poNumber)}
                disabled={!poNumber || isLoading}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Search size={16} className="mr-2" />
                )}
                {isLoading ? "Loading..." : "Load Items"}
              </Button>
            </div>
            {poData && (
              <div className="mt-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                    Supplier
                  </Label>
                  <Body className="text-slate-950 font-medium">
                    {poData.supplier_name}
                  </Body>
                </div>
                <Badge
                  variant="outline"
                  className="bg-white font-medium text-slate-600 border-slate-200"
                >
                  PO #{poData.po_number}
                </Badge>
              </div>
            )}
          </Card>
        )}

        {/* Challan Details */}
        <Card className="p-6">
          <H3 className="mb-6 font-medium text-slate-950">
            Challan Information
          </H3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                DC Number
              </Label>
              <Input
                value={formData.dc_number}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, dc_number: val });
                  checkNumberDuplicate(val, formData.dc_date);
                }}
                className={cn(
                  "font-medium tabular-nums",
                  isDuplicate
                    ? "border-red-500 text-red-600 focus:ring-red-500/10"
                    : "text-slate-930",
                )}
                placeholder="DC/001/24-25"
              />
              {isChecking && (
                <SmallText className="text-slate-400 animate-pulse">
                  Checking uniqueness...
                </SmallText>
              )}
              {isDuplicate && (
                <SmallText className="text-red-500 font-medium">
                  This number already exists in this FY
                </SmallText>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                DC Date
              </Label>
              <Input
                type="date"
                value={formData.dc_date}
                onChange={(e) =>
                  setFormData({ ...formData, dc_date: e.target.value })
                }
                className="font-medium text-slate-930"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                Supplier Phone
              </Label>
              <Input
                value={formData.supplier_phone}
                onChange={(e) =>
                  setFormData({ ...formData, supplier_phone: e.target.value })
                }
                className="font-medium text-slate-930"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                Supplier GSTIN
              </Label>
              <Input
                value={formData.supplier_gstin}
                onChange={(e) =>
                  setFormData({ ...formData, supplier_gstin: e.target.value })
                }
                className="font-medium text-slate-930 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                Consignee Name
              </Label>
              <Input
                value={formData.consignee_name}
                onChange={(e) =>
                  setFormData({ ...formData, consignee_name: e.target.value })
                }
                className="font-medium text-slate-930"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
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
                className="w-full px-3 py-2 text-[13px] font-medium text-slate-930 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-300 resize-none transition-all"
                rows={2}
              />
            </div>
          </div>
        </Card>

        {/* Items Table */}
        {items.length > 0 && (
          <Card className="p-0 overflow-hidden border-none shadow-sm">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <H3 className="font-medium text-slate-950 text-sm">
                Dispatch Items ({items.length})
              </H3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="py-3 px-6 text-left">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                        Lot
                      </Label>
                    </th>
                    <th className="py-3 px-6 text-left">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                        Description
                      </Label>
                    </th>
                    <th className="py-3 px-6 text-right">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                        Ord
                      </Label>
                    </th>
                    <th className="py-3 px-6 text-right">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                        Bal
                      </Label>
                    </th>
                    <th className="py-3 px-6 text-right">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                        Dlv Qty
                      </Label>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-50 hover:bg-slate-50/20 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <Accounting className="text-slate-930 font-medium">
                          {item.lot_no}
                        </Accounting>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <Body className="text-slate-950 font-medium leading-normal">
                            {item.description}
                          </Body>
                          {item.drg_no && (
                            <span className="text-[10px] uppercase tracking-tight text-slate-500 mt-0.5 font-medium">
                              DRG: {item.drg_no}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Accounting className="text-slate-600">
                          {item.ordered_quantity}
                        </Accounting>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Accounting className="text-slate-600">
                          {item.remaining_post_dc}
                        </Accounting>
                      </td>
                      <td className="py-4 px-6">
                        <Input
                          type="number"
                          value={item.dispatch_quantity || ""}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].dispatch_quantity =
                              parseFloat(e.target.value) || 0;
                            setItems(newItems);
                          }}
                          className="text-right max-w-[100px] ml-auto font-medium font-mono h-9 border-slate-200 focus:ring-slate-950/5"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Notes */}
        <Card className="p-6">
          <Label className="text-[10px] uppercase tracking-widest text-slate-600 mb-4 block font-medium">
            Additional Notes
          </Label>
          <div className="space-y-3">
            {notes.map((note, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={note}
                  onChange={(e) => {
                    const newNotes = [...notes];
                    newNotes[idx] = e.target.value;
                    setNotes(newNotes);
                  }}
                  placeholder="Enter additional information..."
                  className="font-medium text-slate-930"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotes(notes.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotes([...notes, ""])}
              className="border-dashed border-2 hover:border-slate-300"
            >
              <Plus size={16} className="mr-2" />
              Add Line Note
            </Button>
          </div>
        </Card>
      </div>
    </DocumentTemplate>
  );
}

export default function CreateDCPage() {
  return (
    <Suspense
      fallback={
        <div className="p-32 text-center">
          <Body className="text-slate-400 animate-pulse">
            Loading template...
          </Body>
        </div>
      }
    >
      <CreateDCPageContent />
    </Suspense>
  );
}
