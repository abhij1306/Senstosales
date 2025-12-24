"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Edit2, Save, X, ChevronDown, ChevronUp, Plus, FileText, ShoppingCart, Calendar, Info, Loader2, AlertCircle, Phone, Mail, FileCheck, Landmark } from "lucide-react";

import { api, API_BASE_URL } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { PODetail, POItem, PODelivery, SRVListItem } from "@/types";
import DownloadButton from "@/components/DownloadButton";
import { Card } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";


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

    useEffect(() => {
        if (!poId) return;

        const loadData = async () => {
            try {
                // Load PO data
                const poData = await api.getPODetail(parseInt(poId));
                setData(poData);

                // Expand all items by default
                if (poData.items && poData.items.length > 0) {
                    const allItemNos = new Set<number>(poData.items.map((item: POItem) => item.po_item_no));
                    setExpandedItems(allItemNos);
                }

                // Check if PO has DC
                try {
                    const dcCheck = await api.checkPOHasDC(parseInt(poId));
                    if (dcCheck && dcCheck.has_dc) {
                        setHasDC(true);
                        setDCId(dcCheck.dc_id || null);
                    }
                } catch {
                    // Ignore error if check fails (e.g. 404)
                }

                // Load SRVs
                try {
                    const srvData = await api.listSRVs(parseInt(poId));
                    setSrvs(srvData);
                } catch (err) {
                    console.error("Failed to load SRVs:", err);
                }
            } catch (err) {
                console.error("Failed to load PO:", err);
                setError(err instanceof Error ? err.message : "Failed to load PO information");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [poId]);

    const toggleItem = (itemNo: number) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(itemNo)) {
            newExpanded.delete(itemNo);
        } else {
            newExpanded.add(itemNo);
        }
        setExpandedItems(newExpanded);
    };

    const addItem = () => {
        if (!data || !data.items) return;
        const maxItemNo = Math.max(...data.items.map((i: POItem) => i.po_item_no || 0), 0);
        const newItem = {
            po_item_no: maxItemNo + 1,
            material_code: '',
            material_description: '',
            unit: '',
            ordered_quantity: 0,
            po_rate: 0,
            item_value: 0,
            deliveries: []
        };
        setData({ ...data, items: [...data.items, newItem] });
        setExpandedItems(new Set([...expandedItems, maxItemNo + 1]));
    };

    const removeItem = (itemNo: number) => {
        if (!data || !data.items) return;
        const newItems = data.items.filter((i: POItem) => i.po_item_no !== itemNo);
        setData({ ...data, items: newItems });
        const newExpanded = new Set(expandedItems);
        newExpanded.delete(itemNo);
        setExpandedItems(newExpanded);
    };

    const addDelivery = (itemNo: number) => {
        if (!data || !data.items) return;
        const newItems = data.items.map((item: POItem) => {
            if (item.po_item_no === itemNo) {
                const newDelivery = {
                    lot_no: (item.deliveries?.length || 0) + 1,
                    delivered_quantity: 0,
                    dely_date: '',
                    entry_allow_date: '',
                    dest_code: undefined
                };
                return {
                    ...item,
                    deliveries: [...(item.deliveries || []), newDelivery]
                };
            }
            return item;
        });
        setData({ ...data, items: newItems });
    };

    const removeDelivery = (itemNo: number, deliveryIndex: number) => {
        if (!data || !data.items) return;
        const newItems = data.items.map((item: POItem) => {
            if (item.po_item_no === itemNo) {
                const newDeliveries = item.deliveries.filter((_: PODelivery, idx: number) => idx !== deliveryIndex);
                return { ...item, deliveries: newDeliveries };
            }
            return item;
        });
        setData({ ...data, items: newItems });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
                <div className="text-purple-600 font-medium animate-pulse flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading PO Details...
                </div>
            </div>
        );
    }

    if (!data || !data.header) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 gap-4">
                <div className="bg-red-50 p-4 rounded-full border border-red-100">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Purchase Order Not Found</h2>
                <button
                    onClick={() => router.push('/po')}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
                >
                    Back to List
                </button>
            </div>
        );
    }

    const { header, items } = data;

    interface FieldProps {
        label: string;
        value: string | number | null | undefined;
        field?: string;
        readonly?: boolean;
    }

    const Field = ({ label, value, field, readonly = false }: FieldProps) => {
        const isReadonly = readonly || field === 'po_number' || field === 'po_date';

        return (
            <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">{label}</label>
                {editMode && !isReadonly ? (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => {
                            if (field) {
                                setData({
                                    ...data,
                                    header: { ...data.header, [field]: e.target.value }
                                });
                            }
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-slate-800 bg-white transition-all shadow-sm"
                    />
                ) : (
                    <div className="text-xs font-medium text-slate-800 truncate min-h-[20px]" title={value?.toString()}>
                        {value || <span className="text-slate-300 italic">-</span>}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-4 md:p-6 space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 rounded-full hover:bg-white/50">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                            Purchase Order {header.po_number}
                            <StatusBadge status={header.po_status || "Active"} />
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            Created on {formatDate(header.po_date)}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2.5">
                    {editMode ? (
                        <>
                            <button
                                onClick={() => setEditMode(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" /> Cancel
                            </button>
                            <button
                                onClick={() => {
                                    alert('Save functionality coming in Phase 2');
                                }}
                                className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm shadow-purple-500/20"
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <DownloadButton
                                url={`${API_BASE_URL}/api/po/${header.po_number}/download`}
                                filename={`PO_${header.po_number}.xlsx`}
                                label="Download PO"
                            />
                            <button
                                onClick={() => {
                                    if (hasDC && dcId) {
                                        router.push(`/dc/view?id=${dcId}`);
                                    } else {
                                        router.push(`/dc/create?po=${header.po_number}`);
                                    }
                                }}
                                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm flex items-center gap-2 transition-all ${hasDC
                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                {hasDC ? 'View Challan' : 'Create Challan'}
                            </button>
                            <button
                                onClick={() => setEditMode(true)}
                                className="px-4 py-2 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                                <Edit2 className="w-4 h-4" /> Edit
                            </button>
                        </>
                    )}
                </div>
            </div >

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3 text-red-600">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Side: Supplier, Financials, Remarks */}
                <div className="md:col-span-1 space-y-6">
                    <Card variant="glass" padding="none" className="overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/20 bg-white/40">
                            <Info className="w-4 h-4 text-purple-600" />
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Supplier & Order Info</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <Field label="Supplier Name" value={header.supplier_name} field="supplier_name" />
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Code" value={header.supplier_code} field="supplier_code" />
                                <Field label="Dept (DVN)" value={header.department_no} field="department_no" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Phone" value={header.supplier_phone} field="supplier_phone" />
                                <Field label="Fax" value={header.supplier_fax} field="supplier_fax" />
                            </div>
                            <Field label="Email" value={header.supplier_email} field="supplier_email" />
                            <div className="h-px bg-slate-100/80 my-2" />
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Enquiry No" value={header.enquiry_no} field="enquiry_no" />
                                <Field label="Order Type" value={header.order_type} field="order_type" />
                            </div>
                            <Field label="Quotation Ref" value={header.quotation_ref} field="quotation_ref" />
                        </div>
                    </Card>

                    <Card variant="glass" padding="none" className="overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/20 bg-white/40">
                            <Landmark className="w-4 h-4 text-emerald-600" />
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Financials & Terms</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="PO Value" value={header.po_value ? `₹${header.po_value.toLocaleString()}` : null} field="po_value" />
                                <Field label="Net Value" value={header.net_po_value ? `₹${header.net_po_value.toLocaleString()}` : null} field="net_po_value" />
                            </div>
                            <Field label="TIN No" value={header.tin_no} field="tin_no" />
                            <Field label="ECC No" value={header.ecc_no} field="ecc_no" />
                        </div>
                    </Card>

                    <Card variant="glass" padding="none" className="overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/20 bg-white/40">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Remarks</h3>
                        </div>
                        <div className="p-4">
                            {editMode ? (
                                <textarea
                                    value={header.remarks || ''}
                                    onChange={(e) => setData({
                                        ...data,
                                        header: { ...data.header, remarks: e.target.value }
                                    })}
                                    rows={4}
                                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500 text-slate-700 bg-white transition-all resize-none shadow-sm"
                                    placeholder="Add remarks here..."
                                />
                            ) : (
                                <div className="text-xs text-slate-800 whitespace-pre-wrap bg-slate-50/50 p-3 rounded-lg border border-dashed border-slate-200/60 leading-relaxed">
                                    {header.remarks || "No remarks provided."}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Side: Items & SRVs */}
                <div className="md:col-span-2 space-y-6">
                    <Card variant="glass" padding="none" className="overflow-visible">
                        <div className="flex items-center justify-between p-4 border-b border-white/20 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-purple-600" />
                                <h3 className="text-[14px] font-bold text-slate-800">Order Items & Delivery Schedule</h3>
                            </div>
                            {editMode && (
                                <button
                                    onClick={addItem}
                                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-md text-xs font-bold border border-purple-200 flex items-center gap-1 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Item
                                </button>
                            )}
                        </div>

                        {items && items.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {items.map((item: POItem, idx: number) => (
                                    <div key={item.po_item_no || idx} className="group transition-colors bg-white/40">
                                        {/* Item Header Row */}
                                        <div className="p-4 flex flex-wrap gap-4 items-start">
                                            <div className="w-12 pt-1">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                                                    {item.po_item_no}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-[200px]">
                                                <div className="mb-1">
                                                    {editMode ? (
                                                        <input
                                                            className="w-full text-xs font-bold text-slate-800 border-b border-slate-200 focus:border-purple-500 outline-none bg-transparent"
                                                            value={item.material_description}
                                                            onChange={e => {
                                                                const newItems = [...items];
                                                                newItems[idx] = { ...newItems[idx], material_description: e.target.value };
                                                                setData({ ...data, items: newItems });
                                                            }}
                                                        />
                                                    ) : (
                                                        <h4 className="text-xs font-semibold text-slate-800 leading-tight">{item.material_description}</h4>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200">{item.material_code}</span>
                                                    {item.unit && <span>• {item.unit}</span>}
                                                </div>
                                            </div>

                                            <div className="flex gap-6 text-right text-xs">
                                                <div>
                                                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Ordered</span>
                                                    {editMode ? (
                                                        <input type="number" className="w-20 text-right bg-slate-50 border rounded px-1" value={item.ordered_quantity}
                                                            onChange={e => {
                                                                const newItems = [...items];
                                                                newItems[idx] = { ...newItems[idx], ordered_quantity: parseFloat(e.target.value) };
                                                                setData({ ...data, items: newItems });
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="font-medium text-slate-700 text-xs">{(item.ordered_quantity || 0).toLocaleString('en-IN')}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Delivered</span>
                                                    <span className="font-medium text-blue-600 text-xs">{(item.delivered_quantity || 0).toLocaleString('en-IN')}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Received</span>
                                                    <span className="font-medium text-emerald-600 text-xs">{(item.received_quantity || 0).toLocaleString('en-IN')}</span>
                                                </div>
                                                {/* <div>
                                                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Rejected</span>
                                                    <span className="font-bold text-red-500 text-sm">{item.rejected_quantity || 0}</span>
                                                </div> */}
                                                <div>
                                                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Rate</span>
                                                    <span className="font-semibold text-slate-700">₹{item.po_rate}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2 ml-2">
                                                <div className="flex gap-2">
                                                    {editMode && (
                                                        <button onClick={() => removeItem(item.po_item_no)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {item.deliveries && item.deliveries.length > 0 && (
                                                        <button onClick={() => toggleItem(item.po_item_no)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors">
                                                            {expandedItems.has(item.po_item_no) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delivery Schedule */}
                                        {expandedItems.has(item.po_item_no) && item.deliveries && item.deliveries.length > 0 && (
                                            <div className="px-4 pb-4 pl-16">
                                                <div className="bg-slate-50/80 rounded-lg border border-slate-200/60 overflow-hidden">
                                                    <div className="flex items-center justify-between px-3 py-2 bg-slate-100/50 border-b border-slate-200/60">
                                                        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                            <span className="w-1 h-1 rounded-full bg-slate-400"></span> Delivery Schedule
                                                        </h5>
                                                        {editMode && (
                                                            <button onClick={() => addDelivery(item.po_item_no)} className="text-[10px] font-bold text-blue-600 hover:text-blue-800">
                                                                + ADD SCHEDULE
                                                            </button>
                                                        )}
                                                    </div>
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="text-slate-400 font-medium border-b border-slate-200/60">
                                                            <tr>
                                                                <th className="px-3 py-2 w-16">Lot #</th>
                                                                <th className="px-3 py-2 text-right">Qty</th>
                                                                <th className="px-3 py-2">Delivery Date</th>
                                                                <th className="px-3 py-2">Entry Allowed</th>
                                                                <th className="px-3 py-2">Dest. Code</th>
                                                                <th className="px-3 py-2"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-200/40">
                                                            {item.deliveries.map((delivery, dIdx) => (
                                                                <tr key={dIdx} className="hover:bg-white transition-colors">
                                                                    <td className="px-3 py-2 text-slate-700 text-xs font-medium">{delivery.lot_no}</td>
                                                                    <td className="px-3 py-2 text-right font-semibold text-slate-700">{delivery.delivered_quantity}</td>
                                                                    <td className="px-3 py-2 text-slate-600">{formatDate(delivery.dely_date)}</td>
                                                                    <td className="px-3 py-2 text-slate-600">{formatDate(delivery.entry_allow_date)}</td>
                                                                    <td className="px-3 py-2 text-slate-600">{delivery.dest_code || '-'}</td>
                                                                    <td className="px-3 py-2 text-right">
                                                                        {editMode && (
                                                                            <button onClick={() => removeDelivery(item.po_item_no, dIdx)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                                                <X className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white/40">
                                <ShoppingCart className="w-8 h-8 opacity-20 mb-2" />
                                <p className="text-sm font-medium">No items found in this purchase order.</p>
                                {editMode && <button onClick={addItem} className="mt-4 text-xs font-bold text-purple-600 hover:underline">+ Add First Item</button>}
                            </div>
                        )}
                    </Card>

                    <Card variant="glass" padding="none" className="overflow-visible">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-blue-600" />
                                <h3 className="text-[14px] font-bold text-slate-800">Versions & SRVs</h3>
                            </div>
                            <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{srvs.length} Found</span>
                        </div>
                        <div className="p-4">
                            {srvs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {srvs.map((srv) => (
                                        <div key={srv.srv_number} className="group border border-slate-200 rounded-xl p-4 bg-white/60 hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => router.push(`/srv/${srv.srv_number}`)}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs ring-2 ring-blue-100">SRV</div>
                                                    <div>
                                                        <span className="font-bold text-slate-800 text-sm block">#{srv.srv_number}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Ref: {header.po_number}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-slate-600 block">{formatDate(srv.srv_date)}</span>
                                                    {!srv.po_found && (
                                                        <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-bold inline-block mt-1">
                                                            UNLINKED
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400 font-medium">Received</span>
                                                    <span className="font-bold text-emerald-600 text-sm">{srv.total_received_qty.toFixed(2)}</span>
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-slate-400 font-medium">Rejected</span>
                                                    <span className="font-bold text-red-600 text-sm">{srv.total_rejected_qty.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-xs font-medium">No Store Receipt Vouchers (SRVs) found linked to this PO.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div >
    );
}


export default function PODetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
                <div className="text-purple-600 font-medium animate-pulse flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading...
                </div>
            </div>
        }>
            <PODetailContent />
        </Suspense>
    );
}
