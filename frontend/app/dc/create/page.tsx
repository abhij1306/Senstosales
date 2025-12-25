"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Search, AlertCircle, Truck, Package, FileText, Loader2, Plus, Trash2, Activity, ShieldCheck, Layers, Landmark } from 'lucide-react';
import { api } from "@/lib/api";
import { DCItemRow, POHeader } from "@/types";
import { formatDate } from "@/lib/utils";
import GlassCard from "@/components/ui/GlassCard";

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
            fetchDCNumber(initialPoNumber);
        }
    }, [initialPoNumber]);

    const fetchDCNumber = async (po: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/dc/preview-number/${po}`);
            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, dc_number: data.dc_number }));
            }
        } catch (err) { console.error(err); }
    };

    const fetchPOData = async (po: string) => {
        try {
            const data = await api.getPODetail(parseInt(po));
            if (data?.header) {
                setPOData(data.header);
                setFormData(prev => ({
                    ...prev,
                    consignee_name: (data.header as any)?.consignee_name || '',
                    consignee_address: (data.header as any)?.consignee_address || '',
                    supplier_phone: data.header?.supplier_phone || '0755 – 4247748',
                    supplier_gstin: data.header?.supplier_gstin || '23AACFS6810L1Z7'
                }));
            }
        } catch (err) { console.error(err); }
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
                ordered_quantity: lot.ordered_qty || 0,
                remaining_post_dc: lot.remaining_qty || 0,
                dispatch_quantity: 0,
                po_item_id: lot.po_item_id
            }));
            setItems(mappedItems);
            if (mappedItems.length === 0) setError("No items available for dispatch matching this contract.");
        } catch (err: any) {
            setError(err.message || "Traceback failure in lot retrieval");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        setError(null);
        setIsSubmitting(true);
        const itemsToDispatch = items.filter(item => item.dispatch_quantity && item.dispatch_quantity > 0);
        if (itemsToDispatch.length === 0) {
            setError("At least one item must have an active dispatch volume.");
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
            const response = await api.createDC(dcPayload, itemsPayload) as any;
            router.push(`/dc/view?id=${response.dc_number || formData.dc_number}`);
        } catch (err: any) {
            setError(err.message || "Sychronization failure");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6 space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/80 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white shadow-sm transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-[20px] font-semibold text-slate-800 tracking-tight uppercase">Generate Challan</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest">
                                LOGISTICS
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5" />
                                {formData.dc_number || 'ST/DC/24-25/---'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!initialPoNumber && (
                        <div className="flex items-center gap-2 p-1.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="text"
                                    value={poNumber}
                                    onChange={(e) => setPONumber(e.target.value)}
                                    className="w-48 pl-9 pr-3 py-2 text-xs font-black uppercase tracking-widest bg-transparent border-none focus:ring-0 outline-none"
                                    placeholder="PO NUMBER"
                                />
                            </div>
                            <button
                                onClick={() => handleLoadItems(poNumber)}
                                disabled={isLoading || !poNumber}
                                className="btn-premium btn-primary h-8 px-4 py-0 text-[10px] bg-slate-800"
                            >
                                {isLoading ? '...' : 'Find'}
                            </button>
                        </div>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || items.length === 0}
                        className="btn-premium btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 shadow-indigo-200 h-11 px-8"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSubmitting ? "Generating..." : "Generate DC"}
                    </button>
                </div>
            </div>

            {error && (
                <GlassCard className="p-4 border-rose-200 bg-rose-50/30 flex items-center gap-4 text-rose-700 font-bold uppercase text-[10px] tracking-widest">
                    <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                </GlassCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left Column: Main Info & Items */}
                <div className="lg:col-span-8 space-y-10">
                    <GlassCard className="p-0 overflow-hidden border-slate-200/60 shadow-sm">
                        <div className="flex p-1 bg-slate-50/50 border-b border-slate-100">
                            <div className="flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white text-blue-600 shadow-sm border border-slate-100">
                                <FileText className="w-3.5 h-3.5 text-blue-500" /> Header Information
                            </div>
                        </div>
                        <div className="p-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <label className="text-label">DC Number</label>
                                    <input
                                        value={formData.dc_number}
                                        onChange={e => setFormData({ ...formData, dc_number: e.target.value.toUpperCase() })}
                                        className="input-premium font-black uppercase"
                                        placeholder="Enter DC Number or leave blank for auto"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-label">Dispatch Date</label>
                                    <input
                                        type="date"
                                        value={formData.dc_date}
                                        onChange={e => setFormData({ ...formData, dc_date: e.target.value })}
                                        className="input-premium font-bold"
                                    />
                                </div>
                                <div className="col-span-full h-px bg-slate-50 my-2" />
                                <div className="col-span-full space-y-2">
                                    <label className="text-label">Consignee name</label>
                                    <input
                                        value={formData.consignee_name}
                                        onChange={e => setFormData({ ...formData, consignee_name: e.target.value })}
                                        className="input-premium font-bold"
                                        placeholder="e.g. SR. MANAGER (CRX)"
                                    />
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-label">Delivery Address</label>
                                    <textarea
                                        value={formData.consignee_address}
                                        onChange={e => setFormData({ ...formData, consignee_address: e.target.value })}
                                        rows={3}
                                        className="input-premium font-medium resize-none"
                                        placeholder="Full delivery destination details..."
                                    />
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Package className="w-3.5 h-3.5" /> Dispatch Items
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest">
                                    {items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'}
                                </span>
                                <button
                                    onClick={() => setItems([...items, { id: `new-${Date.now()}`, lot_no: "", description: "", ordered_quantity: 0, remaining_post_dc: 0, dispatch_quantity: 0, po_item_id: "" }])}
                                    className="h-8 px-4 rounded-xl bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" /> <span>Add Custom</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                            {items.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="table-th w-24 text-center">Lot #</th>
                                            <th className="table-th text-left">Description of Goods</th>
                                            <th className="table-th w-32 text-right">Balance</th>
                                            <th className="table-th w-40 text-right">Dispatch Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/50">
                                        {items.map((item) => (
                                            <tr key={item.id} className="table-row group">
                                                <td className="table-td text-center">
                                                    <input
                                                        value={item.lot_no}
                                                        onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, lot_no: e.target.value } : i))}
                                                        className="w-16 bg-slate-50/50 border border-slate-100 rounded-lg px-2 py-1.5 text-center text-xs font-black text-slate-500 outline-none focus:border-blue-500 shadow-sm"
                                                        placeholder="SL"
                                                    />
                                                </td>
                                                <td className="table-td">
                                                    <input
                                                        value={item.description}
                                                        onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, description: e.target.value } : i))}
                                                        readOnly={!!item.po_item_id}
                                                        className={`w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold uppercase ${item.po_item_id ? 'text-slate-800' : 'text-blue-600'}`}
                                                        placeholder="Enter description..."
                                                    />
                                                    {item.po_item_id && <div className="text-[9px] text-slate-300 font-black uppercase tracking-widest mt-0.5">CONTRACTED ITEM</div>}
                                                </td>
                                                <td className="table-td text-right">
                                                    <div className="text-sm font-black text-amber-500 tabular-nums">{(item.remaining_post_dc || 0).toLocaleString()}</div>
                                                    <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Remaining</div>
                                                </td>
                                                <td className="table-td text-right group-hover:bg-slate-50/80 transition-all">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <input
                                                            type="number"
                                                            value={item.dispatch_quantity || ""}
                                                            onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, dispatch_quantity: parseFloat(e.target.value) || 0 } : i))}
                                                            className="w-24 bg-white border border-blue-200 rounded-xl px-3 py-2 text-right text-sm font-black text-blue-600 outline-none focus:border-blue-500 focus:shadow-indigo-100 transition-all"
                                                            placeholder="0"
                                                        />
                                                        <button
                                                            onClick={() => setItems(items.filter(i => i.id !== item.id))}
                                                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                            title="Remove Item"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-4">
                                    <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                                        <Search className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">No dispatch items loaded</p>
                                        <p className="text-[9px] font-medium text-slate-300 uppercase tracking-widest">Search a PO or add a custom line to begin</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Summaries & Remarks */}
                <div className="lg:col-span-4 space-y-8 h-fit lg:sticky lg:top-8">
                    <GlassCard className="p-8 border-blue-100/50 shadow-lg shadow-blue-500/5 overflow-hidden relative group">
                        <div className="absolute -right-8 -top-8 h-32 w-32 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
                        <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2 relative">
                            <Activity className="w-3.5 h-3.5" /> Dispatch Volume
                        </h4>
                        <div className="flex items-end justify-between relative">
                            <div>
                                <div className="text-6xl font-black text-slate-900 tracking-tighter tabular-nums drop-shadow-sm">
                                    {items.reduce((acc, i) => acc + (i.dispatch_quantity || 0), 0).toLocaleString()}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Total Units Dispatching</div>
                            </div>
                            <div className="h-16 w-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 mb-2">
                                <Layers className="w-8 h-8" />
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8 border-indigo-100/50 shadow-lg shadow-indigo-500/5">
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5" /> Order Source
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active PO</span>
                                <span className="text-xs font-black text-slate-800 tracking-tight">
                                    {poData ? `#${poData.po_number}` : 'MANUAL ENTRY'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Date</span>
                                <span className="text-xs font-bold text-slate-600">
                                    {poData ? formatDate(poData.po_date) : 'N/A'}
                                </span>
                            </div>
                            <div className="pt-4 border-t border-slate-50">
                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex items-center gap-3">
                                    <Landmark className="w-5 h-5 text-indigo-400" />
                                    <div className="text-[9px] font-bold text-indigo-600 leading-relaxed uppercase tracking-widest">
                                        PO linked dispatch ensures accurate reconciliation.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dispatch Remarks</h4>
                            <button
                                onClick={() => setNotes([...notes, ""])}
                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                            >
                                + Add Row
                            </button>
                        </div>
                        <div className="space-y-3">
                            {notes.map((note, i) => (
                                <div key={i} className="flex gap-2 animate-in slide-in-from-right-2 duration-300">
                                    <div className="flex-1 bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl p-3 shadow-sm relative group">
                                        <div className="absolute top-[-8px] left-3 px-1 bg-white text-[8px] font-black text-slate-400 uppercase border border-slate-100 rounded">Remark #{i + 1}</div>
                                        <textarea
                                            value={note}
                                            onChange={e => {
                                                const n = [...notes];
                                                n[i] = e.target.value;
                                                setNotes(n);
                                            }}
                                            rows={2}
                                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-[11px] font-medium text-slate-600 resize-none leading-relaxed outline-none"
                                            placeholder="Special instruction..."
                                        />
                                    </div>
                                    <button
                                        onClick={() => setNotes(notes.filter((_, idx) => idx !== i))}
                                        className="h-8 w-8 rounded-lg bg-rose-50 text-rose-400 border border-rose-100 hover:bg-rose-100 hover:text-rose-600 transition-all flex items-center justify-center"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {notes.length === 0 && (
                                <div className="p-8 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 opacity-40">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic text-center leading-relaxed"> No additional remarks for this dispatch</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div >
    );
}

export default function CreateDCPage() {
    return (
        <Suspense fallback={<div className="p-32 text-center animate-pulse text-rose-600 font-bold uppercase tracking-widest text-xs">Loading...</div>}>
            <CreateDCPageContent />
        </Suspense>
    );
}
