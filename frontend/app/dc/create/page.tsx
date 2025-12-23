"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Calendar, Truck, FileText, Check, AlertCircle, Save, Search } from 'lucide-react';
import { api } from "@/lib/api";
import { DCItemRow, POHeader, TableInputProps } from "@/types";
import type { ChangeEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Mock PO Notes Templates
const PO_NOTE_TEMPLATES = [
    { id: 't1', title: 'Standard Dispatch Note', content: 'Material is being dispatched against PO No: ... dated ...' },
    { id: 't2', title: 'Warranty Note', content: 'Standard Manufacturer Warranty applicable.' },
    { id: 't3', title: 'Inspection Note', content: 'Material inspected by ... on ...' },
    { id: 't4', title: 'Excise Gate Pass', content: 'Excise Gate Pass No: ... Date: ...' }
];

function CreateDCPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialPoNumber = searchParams ? searchParams.get('po') : "";

    const [poNumber, setPONumber] = useState(initialPoNumber || "");
    const [items, setItems] = useState<DCItemRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [poData, setPOData] = useState<POHeader | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notes, setNotes] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");

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
                    supplier_phone: data.header?.supplier_phone || '',
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
            // API returns {po_number: X, lots: [...]} so extract the lots array
            const lotsData = Array.isArray(data) ? data : (data as any)?.lots || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedItems: DCItemRow[] = lotsData.map((lot: { po_item_id: string; lot_no?: number; material_description?: string; ordered_qty?: number; already_dispatched?: number; remaining_qty?: number }) => ({
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
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="text-text-secondary hover:text-text-primary transition-colors p-1"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-text-primary flex items-center gap-3 tracking-tight">
                            Create Delivery Challan
                        </h1>
                        <p className="text-sm text-text-muted mt-0.5">
                            Drafting new shipment against PO
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 items-center">
                    {!initialPoNumber && (
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
                                <input
                                    type="text"
                                    value={poNumber}
                                    onChange={(e) => setPONumber(e.target.value)}
                                    className="w-48 pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-muted/50"
                                    placeholder="Link PO #"
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                onClick={() => handleLoadItems(poNumber)}
                                disabled={isLoading || !poNumber}
                                className="px-3 py-2 bg-surface-2 text-text-primary border border-border rounded-lg hover:bg-surface-3 text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Fetch...' : 'Link'}
                            </button>
                        </div>
                    )}

                    <div className="h-6 w-px bg-border mx-2" />

                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 text-sm font-medium text-text-secondary bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : (
                            <>
                                <Save className="w-4 h-4" /> Save Challan
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3 text-danger">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">

                {/* Basic Details */}
                <Card title="Transport & Consignee Details" padding="md">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">DC Number <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                value={formData.dc_number}
                                onChange={(e) => setFormData({ ...formData, dc_number: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-text-primary bg-white text-sm font-medium"
                                placeholder="e.g. DC-2024-001"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Date <span className="text-danger">*</span></label>
                            <input
                                type="date"
                                value={formData.dc_date}
                                onChange={(e) => setFormData({ ...formData, dc_date: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-text-primary bg-white text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Linked PO</label>
                            <div className="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-text-secondary font-mono">
                                {poNumber || 'Not Linked'}
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-3 h-px bg-border/50 my-2" />

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Consignee Name</label>
                            <input
                                type="text"
                                value={formData.consignee_name}
                                onChange={(e) => setFormData({ ...formData, consignee_name: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-text-primary bg-white text-sm"
                            />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Destination Address</label>
                            <input
                                type="text"
                                value={formData.consignee_address}
                                onChange={(e) => setFormData({ ...formData, consignee_address: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-text-primary bg-white text-sm"
                            />
                        </div>
                    </div>
                </Card>

                {/* Items */}
                <Card padding="none" className="overflow-visible z-0">
                    <div className="flex items-center justify-between p-4 border-b border-border bg-gray-50/40">
                        <div>
                            <h3 className="text-sm font-semibold text-text-primary">Dispatch Items</h3>
                            <p className="text-xs text-text-muted mt-0.5">Adjust quantities to dispatch</p>
                        </div>
                        <button onClick={handleAddItem} className="bg-surface-1 border border-border hover:bg-surface-2 text-text-primary px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Add Row
                        </button>
                    </div>

                    <div className="overflow-x-auto min-h-[200px]">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-surface-2 text-text-muted border-b border-border">
                                    <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold w-16 text-center">Lot</th>
                                    <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold">Description</th>
                                    <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-right w-24">Ord. Qty</th>
                                    <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-right w-24">Pending</th>
                                    <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-right w-32">Dispatch Qty</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {items.length > 0 ? items.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-blue-50/30 transition-colors">
                                        <td className="px-4 py-2">
                                            <input
                                                value={item.lot_no || ''}
                                                onChange={(e) => handleItemChange(item.id, 'lot_no', e.target.value)}
                                                className="w-full text-center bg-transparent border-none focus:ring-0 text-sm font-mono text-text-secondary"
                                                readOnly
                                                disabled
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                value={item.description || ''}
                                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm text-text-primary placeholder:text-text-muted/40"
                                                placeholder="Item description..."
                                                readOnly={!!item.po_item_id}
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm text-text-muted">{item.ordered_quantity}</td>
                                        <td className="px-4 py-2 text-right text-sm font-medium text-text-primary">{item.remaining_post_dc}</td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={item.dispatch_quantity || ''}
                                                onChange={(e) => handleItemChange(item.id, 'dispatch_quantity', parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="w-full text-right px-2 py-1.5 border border-border rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm font-bold text-primary bg-white"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="text-text-muted hover:text-danger p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-text-muted text-sm border-dashed">
                                            No items. Link a PO to fetch items automatically.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Notes */}
                <Card title="Remarks & Instructions" padding="md">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:ring-1 focus:ring-primary"
                            >
                                <option value="">-- Add Standard Note --</option>
                                {PO_NOTE_TEMPLATES.map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddNote}
                                disabled={!selectedTemplate}
                                className="px-4 py-2 bg-surface-2 border border-border text-text-primary rounded-lg hover:bg-surface-3 text-sm font-medium transition-colors"
                            >
                                Add Note
                            </button>
                        </div>

                        <div className="space-y-3">
                            {notes.map((note, index) => (
                                <div key={index} className="flex gap-3 items-start">
                                    <textarea
                                        value={note}
                                        onChange={(e) => handleNoteChange(index, e.target.value)}
                                        rows={2}
                                        className="flex-1 border border-border rounded-lg text-sm text-text-primary py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                                    />
                                    <button
                                        onClick={() => handleRemoveNote(index)}
                                        className="mt-2 text-text-muted hover:text-danger p-1 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default function CreateDCPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading Editor...</div>}>
            <CreateDCPageContent />
        </Suspense>
    );
}
