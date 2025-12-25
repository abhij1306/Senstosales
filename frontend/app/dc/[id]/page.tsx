"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft, Edit2, Save, X, FileText, Plus, Trash2,
    Truck, AlertCircle, Download, Calendar, CheckCircle2
} from "lucide-react";
import { api, API_BASE_URL } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { DCItemRow as DCItemRowType } from "@/types";
import {
    H1, H3, Body, SmallText, Label,
    Accounting, DocumentJourney, DocumentTemplate,
    Button, Badge, Input, Card,
    Tabs, TabsList, TabsTrigger, TabsContent,
    Column
} from "@/components/design-system";
import { DataTable } from "@/components/design-system/organisms/DataTable";

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

    useEffect(() => {
        if (!dcId) return;
        const loadDCData = async () => {
            try {
                const data = await api.getDCDetail(dcId);
                if (data.header) {
                    setFormData({
                        dc_number: data.header.dc_number || "",
                        dc_date: data.header.dc_date || "",
                        po_number: data.header.po_number?.toString() || "",
                        supplier_phone: data.header.supplier_phone || "0755 – 4247748",
                        supplier_gstin: data.header.supplier_gstin || "23AACFS6810L1Z7",
                        consignee_name: data.header.consignee_name || "The Sr. Manager (CRX)",
                        consignee_address: data.header.consignee_address || "M/S Bharat Heavy Eletrical Ltd. Bhopal",
                        department_no: data.header.department_no?.toString() || "",
                        eway_bill_number: data.header.eway_bill_no || "",
                    });
                    if (data.items) {
                        setItems(data.items.map((item: any, idx: number) => ({
                            id: `item-${idx}`,
                            lot_no: item.lot_no?.toString() || (idx + 1).toString(),
                            material_code: item.material_code || "",
                            description: item.material_description || item.description || "",
                            ordered_quantity: item.lot_ordered_qty || item.ordered_qty || 0,
                            remaining_post_dc: item.remaining_post_dc || 0,
                            dispatch_quantity: item.dispatch_qty || item.dispatch_quantity || 0,
                            received_quantity: item.received_quantity || 0,
                            po_item_id: item.po_item_id
                        })));
                    }
                    if (data.header.remarks) setNotes(data.header.remarks.split('\n\n'));
                }
                const invoiceData = await api.checkDCHasInvoice(dcId);
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

    const itemColumns: Column<DCItemRowType>[] = [
        { key: "material_code", label: "Code", width: "10%", render: (v) => <Accounting className="text-[12px]">{v}</Accounting> },
        {
            key: "description",
            label: "Description",
            width: "35%",
            render: (_v, row) => (
                <div className="space-y-0.5">
                    <div className="font-medium text-slate-950">{row.description}</div>
                    {row.drg_no && <div className="text-[10px] text-[#1A3D7C] font-medium uppercase tracking-tight">DRG: {row.drg_no}</div>}
                </div>
            )
        },
        { key: "ordered_quantity", label: "Ord", align: "center", width: "8%", render: (v) => <Accounting className="text-[12px]">{v}</Accounting> },
        { key: "dispatch_quantity", label: "Dlv", align: "center", width: "8%", render: (_v, row) => <Accounting className="text-[12px] text-blue-930">{row?.dispatch_quantity || 0}</Accounting> },
        { key: "remaining_post_dc", label: "Bal", align: "center", width: "8%", render: (v) => <Accounting className="text-[12px]">{v}</Accounting> },
        { key: "received_quantity", label: "Rec", align: "center", width: "8%", render: (_v, row) => <Accounting className="text-[12px] text-emerald-930">{row?.received_quantity || 0}</Accounting> },
    ];

    const topActions = (
        <div className="flex gap-3">
            {!editMode ? (
                <>
                    <Button variant="outline" size="sm" asChild>
                        <a href={`${API_BASE_URL}/api/dc/${dcId}/download`} target="_blank" rel="noreferrer">
                            <Download size={16} />
                            Excel
                        </a>
                    </Button>
                    {hasInvoice && (
                        <Button variant="secondary" size="sm" onClick={() => router.push(`/invoice/${invoiceNumber}`)}>
                            <FileText size={16} />
                            View Invoice
                        </Button>
                    )}
                    {!hasInvoice && (
                        <Button variant="secondary" size="sm" onClick={() => router.push(`/invoice/create?dc=${dcId}`)}>
                            <Plus size={16} />
                            Create Invoice
                        </Button>
                    )}
                    <Button variant="default" size="sm" onClick={() => setEditMode(true)}>
                        <Edit2 size={16} />
                        Edit
                    </Button>
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

    if (loading) return <div className="p-32 text-center"><Body className="text-[#6B7280] animate-pulse">Loading...</Body></div>;

    return (
        <DocumentTemplate
            title={`DC #${formData.dc_number}`}
            description={`${formData.consignee_name} • ${formatDate(formData.dc_date)}`}
            actions={topActions}
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

                {/* DC Details */}
                <Tabs defaultValue="basic">
                    <TabsList className="mb-4 bg-slate-100/30 p-1 rounded-xl">
                        <TabsTrigger value="basic" className="text-[11px] py-1.5 font-medium text-slate-600 data-[state=active]:text-slate-930">Basic Info</TabsTrigger>
                        <TabsTrigger value="supplier" className="text-[11px] py-1.5 font-medium text-slate-600 data-[state=active]:text-slate-930">Supplier</TabsTrigger>
                        <TabsTrigger value="consignee" className="text-[11px] py-1.5 font-medium text-slate-600 data-[state=active]:text-slate-930">Consignee</TabsTrigger>
                    </TabsList>

                    <Card className="p-6 mt-4 border-none shadow-sm bg-white/50 backdrop-blur-sm">
                        <TabsContent value="basic" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-widest text-slate-600">DC Number</Label>
                                    <Input value={formData.dc_number} readOnly className="bg-[#F9FAFB] font-medium text-slate-930 border-none h-8" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-widest text-slate-600">DC Date</Label>
                                    <Input type="date" value={formData.dc_date} onChange={(e) => setFormData({ ...formData, dc_date: e.target.value })} readOnly={!editMode} className="font-medium text-slate-930 border-none h-8" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-widest text-slate-600">PO Number</Label>
                                    <Input value={formData.po_number} readOnly className="bg-[#F9FAFB] cursor-pointer font-medium text-slate-930 border-none h-8" onClick={() => router.push(`/po/${formData.po_number}`)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-widest text-slate-600">Department No</Label>
                                    <Input value={formData.department_no} onChange={(e) => setFormData({ ...formData, department_no: e.target.value })} readOnly={!editMode} className="font-medium text-slate-930 border-none h-8" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-widest text-slate-600">E-Way Bill Number</Label>
                                    <Input value={formData.eway_bill_number} onChange={(e) => setFormData({ ...formData, eway_bill_number: e.target.value })} readOnly={!editMode} className="font-medium text-slate-930 border-none h-8" />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="supplier" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-widest text-slate-600">Supplier Phone</Label>
                                    <Input value={formData.supplier_phone} onChange={(e) => setFormData({ ...formData, supplier_phone: e.target.value })} readOnly={!editMode} className="font-medium text-slate-930 border-none h-8" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-widest text-slate-600">Supplier GSTIN</Label>
                                    <Input value={formData.supplier_gstin} onChange={(e) => setFormData({ ...formData, supplier_gstin: e.target.value })} readOnly={!editMode} className="font-medium text-slate-930 border-none h-8" />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="consignee" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-widest text-slate-600">Consignee Name</Label>
                                    <Input value={formData.consignee_name} onChange={(e) => setFormData({ ...formData, consignee_name: e.target.value })} readOnly={!editMode} className="font-medium text-slate-930 border-none h-8" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-widest text-slate-600">Consignee Address</Label>
                                    <textarea
                                        value={formData.consignee_address}
                                        onChange={(e) => setFormData({ ...formData, consignee_address: e.target.value })}
                                        className="w-full px-3 py-2 text-[13px] border-none bg-slate-50/50 rounded-md focus:outline-none focus:ring-0 resize-none font-medium text-slate-930"
                                        rows={2}
                                        readOnly={!editMode}
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Card>
                </Tabs>

                {/* Items Table */}
                <div className="space-y-2">
                    <H3 className="px-1 text-[13px] font-medium text-slate-600 uppercase tracking-widest">Dispatched Items ({items.length})</H3>
                    <DataTable
                        columns={itemColumns}
                        data={items}
                        keyField="id"
                    />
                </div>

                {/* Notes */}
                {notes.length > 0 && (
                    <Card className="p-6 border-none shadow-sm bg-slate-50/30">
                        <H3 className="mb-4 text-[13px] font-medium text-slate-600 uppercase tracking-widest">Notes</H3>
                        <div className="space-y-2">
                            {notes.map((note, idx) => (
                                <div key={idx} className="p-3 bg-white/50 rounded-lg border border-slate-100 italic text-[13px] text-slate-600">
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
        <Suspense fallback={<div className="p-32 text-center"><Body className="text-[#6B7280] animate-pulse">Loading...</Body></div>}>
            <DCDetailContent />
        </Suspense>
    );
}
