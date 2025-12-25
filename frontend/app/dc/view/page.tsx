"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Edit2, Save, X, FileText, Plus, Trash2, Truck, AlertCircle, ShoppingCart, Activity, ShieldCheck, Layers } from "lucide-react";
import { api, API_BASE_URL } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { DCItemRow as DCItemRowType } from "@/types";
import DownloadButton from "@/components/DownloadButton";
import GlassCard from "@/components/ui/GlassCard";
import Tabs from "@/components/ui/Tabs";


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
    const [activeTab, setActiveTab] = useState('overview');
    const [srvs, setSrvs] = useState<any[]>([]);
    const [poNotes, setPoNotes] = useState<string | null>(null);


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
                const srvData = await api.listSRVs().catch(() => []);
                // Filter SRVs that mention this DC number in their remarks or data if possible, 
                // but usually SRVs are linked to PO. For now, we list all SRVs for the PO this DC belongs to.
                if (data.header.po_number) {
                    const [poDetail, poSrvs] = await Promise.all([
                        api.getPODetail(data.header.po_number).catch(() => null),
                        api.listSRVs(data.header.po_number).catch(() => [])
                    ]);
                    setSrvs(poSrvs);
                    if (poDetail?.header?.remarks) {
                        setPoNotes(poDetail.header.remarks);
                    }
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
        try {
            setLoading(true);
            const dcPayload = {
                dc_number: formData.dc_number,
                dc_date: formData.dc_date,
                po_number: parseInt(formData.po_number),
                consignee_name: formData.consignee_name,
                consignee_address: formData.consignee_address,
                eway_bill_number: formData.eway_bill_number,
                remarks: notes.join("\n\n")
            };
            const itemsPayload = items.map(item => ({
                po_item_id: item.po_item_id || 0,
                lot_no: item.lot_no ? parseInt(item.lot_no.toString()) : 0,
                dispatch_qty: item.dispatch_quantity
            }));
            if (dcId) {
                await api.updateDC(dcId, dcPayload, itemsPayload);
                setEditMode(false);
                window.location.reload();
            }
        } catch (err: any) {
            setError(err.message || "Execution Failed");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-32 text-center animate-pulse text-blue-600 font-bold uppercase tracking-widest text-xs">Loading DC Details...</div>;

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6 space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/80 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white shadow-sm transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-[20px] font-semibold text-slate-800 tracking-tight uppercase">DC #{formData.dc_number}</h1>
                            {hasInvoice ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest">
                                    INVOICED
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-widest">
                                    DISPATCHED
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5" />
                                DATE {formatDate(formData.dc_date)}
                            </span>
                            {formData.po_number && (
                                <button
                                    onClick={() => router.push(`/po/view?id=${formData.po_number}`)}
                                    className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1.5"
                                >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    PO #{formData.po_number}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {editMode ? (
                        <>
                            <button onClick={() => setEditMode(false)} className="btn-premium btn-ghost h-11 px-6 text-slate-500">
                                <X className="w-4 h-4" /> Discard
                            </button>
                            <button onClick={handleSave} className="btn-premium btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 shadow-indigo-200 h-11 px-8">
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => hasInvoice ? router.push(`/invoice/view?id=${encodeURIComponent(invoiceNumber!)}`) : router.push(`/invoice/create?dc=${dcId}`)}
                                className={`btn-premium h-11 px-6 border ${hasInvoice
                                    ? 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100 shadow-blue-100'
                                    : 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700 shadow-emerald-200'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                {hasInvoice ? 'View Invoice' : 'Generate Invoice'}
                            </button>
                            <DownloadButton
                                url={`${API_BASE_URL}/api/dc/${formData.dc_number}/download`}
                                filename={`DC_${formData.dc_number}.xlsx`}
                                label="Download"
                                className="btn-premium btn-ghost border-slate-200 h-11 px-6"
                            />
                            <button onClick={() => setEditMode(true)} disabled={hasInvoice} className="btn-premium btn-primary bg-slate-800 h-11 px-6 disabled:opacity-50">
                                <Edit2 className="w-4 h-4" /> Modify DC
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold uppercase tracking-wider">{error}</p>
                </div>
            )}

            {/* Persistent DC Information Strip */}
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <GlassCard className="p-0 overflow-hidden border-slate-200/60 transition-all">
                    <div className="p-6 flex flex-wrap gap-12 items-start">
                        <div className="flex items-start gap-5 border-r border-slate-100 pr-12 min-w-[300px]">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-1">DEST</div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consignee & Destination</label>
                                <div className="space-y-1.5">
                                    <input
                                        value={formData.consignee_name}
                                        onChange={e => setFormData({ ...formData, consignee_name: e.target.value })}
                                        disabled={!editMode}
                                        className="bg-transparent border-none p-0 focus:ring-0 font-bold text-sm text-slate-800 w-full block outline-none disabled:cursor-default"
                                        placeholder="Consignee Name"
                                    />
                                    <textarea
                                        value={formData.consignee_address}
                                        onChange={e => setFormData({ ...formData, consignee_address: e.target.value })}
                                        disabled={!editMode}
                                        rows={2}
                                        className="bg-transparent border-none p-0 focus:ring-0 font-medium text-xs text-slate-500 w-full block outline-none resize-none disabled:cursor-default"
                                        placeholder="Consignee Address"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-12 flex-1">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-way Bill</label>
                                <input
                                    value={formData.eway_bill_number}
                                    onChange={e => setFormData({ ...formData, eway_bill_number: e.target.value })}
                                    disabled={!editMode}
                                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-all shadow-sm disabled:border-transparent disabled:bg-transparent disabled:shadow-none disabled:px-0 placeholder:font-normal placeholder:text-slate-300"
                                    placeholder="Enter E-way Bill"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dept Ref</label>
                                <div className="text-sm font-bold text-slate-800 mt-1">{formData.department_no || 'GENERAL-01'}</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GSTIN</label>
                                <div className="text-sm font-bold text-slate-800 mt-1">{formData.supplier_gstin}</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</label>
                                <div className="text-sm font-bold text-slate-800 mt-1">{formData.supplier_phone}</div>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5" /> Dispatch Items
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest">
                        {items.length} ITEMS
                    </span>
                </div>

                <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200/60 bg-slate-50/50">
                                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-20 text-center">Lot #</th>
                                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Material Description</th>
                                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Ordered</th>
                                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Balance</th>
                                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Dispatch Qty</th>
                                <th className="py-3.5 px-6 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/80 transition-all">
                                    <td className="py-4 px-6 text-center text-xs font-bold text-slate-400">{item.lot_no}</td>
                                    <td className="py-4 px-6">
                                        <div className="text-sm font-semibold text-slate-800 uppercase group-hover:text-blue-600 transition-colors">{item.description}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">PO Item ID: {item.po_item_id}</div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <span className="text-sm font-bold text-slate-500">{(item.ordered_quantity || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <span className={`text-sm font-bold ${(item.remaining_post_dc ?? 0) > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                                            {(item.remaining_post_dc ?? 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        {editMode ? (
                                            <input
                                                type="number"
                                                value={item.dispatch_quantity}
                                                onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, dispatch_quantity: parseFloat(e.target.value) || 0 } : i))}
                                                className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-right text-sm font-bold text-blue-600 outline-none focus:border-blue-500 shadow-sm"
                                            />
                                        ) : (
                                            <span className="text-sm font-bold text-blue-600">{(item.dispatch_quantity || 0).toLocaleString()}</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        {editMode && (
                                            <button
                                                onClick={() => setItems(items.filter((_, i) => i !== idx))}
                                                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    <div className="md:col-span-7 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dispatch Remarks</h4>
                            {editMode && (
                                <select
                                    value={selectedTemplate}
                                    onChange={e => {
                                        const t = PO_NOTE_TEMPLATES.find(x => x.id === e.target.value);
                                        if (t) setNotes([...notes, t.content]);
                                        setSelectedTemplate("");
                                    }}
                                    className="bg-white border border-slate-200 rounded-lg text-[9px] font-bold px-2 py-1 text-blue-600 outline-none hover:border-blue-300 transition-colors cursor-pointer"
                                >
                                    <option value="">+ Add Standard Note</option>
                                    {PO_NOTE_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.title.toUpperCase()}</option>)}
                                </select>
                            )}
                        </div>
                        <div className="flex flex-col gap-3">
                            {notes.map((note, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="flex-1 bg-white border border-slate-100 rounded-xl p-4 shadow-sm transition-all hover:border-blue-100 relative group">
                                        <div className="absolute top-4 left-[-10px] h-5 w-5 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center font-bold text-[9px] border border-blue-100">#{i + 1}</div>
                                        <textarea
                                            value={note}
                                            onChange={e => {
                                                const n = [...notes];
                                                n[i] = e.target.value;
                                                setNotes(n);
                                            }}
                                            disabled={!editMode}
                                            rows={2}
                                            className="bg-transparent border-none p-0 focus:ring-0 font-medium text-xs text-slate-600 w-full resize-none leading-relaxed outline-none disabled:cursor-default"
                                            placeholder="Enter remark here..."
                                        />
                                    </div>
                                    {editMode && (
                                        <button
                                            onClick={() => setNotes(notes.filter((_, idx) => idx !== i))}
                                            className="h-10 w-10 mt-2 flex items-center justify-center rounded-xl bg-red-50 text-red-400 border border-red-100 hover:bg-red-100 hover:text-red-600 transition-all shadow-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {!editMode && notes.length === 0 && (
                                <div className="p-10 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-3">
                                    <AlertCircle className="w-6 h-6 text-slate-200" />
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No dispatch remarks available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {srvs.length > 0 && (
                        <div className="md:col-span-5 space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Inbound Deliveries (SRV)</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {srvs.map(srv => (
                                    <div
                                        key={srv.srv_number}
                                        onClick={() => router.push(`/srv/view?id=${srv.srv_number}`)}
                                        className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">SRV</div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-800">{srv.srv_number}</div>
                                                <div className="text-[10px] font-medium text-slate-400 mt-0.5">{formatDate(srv.srv_date)}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 pr-2">
                                            <div className="text-right">
                                                <div className="text-[11px] font-bold text-emerald-600 tabular-nums">{srv.total_received_qty}</div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Accepted</div>
                                            </div>
                                            <div className="text-right border-l border-slate-100 pl-4">
                                                <div className="text-[11px] font-bold text-red-500 tabular-nums">{srv.total_rejected_qty}</div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Rejected</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {poNotes && (
                    <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <ShoppingCart className="w-3 h-3" /> Linked PO Remarks
                        </h3>
                        <div className="bg-indigo-50/30 rounded-2xl p-6 border border-indigo-100/50">
                            <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{poNotes}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DCDetailPage() {
    return (
        <Suspense fallback={<div className="p-32 text-center animate-pulse text-rose-600 font-bold uppercase tracking-widest text-xs">Loading...</div>}>
            <DCDetailContent />
        </Suspense>
    );
}
