"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Edit2, Save, X, ChevronDown, ChevronUp, Plus, FileText, ShoppingCart, Calendar, Info, Loader2, AlertCircle, Sparkles, Building, Landmark, Activity, Layers, Receipt, Trash2, ShieldCheck, Package } from "lucide-react";
import { api, API_BASE_URL } from '@/lib/api';
import { formatDate, formatIndianCurrency } from '@/lib/utils';
import { PODetail, POItem, PODelivery, SRVListItem } from "@/types";
import DownloadButton from "@/components/DownloadButton";
import GlassCard from "@/components/ui/GlassCard";
import Tabs from "@/components/ui/Tabs";

const Field = ({ label, value, icon }: { label: string; value: string | number | null | undefined; icon?: React.ReactNode }) => (
    <div className="space-y-1.5 transition-all hover:translate-x-1">
        <label className="text-label flex items-center gap-2 text-xs opacity-70 font-bold uppercase tracking-widest">
            {icon} {label}
        </label>
        <div className="text-sm font-semibold text-slate-800 tracking-tight truncate" title={value?.toString()}>
            {value || <span className="text-slate-300 font-normal italic uppercase">Unspecified</span>}
        </div>
    </div>
);

function PODetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const poId = searchParams.get('id');
    const [data, setData] = useState<PODetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [hasDC, setHasDC] = useState(false);
    const [dcId, setDCId] = useState<string | null>(null);
    const [srvs, setSrvs] = useState<SRVListItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('supplier');


    useEffect(() => {
        if (!poId) return;
        const loadData = async () => {
            try {
                const poData = await api.getPODetail(parseInt(poId));
                setData(poData);
                if (poData.items) setExpandedItems(new Set(poData.items.map((item: POItem) => item.po_item_no)));

                const [dcCheck, srvData] = await Promise.all([
                    api.checkPOHasDC(parseInt(poId)).catch(() => null),
                    api.listSRVs(parseInt(poId)).catch(() => [])
                ]);

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

    const addItem = () => {
        if (!data || !data.items) return;
        const maxItemNo = Math.max(...data.items.map((i: POItem) => i.po_item_no || 0), 0);
        const newItem = {
            po_item_no: maxItemNo + 1,
            material_code: '',
            material_description: 'NEW PROCUREMENT ITEM',
            drg_no: '',
            unit: 'NOS',
            ordered_quantity: 0,
            po_rate: 0,
            item_value: 0,
            delivered_quantity: 0,
            deliveries: []
        };
        setData({ ...data, items: [...data.items, newItem] });
        setExpandedItems(new Set([...Array.from(expandedItems), maxItemNo + 1]));
    };

    const addLot = (itemIdx: number) => {
        if (!data || !data.items) return;
        const newItems = [...data.items];
        const item = newItems[itemIdx];
        const maxLotNo = Math.max(...(item.deliveries?.map((d: PODelivery) => d.lot_no || 0) || []), 0);
        const newLot = {
            lot_no: maxLotNo + 1,
            delivered_quantity: 0,
            dely_date: new Date().toISOString().split('T')[0],
        };
        newItems[itemIdx].deliveries = [...(item.deliveries || []), newLot];
        setData({ ...data, items: newItems });
    };

    const toggleItem = (itemNo: number) => {
        const s = new Set(expandedItems);
        s.has(itemNo) ? s.delete(itemNo) : s.add(itemNo);
        setExpandedItems(s);
    };

    const handleSave = async () => {
        if (!data || !data.header) return;
        setLoading(true);
        try {
            await api.updatePO(data.header.po_number, data.header, data.items);
            setEditMode(false);
            // Reload data to get updated derived fields
            const poData = await api.getPODetail(parseInt(poId!));
            setData(poData);
        } catch (err: any) {
            setError(err.message || "Failed to sync changes");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-32 text-center animate-pulse text-indigo-500 font-bold uppercase tracking-widest text-xs">Loading...</div>;

    if (!data || !data.header) return (
        <div className="p-32 flex flex-col items-center justify-center gap-6">
            <AlertCircle className="w-16 h-16 text-rose-500 opacity-20" />
            <h2 className="heading-xl text-rose-700 uppercase">Contract Not Found</h2>
            <button onClick={() => router.push('/po')} className="btn-premium btn-ghost">Return to Procurement</button>
        </div>
    );

    const { header, items } = data;

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
                            <h1 className="text-[20px] font-semibold text-slate-800 tracking-tight uppercase">PO #{header.po_number}</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest">
                                {header.po_status || 'ACTIVE'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(header.po_date)}
                            </span>
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5" />
                                Amendment {header.amend_no || 0}
                            </span>
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
                                onClick={() => hasDC && dcId ? router.push(`/dc/view?id=${dcId}`) : router.push(`/dc/create?po=${header.po_number}`)}
                                className={`btn-premium h-11 px-6 border ${hasDC
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100 shadow-emerald-100'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-slate-100'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                {hasDC ? 'View DC' : 'Generate DC'}
                            </button>
                            <DownloadButton
                                url={`${API_BASE_URL}/api/po/${header.po_number}/download`}
                                filename={`PO_${header.po_number}.xlsx`}
                                label="Download"
                                className="btn-premium btn-ghost border-slate-200 h-11 px-6"
                            />
                            <button onClick={() => setEditMode(true)} className="btn-premium btn-primary bg-slate-800 h-11 px-6">
                                <Edit2 className="w-4 h-4" /> Modify PO
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Row 1: Tabs & Header Details */}
            <div className="space-y-4">
                <Tabs
                    tabs={[
                        { id: 'supplier', label: 'Supplier Details', icon: Building },
                        { id: 'order', label: 'Order & Reference', icon: FileText },
                        { id: 'financials', label: 'Financials', icon: Landmark },
                        { id: 'inspection', label: 'Inspection', icon: ShieldCheck },
                        { id: 'srvs', label: 'Vouchers (SRVs)', icon: Receipt },
                    ]}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    className="mb-0"
                />

                <GlassCard className="p-0 overflow-hidden border-slate-200/60 transition-all">
                    <div className="p-10">
                        {activeTab === 'supplier' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                                <div className="col-span-1 md:col-span-2 space-y-4">
                                    <label className="text-label">Supplier Name & Address</label>
                                    <div className="text-sm font-black text-slate-800 leading-relaxed uppercase tracking-tight">
                                        {header.supplier_name || 'N/A'}
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium leading-relaxed tracking-wide">
                                        {header.supplier_email || 'No email provided'}
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <Field label="Supplier Code" value={header.supplier_code} icon={<Package className="w-3 h-3" />} />
                                    <Field label="GSTIN" value={header.supplier_gstin} icon={<Activity className="w-3 h-3" />} />
                                </div>
                                <div className="space-y-8">
                                    <Field label="Phone" value={header.supplier_phone} />
                                    <Field label="Fax" value={header.supplier_fax} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'order' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                    <div className="space-y-4">
                                        <Field label="Enquiry No" value={header.enquiry_no} />
                                        <Field label="Enquiry Date" value={formatDate(header.enquiry_date)} />
                                        <Field label="RC No" value={header.rc_no} />
                                    </div>
                                    <div className="space-y-4 border-l border-slate-100 pl-12">
                                        <Field label="Quotation Ref" value={header.quotation_ref} />
                                        <Field label="Quotation Date" value={formatDate(header.quotation_date)} />
                                        <Field label="Order Type" value={header.order_type} />
                                    </div>
                                    <div className="space-y-4 border-l border-slate-100 pl-12">
                                        <Field label="Department / DVN" value={header.department_no} />
                                        <Field label="Amendment No" value={header.amend_no} />
                                        <Field label="PO Status" value={header.po_status} />
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-12">
                                    <Field label="Issuer Name" value={header.issuer_name} />
                                    <Field label="Designation" value={header.issuer_designation} />
                                    <Field label="Issuer Phone" value={header.issuer_phone} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'financials' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total PO Value</label>
                                        <div className="text-2xl font-bold text-slate-800 tracking-tight">{formatIndianCurrency(header.po_value)}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Net PO Value</label>
                                        <div className="text-xl font-bold text-blue-600 tracking-tight">{formatIndianCurrency(header.net_po_value)}</div>
                                    </div>
                                </div>
                                <div className="space-y-6 border-l border-slate-100 pl-12">
                                    <Field label="TIN No" value={header.tin_no} />
                                    <Field label="ECC No" value={header.ecc_no} />
                                    <Field label="MPCT No" value={header.mpct_no} />
                                </div>
                                <div className="space-y-6 border-l border-slate-100 pl-12">
                                    <Field label="Currency" value={header.currency || 'INR'} />
                                    <Field label="Exchange Rate" value={header.ex_rate?.toString() || '1.00'} />
                                    <Field label="FOB Value" value={formatIndianCurrency(header.fob_value)} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'inspection' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inspection Details</label>
                                        <div className="text-sm font-semibold text-slate-700 leading-relaxed uppercase">{header.inspection_by || 'NOT SPECIFIED'}</div>
                                        <div className="text-xs text-slate-400 italic">{header.inspection_at || 'BHEL Works, Bhopal'}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consignee Address</label>
                                        <div className="text-sm font-semibold text-slate-800 leading-relaxed uppercase">{header.consignee_name}</div>
                                        <div className="text-xs text-slate-500 leading-relaxed max-w-sm">{header.consignee_address}</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PO Remarks</label>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed min-h-[100px] whitespace-pre-wrap">
                                        {header.remarks || 'No additional remarks provided.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'srvs' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Linked Receipt Vouchers</label>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{srvs.length} Documents</span>
                                </div>
                                {srvs.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {srvs.map(srv => (
                                            <div key={srv.srv_number} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer" onClick={() => router.push(`/srv/view?id=${srv.srv_number}`)}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 truncate">{srv.srv_number}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{formatDate(srv.srv_date)}</span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                                                    <div className="space-y-0.5">
                                                        <span className="text-[9px] font-bold text-emerald-500 uppercase">Received</span>
                                                        <div className="text-xs font-bold text-slate-700">{srv.total_received_qty}</div>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <span className="text-[9px] font-bold text-red-500 uppercase">Rejected</span>
                                                        <div className="text-xs font-bold text-slate-700">{srv.total_rejected_qty}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                        <Receipt className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                        <div className="text-xs text-slate-300 font-medium">No SRVs found for this PO</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Row 2: Purchase Items */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                        <ShoppingCart className="w-3.5 h-3.5 text-blue-500" /> Ordered Material Line Items
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest text-[9px]">
                            {items.length} LINES
                        </span>
                    </h3>
                    {editMode && (
                        <button onClick={addItem} className="h-8 px-4 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> Add Procurement Line
                        </button>
                    )}
                </div>
                <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200/60 bg-slate-50/50">
                                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-12 text-center">#</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Description of Goods</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right w-32">Order Qty</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right w-32">Dispatched</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right w-32">Accepted</th>
                                <th className="py-3.5 px-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {items.map((item, idx) => (
                                <React.Fragment key={idx}>
                                    <tr className={`group transition-all hover:bg-slate-50/80 ${expandedItems.has(item.po_item_no) ? 'bg-blue-50/20' : ''}`}>
                                        <td className="py-4 px-4 text-center text-xs font-bold text-slate-400">{item.po_item_no}</td>
                                        <td className="py-4 px-4">
                                            {editMode ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                                                    <div className="col-span-full space-y-1.5">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Description of Goods</label>
                                                        <input
                                                            value={item.material_description}
                                                            onChange={e => {
                                                                const n = [...items];
                                                                n[idx].material_description = e.target.value;
                                                                setData({ ...data, items: n });
                                                            }}
                                                            className="input-premium font-bold text-slate-800 text-xs"
                                                            placeholder="Material Description"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Code / Drg</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                value={item.material_code}
                                                                onChange={e => {
                                                                    const n = [...items];
                                                                    n[idx].material_code = e.target.value;
                                                                    setData({ ...data, items: n });
                                                                }}
                                                                className="w-1/2 input-premium text-xs"
                                                                placeholder="CODE"
                                                            />
                                                            <input
                                                                value={item.drg_no}
                                                                onChange={e => {
                                                                    const n = [...items];
                                                                    n[idx].drg_no = e.target.value;
                                                                    setData({ ...data, items: n });
                                                                }}
                                                                className="w-1/2 input-premium text-xs"
                                                                placeholder="DRG"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Financials</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                value={item.po_rate}
                                                                onChange={e => {
                                                                    const n = [...items];
                                                                    n[idx].po_rate = parseFloat(e.target.value) || 0;
                                                                    setData({ ...data, items: n });
                                                                }}
                                                                className="w-2/3 input-premium font-bold text-blue-600 text-xs"
                                                                placeholder="RATE"
                                                            />
                                                            <input
                                                                value={item.unit}
                                                                onChange={e => {
                                                                    const n = [...items];
                                                                    n[idx].unit = e.target.value;
                                                                    setData({ ...data, items: n });
                                                                }}
                                                                className="w-1/3 input-premium font-bold text-slate-500 text-xs uppercase"
                                                                placeholder="UNIT"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div className="text-sm font-semibold text-slate-800 uppercase leading-tight group-hover:text-blue-600 transition-colors">
                                                        {item.material_description}
                                                    </div>
                                                    <div className="flex items-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                        <span>Code: <span className="text-slate-600">{item.material_code || 'N/A'}</span></span>
                                                        <span>Drg: <span className="text-blue-500 font-bold">{item.drg_no || 'N/A'}</span></span>
                                                        <span>Rate: <span className="text-emerald-600 tracking-tighter">{formatIndianCurrency(item.po_rate)} / {item.unit}</span></span>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            {editMode ? (
                                                <input
                                                    type="number"
                                                    value={item.ordered_quantity}
                                                    onChange={e => {
                                                        const n = [...items];
                                                        n[idx].ordered_quantity = parseFloat(e.target.value) || 0;
                                                        setData({ ...data, items: n });
                                                    }}
                                                    className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-right text-sm font-bold text-slate-800 outline-none focus:border-blue-500 shadow-sm"
                                                />
                                            ) : (
                                                <span className="text-sm font-bold text-slate-700">{item.ordered_quantity?.toLocaleString()}</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            {editMode ? (
                                                <input
                                                    type="number"
                                                    value={item.delivered_quantity}
                                                    onChange={e => {
                                                        const n = [...items];
                                                        n[idx].delivered_quantity = parseFloat(e.target.value) || 0;
                                                        setData({ ...data, items: n });
                                                    }}
                                                    className="w-24 bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-right text-sm font-bold text-blue-600 outline-none focus:border-blue-500 shadow-sm"
                                                />
                                            ) : (
                                                <span className="text-sm font-bold text-blue-600">{item.delivered_quantity?.toLocaleString()}</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className={`text-sm font-bold transition-all ${((item.ordered_quantity || 0) - (item.delivered_quantity || 0)) > 0 ? 'text-amber-500' : 'text-slate-200'}`}>
                                                {((item.ordered_quantity || 0) - (item.delivered_quantity || 0)).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            {editMode ? (
                                                <input
                                                    type="number"
                                                    value={item.received_quantity}
                                                    onChange={e => {
                                                        const n = [...items];
                                                        n[idx].received_quantity = parseFloat(e.target.value) || 0;
                                                        setData({ ...data, items: n });
                                                    }}
                                                    className="w-24 bg-white border border-emerald-200 rounded-lg px-2 py-1.5 text-right text-sm font-bold text-emerald-600 outline-none focus:border-emerald-500 shadow-sm"
                                                />
                                            ) : (
                                                <span className="text-sm font-bold text-emerald-600">{(item.received_quantity || 0).toLocaleString()}</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => toggleItem(item.po_item_no)} className={`p-1.5 rounded-lg transition-all ${expandedItems.has(item.po_item_no) ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}>
                                                    {expandedItems.has(item.po_item_no) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                {editMode && (
                                                    <button onClick={() => setData({ ...data, items: items.filter((_, i) => i !== idx) })} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedItems.has(item.po_item_no) && (
                                        <tr className="bg-slate-50/10">
                                            <td colSpan={7} className="p-6">
                                                <div className="bg-white/50 border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-slate-100/50">
                                                            <tr>
                                                                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivery Lot</th>
                                                                <th className="py-3 px-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lot Quantity</th>
                                                                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schedule Date</th>
                                                                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {item.deliveries && item.deliveries.length > 0 ? item.deliveries.map((d, dIdx) => (
                                                                <tr key={dIdx} className="hover:bg-white transition-colors group">
                                                                    <td className="py-3 px-6">
                                                                        {editMode ? (
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Lot</span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={d.lot_no}
                                                                                    onChange={e => {
                                                                                        const n = [...items];
                                                                                        const l = [...(n[idx].deliveries || [])];
                                                                                        l[dIdx] = { ...l[dIdx], lot_no: parseInt(e.target.value) || 0 };
                                                                                        n[idx].deliveries = l;
                                                                                        setData({ ...data, items: n });
                                                                                    }}
                                                                                    className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                                                                                <span className="text-xs font-semibold text-slate-600">LOT {d.lot_no}</span>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-6 text-right">
                                                                        {editMode ? (
                                                                            <input
                                                                                type="number"
                                                                                value={d.delivered_quantity}
                                                                                onChange={e => {
                                                                                    const n = [...items];
                                                                                    const l = [...(n[idx].deliveries || [])];
                                                                                    l[dIdx] = { ...l[dIdx], delivered_quantity: parseFloat(e.target.value) || 0 };
                                                                                    n[idx].deliveries = l;
                                                                                    setData({ ...data, items: n });
                                                                                }}
                                                                                className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-xs font-bold text-blue-600 outline-none focus:border-blue-500 shadow-sm"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-xs font-bold text-blue-600">{d.delivered_quantity?.toLocaleString()}</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-6">
                                                                        {editMode ? (
                                                                            <input
                                                                                type="date"
                                                                                value={d.dely_date}
                                                                                onChange={e => {
                                                                                    const n = [...items];
                                                                                    const l = [...(n[idx].deliveries || [])];
                                                                                    l[dIdx] = { ...l[dIdx], dely_date: e.target.value };
                                                                                    n[idx].deliveries = l;
                                                                                    setData({ ...data, items: n });
                                                                                }}
                                                                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 outline-none focus:border-blue-500"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-xs font-medium text-slate-400">{formatDate(d.dely_date)}</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-6 text-right">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${d.entry_allow_date ? 'text-emerald-500' : 'text-amber-400'}`}>
                                                                                {d.entry_allow_date ? 'Allowed' : 'Pending'}
                                                                            </span>
                                                                            {editMode && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const n = [...items];
                                                                                        n[idx].deliveries = n[idx].deliveries.filter((_, i) => i !== dIdx);
                                                                                        setData({ ...data, items: n });
                                                                                    }}
                                                                                    className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )) : (
                                                                <tr>
                                                                    <td colSpan={4} className="py-8 text-center">
                                                                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No delivery lots scheduled</div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            {editMode && (
                                                                <tr>
                                                                    <td colSpan={4} className="p-4 bg-slate-50/30">
                                                                        <button onClick={() => addLot(idx)} className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-blue-500 hover:border-blue-300 transition-all text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                                                                            <Plus className="w-4 h-4" /> Add Delivery Lot Schedule
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
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
    );
}

function KpiSmall({ label, value, color }: any) {
    const colors: any = {
        slate: 'text-slate-500 bg-slate-50',
        blue: 'text-indigo-600 bg-indigo-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        amber: 'text-amber-600 bg-amber-50'
    };
    return (
        <div className={`p-4 rounded-2xl ${colors[color]} border border-white/40 shadow-sm`}>
            <span className="text-xs font-black uppercase tracking-widest opacity-60 block mb-1.5">{label}</span>
            <span className="text-base font-black tracking-tight">{(value || 0).toLocaleString()}</span>
        </div>
    );
}

export default function PODetailPage() {
    return (
        <Suspense fallback={<div className="p-32 text-center animate-pulse text-indigo-600 font-bold uppercase tracking-widest text-xs">Loading PO Details...</div>}>
            <PODetailContent />
        </Suspense>
    );
}
