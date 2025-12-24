"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Edit2, Save, X, FileText, Plus, Trash2, Truck, AlertCircle, ShoppingCart } from "lucide-react";

import { api, API_BASE_URL } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { DCItemRow as DCItemRowType } from "@/types";
import DownloadButton from "@/components/DownloadButton";
import { Card } from "@/components/ui/Card";


const PO_NOTE_TEMPLATES = [
    { id: 't1', title: 'Standard Dispatch Note', content: 'Material is being dispatched against PO No: ... dated ...' },
    { id: 't2', title: 'Warranty Note', content: 'Standard Manufacturer Warranty applicable.' },
    { id: 't3', title: 'Inspection Note', content: 'Material inspected by ... on ...' },
    { id: 't4', title: 'Excise Gate Pass', content: 'Excise Gate Pass No: ... Date: ...' }
];



function DCDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dcId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [hasInvoice, setHasInvoice] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [items, setItems] = useState<DCItemRowType[]>([]);
    const [notes, setNotes] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");

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

                    if (data.items && data.items.length > 0) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const mappedItems: DCItemRowType[] = (data.items as any[]).map((item: any, idx: number) => ({
                            id: `item-${idx}`,
                            lot_no: item.lot_no?.toString() || (idx + 1).toString(),
                            description: item.material_description || item.description || "",
                            ordered_quantity: item.lot_ordered_qty || item.ordered_qty || 0,
                            remaining_post_dc: item.remaining_post_dc || 0,
                            dispatch_quantity: item.dispatch_qty || item.dispatch_quantity || 0,
                            received_quantity: item.received_quantity || 0,
                            po_item_id: item.po_item_id
                        }));
                        setItems(mappedItems);
                    } else if (data.header.po_number) {
                        await fetchPOItems(data.header.po_number.toString());
                    }

                    if (data.header.remarks) {
                        setNotes([...data.header.remarks.split('\n\n')]);
                    }
                }

                const invoiceData = await api.checkDCHasInvoice(dcId);
                if (invoiceData && invoiceData.has_invoice) {
                    setHasInvoice(true);
                    setInvoiceNumber(invoiceData.invoice_number || null);
                }

                setLoading(false);
            } catch (err) {
                console.error("Failed to load DC:", err);
                setError(err instanceof Error ? err.message : "Failed to load DC");
                setLoading(false);
            }
        };

        loadDCData();
    }, [dcId]);

    const fetchPOItems = async (poNumber: string) => {
        try {
            const data = await api.getReconciliation(parseInt(poNumber));
            if (data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedItems: DCItemRowType[] = (data as any[]).map((item: any, idx: number) => ({
                    id: `item-${idx}`,
                    lot_no: item.lot_no?.toString() || (idx + 1).toString(),
                    description: item.material_description || "",
                    ordered_quantity: item.ordered_quantity || item.ordered_qty || 0,
                    remaining_post_dc: item.remaining_quantity || item.remaining_qty || 0,
                    dispatch_quantity: 0,
                    po_item_id: item.po_item_id
                }));
                setItems(mappedItems);
            }
        } catch (err) {
            console.error("Failed to fetch PO items:", err);
        }
    };

    const handleAddNote = () => {
        const template = PO_NOTE_TEMPLATES.find(t => t.id === selectedTemplate);
        if (template) {
            setNotes([...notes, template.content]);
            setSelectedTemplate("");
        }
    };

    const handleRemoveNote = (index: number) => {
        const newNotes = [...notes];
        newNotes.splice(index, 1);
        setNotes(newNotes);
    };

    const handleNoteChange = (index: number, text: string) => {
        const newNotes = [...notes];
        newNotes[index] = text;
        setNotes(newNotes);
    };

    const handleItemChange = (id: string, field: keyof DCItemRowType, value: string | number) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleDeleteItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleAddItem = () => {
        alert("Adding items to existing DC is mostly restricted to existing PO lots. Please create new DC for new items or ensure you map PO Item ID correctly.");
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const dcPayload = {
                dc_number: formData.dc_number,
                dc_date: formData.dc_date,
                po_number: formData.po_number ? parseInt(formData.po_number) : undefined,
                consignee_name: formData.consignee_name,
                consignee_address: formData.consignee_address,
                eway_bill_number: formData.eway_bill_number,
                remarks: notes.join("\n\n")
            };

            const itemsPayload = items.map(item => ({
                po_item_id: item.po_item_id,
                lot_no: item.lot_no ? parseInt(item.lot_no.toString()) : undefined,
                dispatch_qty: item.dispatch_quantity
            }));

            if (!dcId) return;
            await api.updateDC(dcId, dcPayload, itemsPayload);
            setEditMode(false);
            window.location.reload();
        } catch (err) {
            console.error("Failed to update DC", err);
            setError(err instanceof Error ? err.message : "Failed to update DC");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
                <div className="text-primary font-medium animate-pulse">Loading...</div>
            </div>
        );
    }

    interface FieldProps {
        label: string;
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
        disabled?: boolean;
        type?: string;
    }

    const Field = ({ label, value, onChange, placeholder = "", disabled = false, type = "text" }: FieldProps) => (
        <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled || !editMode}
                className={`w-full px-2 py-1.5 text-xs border rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-slate-800 transition-all ${disabled || !editMode
                    ? 'bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed'
                    : 'bg-white border-slate-300 shadow-sm'
                    }`}
            />
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-4 md:p-6 space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-800 transition-colors p-1">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                            Delivery Challan {formData.dc_number}
                            {formData.po_number && (
                                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                                    PO: <button onClick={() => router.push(`/po/view?id=${formData.po_number}`)} className="text-purple-600 hover:underline hover:text-purple-800">{formData.po_number}</button>
                                </span>
                            )}
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            Date: {formatDate(formData.dc_date)}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {editMode ? (
                        <>
                            <button
                                onClick={() => setEditMode(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" /> Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm shadow-purple-500/20"
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <DownloadButton
                                url={`${API_BASE_URL}/api/dc/${formData.dc_number}/download`}
                                filename={`DC_${formData.dc_number}.xlsx`}
                                label="Download Challan"
                            />
                            <button
                                onClick={() => {
                                    if (hasInvoice && invoiceNumber) {
                                        router.push(`/invoice/view?id=${invoiceNumber}`);
                                    } else {
                                        router.push(`/invoice/create?dc=${dcId}`);
                                    }
                                }}
                                className={`px-4 py-2 text-xs font-bold text-white rounded-lg flex items-center gap-2 shadow-sm transition-all ${hasInvoice
                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                {hasInvoice ? 'View Invoice' : 'Create Invoice'}
                            </button>
                            <button
                                onClick={() => setEditMode(true)}
                                disabled={hasInvoice}
                                className="px-4 py-2 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                                title={hasInvoice ? "Cannot edit DC - already has invoice" : ""}
                            >
                                <Edit2 className="w-4 h-4" /> Edit
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {
                error && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3 text-red-600">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )
            }

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Side: Basic Info & Remarks */}
                <div className="md:col-span-1 space-y-6">
                    <Card variant="glass" padding="none" className="overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/20 bg-white/40">
                            <Truck className="w-4 h-4 text-purple-600" />
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Consignee</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <Field
                                label="DC Number"
                                value={formData.dc_number}
                                onChange={(v: string) => setFormData({ ...formData, dc_number: v })}
                                disabled={true}
                            />
                            <Field
                                label="Date"
                                type="date"
                                value={formData.dc_date}
                                onChange={(v: string) => setFormData({ ...formData, dc_date: v })}
                            />
                            <div className="h-px bg-slate-100 my-1" />
                            <Field
                                label="Consignee Name"
                                value={formData.consignee_name}
                                onChange={(v: string) => setFormData({ ...formData, consignee_name: v })}
                            />
                            <div className="space-y-1">
                                <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500">Address</label>
                                <textarea
                                    value={formData.consignee_address}
                                    onChange={(e) => setFormData({ ...formData, consignee_address: e.target.value })}
                                    disabled={!editMode}
                                    rows={3}
                                    className={`w-full px-2 py-1.5 text-xs border rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-slate-800 transition-all resize-none ${!editMode
                                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                                        : 'bg-white border-slate-300 shadow-sm'
                                        }`}
                                />
                            </div>
                            <div className="h-px bg-slate-100 my-1" />
                            <Field
                                label="Supplier Phone"
                                value={formData.supplier_phone}
                                onChange={(v: string) => setFormData({ ...formData, supplier_phone: v })}
                            />
                            <Field
                                label="Supplier GSTIN"
                                value={formData.supplier_gstin}
                                onChange={(v: string) => setFormData({ ...formData, supplier_gstin: v })}
                            />
                        </div>
                    </Card>

                    <Card variant="glass" padding="none" className="overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/20 bg-white/40">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Remarks</h3>
                        </div>
                        <div className="p-4">
                            {editMode && (
                                <div className="flex gap-2 mb-4 p-3 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                    <div className="flex-1 relative">
                                        <select
                                            value={selectedTemplate}
                                            onChange={(e) => setSelectedTemplate(e.target.value)}
                                            className="w-full appearance-none px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-slate-700 font-medium"
                                        >
                                            <option value="">-- Add Templated Note --</option>
                                            {PO_NOTE_TEMPLATES.map(t => (
                                                <option key={t.id} value={t.id}>{t.title}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                            <Plus className="h-3 w-3 rotate-45" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!selectedTemplate}
                                        className="px-3 py-1.5 bg-slate-800 text-white rounded-md hover:bg-slate-900 text-xs font-bold disabled:opacity-50 disabled:bg-slate-300 transition-colors shadow-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}

                            <div className="space-y-2">
                                {notes.map((note, index) => (
                                    <div key={index} className="flex gap-2 items-start group">
                                        <textarea
                                            value={note}
                                            onChange={(e) => handleNoteChange(index, e.target.value)}
                                            rows={2}
                                            disabled={!editMode}
                                            className={`flex-1 border rounded-md text-xs text-slate-700 py-1.5 px-2 focus:ring-1 focus:ring-primary focus:border-primary transition-all ${!editMode
                                                ? 'bg-slate-50 text-slate-600 border-transparent resize-none'
                                                : 'bg-white border-slate-300'
                                                }`}
                                        />
                                        {editMode && (
                                            <button
                                                onClick={() => handleRemoveNote(index)}
                                                className="mt-1 text-slate-400 hover:text-red-600 p-1 rounded transition-colors hover:bg-red-50"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {notes.length === 0 && (
                                    <div className="text-center py-4 bg-slate-50/30 rounded border border-dashed border-slate-100 text-slate-400 text-xs italic">
                                        No remarks added.
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Side: Items */}
                <div className="md:col-span-2">
                    <Card variant="glass" padding="none" className="overflow-visible min-h-[500px]">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-purple-600" />
                                <h3 className="text-[14px] font-bold text-slate-800">Dispatched Items</h3>
                            </div>
                            {editMode && (
                                <button onClick={handleAddItem} className="text-purple-600 hover:text-purple-800 text-xs font-bold flex items-center gap-1 transition-colors bg-purple-50 px-2 py-1 rounded border border-purple-100">
                                    <Plus className="w-3.5 h-3.5" /> Add Row
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold">
                                        <th className="px-4 py-3 w-16 text-center">Lot</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3 w-20 text-right">Ord.</th>
                                        <th className="px-4 py-3 w-20 text-right">Rem.</th>
                                        <th className="px-4 py-3 w-32 text-right">Dispatch</th>
                                        {editMode && <th className="px-4 py-3 w-10 text-center"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.length > 0 ? items.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-2">
                                                {editMode ? (
                                                    <input
                                                        type="text"
                                                        value={item.lot_no}
                                                        onChange={(e) => handleItemChange(item.id, 'lot_no', e.target.value)}
                                                        className="w-full border border-slate-300 rounded px-1 py-1 focus:ring-1 focus:ring-primary text-xs bg-white text-center"
                                                        readOnly
                                                    />
                                                ) : (
                                                    <div className="text-xs font-bold text-slate-600 text-center bg-slate-100/50 py-1 rounded border border-slate-200">{item.lot_no}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 h-full">
                                                {editMode ? (
                                                    <textarea
                                                        value={item.description}
                                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                        className="w-full border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary text-xs bg-white resize-none"
                                                        rows={2}
                                                        readOnly
                                                    />
                                                ) : (
                                                    <div className="text-xs text-slate-800 font-medium py-1">{item.description}</div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium text-slate-600">{(item.ordered_quantity || 0).toLocaleString('en-IN')}</td>
                                            <td className="px-3 py-2 text-right font-medium text-amber-600">{(item.remaining_post_dc || 0).toLocaleString('en-IN')}</td>
                                            <td className="px-4 py-2">
                                                {editMode ? (
                                                    <input
                                                        type="number"
                                                        value={item.dispatch_quantity}
                                                        onChange={(e) => handleItemChange(item.id, 'dispatch_quantity', parseFloat(e.target.value))}
                                                        className="w-full border border-purple-300 rounded px-2 py-1 font-bold text-purple-700 text-xs text-right bg-purple-50 focus:ring-1 focus:ring-purple-500"
                                                        placeholder="0"
                                                    />
                                                ) : (
                                                    <div className="text-right font-bold text-purple-700 text-xs bg-purple-50 px-2 py-1 rounded inline-block w-full">{item.dispatch_quantity}</div>
                                                )}
                                            </td>
                                            {editMode && (
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="text-slate-400 hover:text-red-600 p-1.5 rounded transition-colors hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={editMode ? 6 : 5} className="text-center py-12 text-slate-400 text-xs italic">
                                                No items found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div >
    );
}

export default function DCDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
                <div className="text-purple-600 font-medium animate-pulse">Loading...</div>
            </div>
        }>
            <DCDetailContent />
        </Suspense>
    );
}
