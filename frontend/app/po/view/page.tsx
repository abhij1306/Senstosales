"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Edit2, Save, X, ChevronDown, ChevronUp, Plus } from "lucide-react";

import { api, API_BASE_URL } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { PODetail, POItem, PODelivery, SRVListItem } from "@/types";
import DownloadButton from "@/components/DownloadButton";


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
    const [activeTab, setActiveTab] = useState("basic");

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
            <div className="flex items-center justify-center h-full">
                <div className="text-primary font-medium">Loading...</div>
            </div>
        );
    }

    if (!data || !data.header) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-text-secondary">PO not found</div>
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
        // Don't hide fields - always show them
        const isReadonly = readonly || field === 'po_number' || field === 'po_date';

        return (
            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">{label}</label>
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
                        className="w-full px-2 py-1.5 text-sm border border-border rounded focus:ring-1 focus:ring-primary focus:border-primary text-text-primary bg-white transition-all"
                    />
                ) : (
                    <div className="text-[14px] font-medium text-text-primary truncate min-h-[20px]" title={value?.toString()}>{value || '-'}</div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
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
                        <h1 className="text-[20px] font-semibold text-text-primary flex items-center gap-3 tracking-tight">
                            Purchase Order {header.po_number}
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-primary border border-blue-100 uppercase tracking-wide">
                                {header.po_status || "Active"}
                            </span>
                        </h1>
                        <p className="text-[13px] text-text-secondary mt-0.5 font-medium">
                            Created on {formatDate(header.po_date)}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {editMode ? (
                        <>
                            <button
                                onClick={() => setEditMode(false)}
                                className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-white border border-border rounded hover:bg-gray-50 transition-colors"
                            >
                                <X className="w-3 h-3 inline mr-1" />
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // TODO: Implement save functionality
                                    alert('Save functionality coming in Phase 2');
                                }}
                                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
                            >
                                <Save className="w-3 h-3 inline mr-1" />
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <DownloadButton
                                url={`${API_BASE_URL}/api/po/${header.po_number}/download`}
                                filename={`PO_${header.po_number}.xlsx`}
                                label="Download Excel"
                            />
                            <button
                                onClick={() => {
                                    if (hasDC && dcId) {
                                        router.push(`/dc/view?id=${dcId}`);
                                    } else {
                                        router.push(`/dc/create?po=${header.po_number}`);
                                    }
                                }}
                                className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 ${hasDC
                                    ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                                    }`}
                            >
                                <Plus className="w-4 h-4" />
                                {hasDC ? 'View Challan' : 'Create Challan'}
                            </button>
                            <button
                                onClick={() => setEditMode(true)}
                                className="px-4 py-2 text-sm font-medium bg-white border border-border text-text-secondary rounded hover:text-text-primary hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <Edit2 className="w-3 h-3" />
                                Edit PO
                            </button>
                        </>
                    )}
                </div>
            </div >

            {/* Tabs & Content */}
            < div className="glass-card overflow-hidden" >
                <div className="border-b border-border bg-gray-50/30">
                    <div className="flex px-4 pt-2">
                        {[
                            { id: 'basic', label: 'Basic Info' },
                            { id: 'references', label: 'References' },
                            { id: 'financial', label: 'Financial & Tax' },
                            { id: 'issuer', label: 'Issuer & Inspection' },
                            { id: 'srvs', label: `SRVs (${srvs.length})` },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-[13px] font-semibold transition-all relative top-[1px] border-b-2 mr-4 ${activeTab === tab.id
                                    ? 'border-primary text-primary bg-transparent'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {activeTab === 'basic' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
                            <Field label="PO Number" value={header.po_number} field="po_number" readonly />
                            <Field label="PO Date" value={header.po_date} field="po_date" readonly />
                            <Field label="Supplier Name" value={header.supplier_name} field="supplier_name" />
                            <Field label="Supplier Code" value={header.supplier_code} field="supplier_code" />
                            <Field label="Phone" value={header.supplier_phone} field="supplier_phone" />
                            <Field label="Fax" value={header.supplier_fax} field="supplier_fax" />
                            <Field label="Email" value={header.supplier_email} field="supplier_email" />
                            <Field label="Department No (DVN)" value={header.department_no} field="department_no" />
                        </div>
                    )}

                    {activeTab === 'references' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
                            <Field label="Enquiry No" value={header.enquiry_no} field="enquiry_no" />
                            <Field label="Enquiry Date" value={header.enquiry_date} field="enquiry_date" />
                            <Field label="Quotation Ref" value={header.quotation_ref} field="quotation_ref" />
                            <Field label="Quotation Date" value={header.quotation_date} field="quotation_date" />
                            <Field label="RC No" value={header.rc_no} field="rc_no" />
                            <Field label="Order Type" value={header.order_type} field="order_type" />
                            <Field label="PO Status" value={header.po_status} field="po_status" />
                            <Field label="Amendment No" value={header.amend_no} field="amend_no" />
                        </div>
                    )}

                    {activeTab === 'financial' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
                            <Field label="PO Value" value={header.po_value ? `₹${header.po_value.toLocaleString()}` : null} field="po_value" />
                            <Field label="FOB Value" value={header.fob_value ? `₹${header.fob_value.toLocaleString()}` : null} field="fob_value" />
                            <Field label="Net PO Value" value={header.net_po_value ? `₹${header.net_po_value.toLocaleString()}` : null} field="net_po_value" />
                            <Field label="TIN No" value={header.tin_no} field="tin_no" />
                            <Field label="ECC No" value={header.ecc_no} field="ecc_no" />
                            <Field label="MPCT No" value={header.mpct_no} field="mpct_no" />
                        </div>
                    )}

                    {activeTab === 'issuer' && (
                        <div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
                                <Field label="Inspection By" value={header.inspection_by} field="inspection_by" />
                                <Field label="Issuer Name" value={header.issuer_name} field="issuer_name" />
                                <Field label="Issuer Designation" value={header.issuer_designation} field="issuer_designation" />
                                <Field label="Issuer Phone" value={header.issuer_phone} field="issuer_phone" />
                            </div>
                            {(header.remarks || editMode) && (
                                <div className="mt-6 pt-6 border-t border-border">
                                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-2">Remarks</label>
                                    {editMode ? (
                                        <textarea
                                            value={header.remarks || ''}
                                            onChange={(e) => setData({
                                                ...data,
                                                header: { ...data.header, remarks: e.target.value }
                                            })}
                                            rows={3}
                                            className="w-full px-3 py-2 text-sm border border-border rounded focus:ring-1 focus:ring-primary text-text-primary bg-white transition-all"
                                        />
                                    ) : (
                                        <div className="text-sm text-text-primary whitespace-pre-wrap bg-gray-50/50 p-3 rounded-lg border border-border/50">{header.remarks}</div>
                                    )}
                                </div>
                            )}


                        </div>
                    )}

                    {activeTab === 'srvs' && (
                        <div>
                            {srvs.length > 0 ? (
                                <div className="space-y-4">
                                    {srvs.map((srv) => (
                                        <div key={srv.srv_number} className="border border-border rounded-lg p-4 bg-white flex items-center justify-between hover:shadow-sm transition-shadow">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-text-primary text-sm">SRV {srv.srv_number}</span>
                                                    <span className="text-xs text-text-secondary bg-gray-100 px-2 py-0.5 rounded-full">{formatDate(srv.srv_date)}</span>
                                                    {!srv.po_found && (
                                                        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            ⚠️ PO Link Missing
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-4 text-xs text-text-secondary">
                                                    <div>Received: <span className="font-medium text-green-600">{srv.total_received_qty.toFixed(2)}</span></div>
                                                    <div>Rejected: <span className="font-medium text-red-600">{srv.total_rejected_qty.toFixed(2)}</span></div>
                                                </div>
                                            </div>
                                            <a
                                                href={`/srv/${srv.srv_number}`}
                                                className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 rounded hover:bg-primary/10 transition-colors"
                                            >
                                                View Details
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-text-secondary">
                                    <p>No SRVs found for this PO.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div >

            {/* Items & Deliveries */}
            < div className="glass-card p-6" >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[16px] font-semibold text-text-primary">Order Items & Delivery Schedule</h2>
                    {editMode && (
                        <button
                            onClick={addItem}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Add Item
                        </button>
                    )}
                </div>
                {
                    items && items.length > 0 ? (
                        <div className="space-y-4">
                            {items.map((item: POItem) => (
                                <div key={item.po_item_no} className="border border-border rounded-lg overflow-hidden bg-white">
                                    {/* Item Header */}
                                    <div className="bg-gray-50/50 px-4 py-3 border-b border-border/50">
                                        <div className="flex items-start justify-between">
                                            <div className="grid grid-cols-12 gap-x-4 gap-y-2 flex-1 text-sm">
                                                <div className="col-span-1">
                                                    <span className="text-[10px] uppercase font-bold text-text-secondary block mb-1">Item #</span>
                                                    <div className="font-semibold text-text-primary">{item.po_item_no}</div>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-[10px] uppercase font-bold text-text-secondary block mb-1">Code</span>
                                                    {editMode ? (
                                                        <input
                                                            type="text"
                                                            value={item.material_code || ''}
                                                            onChange={(e) => {
                                                                const newItems = [...items];
                                                                const idx = newItems.findIndex(i => i.po_item_no === item.po_item_no);
                                                                if (idx !== -1) {
                                                                    newItems[idx] = { ...newItems[idx], material_code: e.target.value };
                                                                    setData({ ...data, items: newItems });
                                                                }
                                                            }}
                                                            className="w-full px-2 py-1 text-xs border border-border rounded"
                                                        />
                                                    ) : (
                                                        <div className="text-text-primary font-medium">{item.material_code}</div>
                                                    )}
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-[10px] uppercase font-bold text-text-secondary block mb-1">Description</span>
                                                    {editMode ? (
                                                        <input
                                                            type="text"
                                                            value={item.material_description || ''}
                                                            onChange={(e) => {
                                                                const newItems = [...items];
                                                                const idx = newItems.findIndex(i => i.po_item_no === item.po_item_no);
                                                                if (idx !== -1) {
                                                                    newItems[idx] = { ...newItems[idx], material_description: e.target.value };
                                                                    setData({ ...data, items: newItems });
                                                                }
                                                            }}
                                                            className="w-full px-2 py-1 text-xs border border-border rounded"
                                                        />
                                                    ) : (
                                                        <div className="truncate text-text-primary font-medium text-xs" title={item.material_description}>{item.material_description}</div>
                                                    )}
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <span className="text-[10px] uppercase font-bold text-text-secondary block mb-1">Ordered</span>
                                                    {editMode ? (
                                                        <input
                                                            type="number"
                                                            value={item.ordered_quantity || ''}
                                                            onChange={(e) => {
                                                                const newItems = [...items];
                                                                const idx = newItems.findIndex(i => i.po_item_no === item.po_item_no);
                                                                if (idx !== -1) {
                                                                    newItems[idx] = { ...newItems[idx], ordered_quantity: parseFloat(e.target.value) };
                                                                    setData({ ...data, items: newItems });
                                                                }
                                                            }}
                                                            className="w-full px-2 py-1 text-xs border border-border rounded text-right"
                                                        />
                                                    ) : (
                                                        <div className="text-text-primary font-bold">{item.ordered_quantity || 0}</div>
                                                    )}
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <span className="text-[10px] uppercase font-bold text-blue-600 block mb-1">Delivered</span>
                                                    <div className="text-blue-600 font-bold">{item.delivered_quantity || 0}</div>
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <span className="text-[10px] uppercase font-bold text-green-600 block mb-1">Received</span>
                                                    <div className="text-green-600 font-bold">{item.received_quantity || 0}</div>
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <span className="text-[10px] uppercase font-bold text-red-600 block mb-1">Rejected</span>
                                                    <div className="text-red-600 font-bold">
                                                        {item.rejected_quantity || 0}
                                                        {(item.rejected_quantity || 0) > 0 && (
                                                            <div className="text-[9px] mt-0.5 bg-red-100 px-1 py-0.5 rounded inline-block ml-1">
                                                                {(((item.rejected_quantity || 0) / ((item.received_quantity || 0) + (item.rejected_quantity || 0))) * 100).toFixed(1)}%
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <span className="text-[10px] uppercase font-bold text-text-secondary block mb-1">Rate</span>
                                                    {editMode ? (
                                                        <input
                                                            type="number"
                                                            value={item.po_rate || ''}
                                                            onChange={(e) => {
                                                                const newItems = [...items];
                                                                const idx = newItems.findIndex(i => i.po_item_no === item.po_item_no);
                                                                if (idx !== -1) {
                                                                    newItems[idx] = { ...newItems[idx], po_rate: parseFloat(e.target.value) };
                                                                    setData({ ...data, items: newItems });
                                                                }
                                                            }}
                                                            className="w-full px-2 py-1 text-xs border border-border rounded text-right"
                                                        />
                                                    ) : (
                                                        <div className="text-text-primary text-xs">₹{item.po_rate}</div>
                                                    )}
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <span className="text-[10px] uppercase font-bold text-text-secondary block mb-1">Value</span>
                                                    <div className="text-text-primary font-bold text-xs">₹{item.item_value?.toLocaleString()}</div>
                                                </div>

                                            </div>
                                            <div className="flex items-center gap-2 ml-4 mt-1">
                                                {editMode && (
                                                    <button
                                                        onClick={() => removeItem(item.po_item_no)}
                                                        className="p-1 bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors"
                                                        title="Delete Item"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                                {item.deliveries && item.deliveries.length > 0 && (
                                                    <button
                                                        onClick={() => toggleItem(item.po_item_no)}
                                                        className="text-text-secondary hover:text-text-primary transition-colors p-1"
                                                    >
                                                        {expandedItems.has(item.po_item_no) ? (
                                                            <ChevronUp className="w-4 h-4" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivery Schedule Table */}
                                    {expandedItems.has(item.po_item_no) && item.deliveries && item.deliveries.length > 0 && (
                                        <div className="px-4 py-3 bg-white border-t border-border/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                                                    Delivery Schedule
                                                </h4>
                                                {editMode && (
                                                    <button
                                                        onClick={() => addDelivery(item.po_item_no)}
                                                        className="px-2 py-1 bg-blue-50 text-primary text-[10px] font-medium rounded hover:bg-blue-100 transition-colors"
                                                    >
                                                        + Delivery
                                                    </button>
                                                )}
                                            </div>
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-border/50">
                                                        <th className="px-3 py-2 text-left text-[10px] uppercase font-semibold text-text-secondary bg-gray-50/30 first:rounded-tl-md">Lot No</th>
                                                        <th className="px-3 py-2 text-right text-[10px] uppercase font-semibold text-text-secondary bg-gray-50/30">Delivery Qty</th>
                                                        <th className="px-3 py-2 text-left text-[10px] uppercase font-semibold text-text-secondary bg-gray-50/30">Delivery Date</th>
                                                        <th className="px-3 py-2 text-left text-[10px] uppercase font-semibold text-text-secondary bg-gray-50/30">Entry Allow Date</th>
                                                        <th className="px-3 py-2 text-left text-[10px] uppercase font-semibold text-text-secondary bg-gray-50/30 last:rounded-tr-md">Dest Code</th>
                                                        {editMode && <th className="px-3 py-2 text-left text-[10px] uppercase font-semibold text-text-secondary bg-gray-50/30"></th>}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/30">
                                                    {item.deliveries.map((delivery: PODelivery, idx: number) => (
                                                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                                            <td className="px-3 py-2 text-text-primary font-medium">{delivery.lot_no}</td>
                                                            <td className="px-3 py-2 text-text-primary text-right font-medium">{delivery.delivered_quantity}</td>
                                                            <td className="px-3 py-2 text-text-secondary text-[13px]">{formatDate(delivery.dely_date)}</td>
                                                            <td className="px-3 py-2 text-text-secondary text-[13px]">{formatDate(delivery.entry_allow_date)}</td>
                                                            <td className="px-3 py-2 text-text-secondary text-[13px]">{delivery.dest_code}</td>
                                                            {editMode && (
                                                                <td className="px-3 py-2 text-right">
                                                                    <button
                                                                        onClick={() => removeDelivery(item.po_item_no, idx)}
                                                                        className="text-text-secondary hover:text-danger p-1 transition-colors"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-text-secondary bg-gray-50/30 rounded-lg border border-dashed border-border">
                            <p className="text-sm font-medium">No items found in this purchase order.</p>
                        </div>
                    )
                }
            </div >
        </div >
    );
}


export default function PODetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <div className="text-primary font-medium">Loading...</div>
            </div>
        }>
            <PODetailContent />
        </Suspense>
    );
}
