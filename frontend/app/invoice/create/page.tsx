"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Save, Loader2, AlertCircle, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { InvoiceFormData, InvoiceItemUI } from "@/types/ui";
import { createDefaultInvoiceForm } from "@/lib/uiAdapters";
import { amountInWords, formatIndianCurrency } from "@/lib/utils";
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

const TAX_RATES = { cgst: 9.0, sgst: 9.0 };

function CreateInvoicePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dcId = searchParams?.get("dc") || "";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemUI[]>([]);
  const [manualDcId, setManualDcId] = useState(dcId);
  const [formData, setFormData] = useState<InvoiceFormData>(
    createDefaultInvoiceForm(dcId || undefined),
  );
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (dcId) loadDC(dcId);
  }, [dcId]);

  const checkNumberDuplicate = async (num: string, date: string) => {
    if (!num || num.length < 3) return;
    setIsChecking(true);
    try {
      const res = await api.checkDuplicateNumber("Invoice", num, date);
      setIsDuplicate(res.exists);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  const loadDC = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDCDetail(id);
      if (!data?.header) {
        setError("Challan not found.");
        setLoading(false);
        return;
      }

      // Fetch settings for defaults
      let settings: Record<string, string> = {};
      try {
        settings = await api.getSettings();
      } catch (e) {
        console.warn("Failed to fetch settings:", e);
      }

      setFormData((prev) => ({
        ...prev,
        dc_number: data.header.dc_number || "",
        challan_date: data.header.dc_date || "",
        buyers_order_no: data.header.po_number?.toString() || "",
        buyers_order_date: data.header.po_date || "",
        buyer_name:
          data.header.consignee_name || settings["buyer_name"] || "BHEL",
        buyer_gstin:
          data.header.consignee_gstin || settings["buyer_gstin"] || "",
        buyer_address:
          data.header.consignee_address || settings["buyer_address"] || "",
        buyer_state:
          (data.header as any).consignee_state || settings["buyer_state"] || "",
        vehicle_no: data.header.vehicle_no || "",
        lr_no: data.header.lr_no || "",
        transporter: data.header.transporter || "",
        destination: (data.header as any).destination || "",
      }));

      if (data.items?.length > 0) {
        const items: InvoiceItemUI[] = data.items.map((item: any) => {
          const qty = item.dispatched_quantity || item.dispatch_qty || 0;
          const rate = item.po_rate || 0;
          const taxableValue = qty * rate;
          const cgstAmount = (taxableValue * TAX_RATES.cgst) / 100;
          const sgstAmount = (taxableValue * TAX_RATES.sgst) / 100;
          return {
            lotNumber: item.lot_no?.toString() || "",
            description: item.description || item.material_description || "",
            hsnCode: item.hsn_code || "",
            quantity: qty,
            unit: "NO",
            rate: rate,
            taxableValue,
            tax: {
              cgstRate: TAX_RATES.cgst,
              cgstAmount,
              sgstRate: TAX_RATES.sgst,
              sgstAmount,
              igstRate: 0,
              igstAmount: 0,
            },
            totalAmount: taxableValue + cgstAmount + sgstAmount,
          };
        });
        setInvoiceItems(items);
        calculateTotals(items);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load DC");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items: InvoiceItemUI[]) => {
    const taxable = items.reduce((sum, item) => sum + item.taxableValue, 0);
    const cgst = items.reduce((sum, item) => sum + item.tax.cgstAmount, 0);
    const sgst = items.reduce((sum, item) => sum + item.tax.sgstAmount, 0);
    const total = items.reduce((sum, item) => sum + item.totalAmount, 0);

    const validTotal = isNaN(total) ? 0 : total;

    setFormData(
      (prev) =>
        ({
          ...prev,
          taxable_value: isNaN(taxable) ? 0 : taxable,
          cgst: isNaN(cgst) ? 0 : cgst,
          sgst: isNaN(sgst) ? 0 : sgst,
          total_invoice_value: validTotal,
          amount_in_words: amountInWords(validTotal),
        }) as any,
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Map UI items to backend expected format (InvoiceItemCreate)
      const apiItems = invoiceItems.map((item) => ({
        po_sl_no: item.lotNumber,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || "NO",
        rate: item.rate,
        hsn_sac: item.hsnCode,
        no_of_packets: (item as any).no_of_packets,
      }));

      // Prepare header (EnhancedInvoiceCreate)
      const payload = {
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        dc_number: formData.dc_number,
        buyer_name: formData.buyer_name || "BHEL", // Default if missing
        buyer_address: (formData as any).buyer_address,
        buyer_gstin: formData.buyer_gstin,
        buyer_state: formData.buyer_state,
        buyer_state_code: (formData as any).buyer_state_code,
        place_of_supply: formData.place_of_supply,
        buyers_order_no: formData.buyers_order_no,
        buyers_order_date: formData.buyers_order_date,
        vehicle_no: formData.vehicle_no,
        lr_no: formData.lr_no,
        transporter: formData.transporter,
        destination: formData.destination,
        terms_of_delivery: formData.terms_of_delivery,
        gemc_number: formData.gemc_number,
        gemc_date: formData.gemc_date,
        mode_of_payment: formData.mode_of_payment,
        payment_terms: formData.payment_terms || "45 Days",
        despatch_doc_no: formData.despatch_doc_no,
        srv_no: formData.srv_no,
        srv_date: formData.srv_date,
        remarks: formData.remarks,
        items: apiItems,
      };

      await api.createInvoice(payload);
      router.push(`/invoice/${formData.invoice_number}`);
    } catch (err: any) {
      console.error("Invoice creation failed:", err);
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
            : err.message || "Failed to create invoice";
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const topActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        disabled={saving}
      >
        Cancel
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={handleSave}
        disabled={
          saving ||
          invoiceItems.length === 0 ||
          isDuplicate ||
          isChecking ||
          !formData.invoice_number
        }
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : (
          <Save size={16} className="mr-2" />
        )}
        {saving ? "Saving..." : "Generate Invoice"}
      </Button>
    </div>
  );

  return (
    <DocumentTemplate
      title="Create GST Invoice"
      description="Generate billing documentation from DC"
      actions={topActions}
    >
      <div className="mb-6">
        <DocumentJourney currentStage="Invoice" />
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

        {/* DC Selection */}
        {!dcId && (
          <Card className="p-6">
            <Label className="text-[10px] uppercase tracking-widest text-slate-600 mb-2 block font-medium">
              Delivery Challan Reference
            </Label>
            <div className="flex gap-3 mt-1">
              <div className="flex-1">
                <Input
                  value={manualDcId}
                  onChange={(e) => setManualDcId(e.target.value)}
                  placeholder="Enter DC number"
                  className="font-medium text-slate-930"
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => loadDC(manualDcId)}
                disabled={!manualDcId || loading}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Search size={16} className="mr-2" />
                )}
                {loading ? "Loading..." : "Load DC"}
              </Button>
            </div>
          </Card>
        )}

        {/* Invoice Details */}
        <Card className="p-6">
          <H3 className="mb-6 font-medium text-slate-950 text-sm">
            Invoice Information
          </H3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                Invoice Number
              </Label>
              <Input
                value={formData.invoice_number}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, invoice_number: val });
                  checkNumberDuplicate(val, formData.invoice_date);
                }}
                className={cn(
                  "font-medium tabular-nums",
                  isDuplicate
                    ? "border-red-500 text-red-600 focus:ring-red-500/10"
                    : "text-slate-930",
                )}
                placeholder="INV/001/24-25"
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
                Invoice Date
              </Label>
              <Input
                type="date"
                value={formData.invoice_date}
                onChange={(e) =>
                  setFormData({ ...formData, invoice_date: e.target.value })
                }
                className="font-medium text-slate-930"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                Linked DC
              </Label>
              <div className="font-medium text-slate-950 tabular-nums px-3 py-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                {formData.dc_number || "---"}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                Challan Date
              </Label>
              <div className="font-medium text-slate-950 px-3 py-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                {formData.challan_date || "---"}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                Order Reference
              </Label>
              <div className="font-medium text-slate-950 px-3 py-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                {formData.buyers_order_no || "---"}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                Order Date
              </Label>
              <div className="font-medium text-slate-950 px-3 py-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                {formData.buyers_order_date || "---"}
              </div>
            </div>

            {/* New Report Fields */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                GEMC Number
              </Label>
              <Input
                value={formData.gemc_number || ""}
                onChange={(e) =>
                  setFormData({ ...formData, gemc_number: e.target.value })
                }
                placeholder="Optional"
                className="font-medium text-slate-930"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                GEMC Date
              </Label>
              <Input
                type="date"
                value={(formData as any).gemc_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, gemc_date: e.target.value } as any)
                }
                className="font-medium text-slate-930"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                Mode / Terms of Payment
              </Label>
              <Input
                value={formData.mode_of_payment || "45 Days"}
                onChange={(e) =>
                  setFormData({ ...formData, mode_of_payment: e.target.value })
                }
                className="font-medium text-slate-930"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                Despatch Document No
              </Label>
              <Input
                value={formData.despatch_doc_no || ""}
                onChange={(e) =>
                  setFormData({ ...formData, despatch_doc_no: e.target.value })
                }
                placeholder="If different from DC"
                className="font-medium text-slate-930"
              />
            </div>
            <div className="space-y-1.5 grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                  SRV No
                </Label>
                <Input
                  value={formData.srv_no || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, srv_no: e.target.value })
                  }
                  placeholder="Optional"
                  className="font-medium text-slate-930"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
                  SRV Date
                </Label>
                <Input
                  type="date"
                  value={formData.srv_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, srv_date: e.target.value })
                  }
                  className="font-medium text-slate-930"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Items Table */}
        {invoiceItems.length > 0 && (
          <Card className="p-0 overflow-hidden border-none shadow-sm">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <H3 className="font-medium text-slate-950 text-sm">
                Invoice Items ({invoiceItems.length})
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
                    <th className="py-3 px-6 text-left">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                        HSN
                      </Label>
                    </th>
                    <th className="py-3 px-6 text-right">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                        Qty
                      </Label>
                    </th>
                    <th className="py-3 px-6 text-right">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                        Rate
                      </Label>
                    </th>
                    <th className="py-3 px-6 text-right">
                      <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                        Total
                      </Label>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-50 hover:bg-slate-50/10 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <Accounting className="font-medium text-slate-930">
                          {item.lotNumber}
                        </Accounting>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-950">
                        {item.description}
                      </td>
                      <td className="py-4 px-6 text-[11px] font-mono text-slate-500">
                        {item.hsnCode}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Accounting className="text-slate-600">
                          {item.quantity}
                        </Accounting>
                      </td>
                      <td className="py-4 px-6 text-right text-slate-600 font-mono text-[12px]">
                        {formatIndianCurrency(item.rate)}
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-slate-950">
                        <Accounting isCurrency>{item.totalAmount}</Accounting>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50/50 border-t border-slate-100 p-8">
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 max-w-sm ml-auto">
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                  Taxable Value
                </Label>
                <Accounting
                  isCurrency
                  className="text-right text-slate-600 font-medium"
                >
                  {formData.taxable_value || 0}
                </Accounting>

                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                  CGST @ 9%
                </Label>
                <Accounting
                  isCurrency
                  className="text-right text-slate-600 font-medium"
                >
                  {formData.cgst || 0}
                </Accounting>

                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                  SGST @ 9%
                </Label>
                <Accounting
                  isCurrency
                  className="text-right text-slate-600 font-medium"
                >
                  {formData.sgst || 0}
                </Accounting>

                <div className="col-span-2 my-2 border-t border-slate-200"></div>

                <Label className="text-[11px] uppercase tracking-[0.2em] text-slate-900 font-bold">
                  Grand Total
                </Label>
                <Accounting
                  isCurrency
                  className="text-right text-xl font-medium text-slate-950"
                >
                  {formData.total_invoice_value}
                </Accounting>

                <div className="col-span-2 mt-4 text-[11px] text-slate-500 italic leading-relaxed text-right">
                  {(formData as any).amount_in_words || "---"} Only
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DocumentTemplate>
  );
}

export default function CreateInvoicePage() {
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
      <CreateInvoicePageContent />
    </Suspense>
  );
}
