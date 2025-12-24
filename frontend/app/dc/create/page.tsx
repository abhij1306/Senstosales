"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Search, AlertCircle, Truck, Package, FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from "@/lib/api";
import { DCItemRow, POHeader } from "@/types";
import { Card } from "@/components/ui/Card";

// ============================================================================
// CONSTANTS
// ============================================================================

const PO_NOTE_TEMPLATES = [
    { id: 't1', title: 'Standard Dispatch Note', content: 'Material is being dispatched against PO No: ... dated ...' },
    { id: 't2', title: 'Warranty Note', content: 'Standard Manufacturer Warranty applicable.' },
    { id: 't3', title: 'Inspection Note', content: 'Material inspected by ... on ...' },
    { id: 't4', title: 'Excise Gate Pass', content: 'Excise Gate Pass No: ... Date: ...' }
];

// ============================================================================
// COMPONENTS
// ============================================================================

const Field = ({ label, value, onChange, type = "text", placeholder = "", required = false, readOnly = false, list, className = "" }: any) => (
    <div className={className}>
        <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            placeholder={placeholder}
            list={list}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-slate-800 transition-all ${readOnly
                ? 'bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed'
                : 'bg-white border-slate-300 shadow-sm'
                }`}
        />
    </div>
);

// ============================================================================
// MAIN CONTENT
// ============================================================================

function CreateDCPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialPoNumber = searchParams ? searchParams.get('po') : "";

    const [poNumber, setPONumber] = useState(initialPoNumber || "");
    const [items, setItems] = useState<DCItemRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [poData, setPOData] = useState<POHeader | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notes, setNotes] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [activeTab, setActiveTab] = useState("basic");

    const [formData, setFormData] = useState({
        dc_number: "",
        dc_date: new Date().toISOString().split('T')[0],
        supplier_phone: "0755 – 4247748",
        supplier_gstin: "23AACFS6810L1Z7",
        consignee_name: '',
        consignee_address: ''
    });

    useEffect(() => {
        if (initialPoNumber) {
            handleLoadItems(initialPoNumber);
            fetchPOData(initialPoNumber);
        }
    }, [initialPoNumber]);

    const fetchPOData = async (po: string) => {
        try {
            const data = await api.getPODetail(parseInt(po));
            if (data && data.header) {
                setPOData(data.header);
                setFormData(prev => ({
                    ...prev,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    consignee_name: (data.header as any)?.consignee_name || '',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    consignee_address: (data.header as any)?.consignee_address || '',
                    supplier_phone: data.header?.supplier_phone || '0755 – 4247748',
                    supplier_gstin: data.header?.supplier_gstin || '23AACFS6810L1Z7'
                }));
            }
        } catch (err) {
            console.error("Failed to fetch PO data:", err);
        }
    };

    const handleLoadItems = async (po: string) => {
        if (!po) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getReconciliationLots(parseInt(po));
            const lotsData = Array.isArray(data) ? data : (data as any)?.lots || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedItems: DCItemRow[] = lotsData.map((lot: { po_item_id: string; lot_no?: number; material_description?: string; ordered_qty?: number; remaining_qty?: number }) => ({
                id: `${lot.po_item_id}-${lot.lot_no}`,
                lot_no: lot.lot_no?.toString() || "",
                description: lot.material_description || "",
                ordered_quantity: lot.ordered_qty || 0,
                remaining_post_dc: lot.remaining_qty || 0,
                dispatch_quantity: 0,
                po_item_id: lot.po_item_id
            }));
            setItems(mappedItems);
            if (mappedItems.length === 0) {
                setError("No items available for dispatch (all fully dispatched or no lots found)");
            }
        } catch (err) {
            console.error("Failed to load PO items", err);
            setError(err instanceof Error ? err.message : "Failed to load PO items");
        } finally {
            setIsLoading(false);
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

    const handleItemChange = (id: string, field: keyof DCItemRow, value: string | number) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleDeleteItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleAddItem = () => {
        const newItem: DCItemRow = {
            id: `new-${Date.now()}`,
            lot_no: "",
            description: "",
            ordered_quantity: 0,
            remaining_post_dc: 0,
            dispatch_quantity: 0,
            po_item_id: ""
        };
        setItems([...items, newItem]);
    };

    const handleSubmit = async () => {
        setError(null);
        setIsSubmitting(true);

        if (!formData.dc_number || !formData.dc_date) {
            setError("DC number and date are required");
            setIsSubmitting(false);
            return;
        }

        if (items.length === 0) {
            setError("At least one item is required");
            setIsSubmitting(false);
            return;
        }

        const itemsToDispatch = items.filter(item => item.dispatch_quantity && item.dispatch_quantity > 0);

        if (itemsToDispatch.length === 0) {
            setError("At least one item must have a dispatch quantity greater than 0");
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
                remarks: notes.join("\n\n")
            };

            const itemsPayload = itemsToDispatch.map(item => ({
                po_item_id: item.po_item_id,
                lot_no: item.lot_no ? parseInt(item.lot_no.toString()) : undefined,
                dispatch_qty: item.dispatch_quantity,
                hsn_code: null,
                hsn_rate: null
            }));

            await api.createDC(dcPayload, itemsPayload);
            router.push(`/dc/view?id=${formData.dc_number}`);
        } catch (err) {
            console.error("Failed to create DC", err);
            setError(err instanceof Error ? err.message : "Failed to create DC");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            Create Delivery Challan
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            Dispatch material against PO
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 items-center">
                    {!initialPoNumber && (
                        <div className="flex items-center gap-2 mr-2">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={poNumber}
                                    onChange={(e) => setPONumber(e.target.value)}
                                    className="w-40 pl-8 pr-2 py-2 text-xs border border-slate-300 rounded-lg bg-white shadow-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Link PO #"
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                onClick={() => handleLoadItems(poNumber)}
                                disabled={isLoading || !poNumber}
                                className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-bold transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Fetch...' : 'Link'}
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-medium shadow-sm shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" /> Save Challan
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3 text-red-600">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Form Details */}
                <div className="md:col-span-1 space-y-6">
                    <Card variant="glass" padding="none" className="overflow-hidden">
                        <div className="flex border-b border-white/20 bg-slate-50/50 px-4 pt-1">
                            <button
                                onClick={() => setActiveTab('basic')}
                                className={`px-6 py-3 text-[13px] font-bold transition-all relative top-[1px] border-b-2 mr-2 ${activeTab === 'basic'
                                    ? "border-purple-600 text-purple-700 bg-transparent"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                Basic Info
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <Field label="DC Number" value={formData.dc_number} onChange={(e: any) => setFormData({ ...formData, dc_number: e.target.value })} required placeholder="e.g. DC-001" />
                            <Field label="Date" type="date" value={formData.dc_date} onChange={(e: any) => setFormData({ ...formData, dc_date: e.target.value })} required />

                            <div className="h-px bg-slate-100 my-2" />

                            <Field label="Consignee Name" value={formData.consignee_name} onChange={(e: any) => setFormData({ ...formData, consignee_name: e.target.value })} />

                            <div>
                                <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Consignee Address</label>
                                <textarea
                                    value={formData.consignee_address}
                                    onChange={(e) => setFormData({ ...formData, consignee_address: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:border-purple-600 text-slate-800 bg-white shadow-sm resize-none"
                                />
                            </div>

                            <Field label="Supplier Phone" value={formData.supplier_phone} onChange={(e: any) => setFormData({ ...formData, supplier_phone: e.target.value })} />
                        </div>
                    </Card>

                    <Card variant="glass" className="p-6">
                        <div className="mb-4">
                            <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-purple-600" />
                                Remarks
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                        className="w-full appearance-none px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-slate-700 font-medium"
                                    >
                                        <option value="">-- Add Templated Note --</option>
                                        {PO_NOTE_TEMPLATES.map(t => (
                                            <option key={t.id} value={t.id}>{t.title}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                        <Plus className="h-4 w-4 rotate-45" />
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddNote}
                                    disabled={!selectedTemplate}
                                    className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-xs font-bold disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="space-y-3">
                                {notes.map((note, index) => (
                                    <div key={index} className="flex gap-2 items-start group">
                                        <textarea
                                            value={note}
                                            onChange={(e) => handleNoteChange(index, e.target.value)}
                                            rows={2}
                                            className="flex-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 text-slate-800 bg-white shadow-sm resize-none"
                                        />
                                        <button
                                            onClick={() => handleRemoveNote(index)}
                                            className="mt-1 text-slate-400 hover:text-red-500 p-1.5 rounded transition-colors hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {notes.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4 border border-dashed border-slate-200 rounded-lg">No remarks added.</p>}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Items */}
                <div className="md:col-span-2">
                    <Card variant="glass" padding="none" className="overflow-visible min-h-[500px]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-purple-600" />
                                <h3 className="text-[14px] font-bold text-slate-800">Dispatch Items</h3>
                            </div>
                            <button onClick={handleAddItem} className="text-purple-600 hover:text-purple-800 text-xs font-bold flex items-center gap-1 transition-colors bg-purple-50 px-3 py-1.5 rounded border border-purple-100">
                                <Plus className="w-3.5 h-3.5" /> Add Row
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold">
                                        <th className="px-4 py-3 w-20">Lot</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3 w-24 text-right">Ord.</th>
                                        <th className="px-4 py-3 w-24 text-right">Rem.</th>
                                        <th className="px-4 py-3 w-32 text-right">Dispatch</th>
                                        <th className="px-4 py-3 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.length > 0 ? items.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <input
                                                    value={item.lot_no || ''}
                                                    onChange={(e) => handleItemChange(item.id, 'lot_no', e.target.value)}
                                                    className="w-full border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary text-sm bg-white shadow-sm"
                                                    placeholder="-"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    value={item.description || ''}
                                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                    className="w-full border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary text-sm bg-white shadow-sm"
                                                    placeholder="Item description..."
                                                    readOnly={!!item.po_item_id}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-slate-500">{item.ordered_quantity}</td>
                                            <td className="px-4 py-3 text-right text-sm font-bold text-slate-700">{item.remaining_post_dc}</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.dispatch_quantity || ''}
                                                    onChange={(e) => handleItemChange(item.id, 'dispatch_quantity', parseFloat(e.target.value) || 0)}
                                                    placeholder="0"
                                                    className="w-full border border-purple-300 rounded px-2 py-1 font-bold text-purple-700 text-sm text-right bg-purple-50 focus:ring-1 focus:ring-purple-500 shadow-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="text-slate-400 hover:text-red-600 p-1.5 rounded transition-colors hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-slate-400 text-sm italic">
                                                No items. Link a PO to fetch items automatically.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function CreateDCPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30"><div className="text-purple-600 font-medium animate-pulse">Loading Editor...</div></div>}>
            <CreateDCPageContent />
        </Suspense>
    );
}
