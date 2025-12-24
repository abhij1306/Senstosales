"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X, ChevronDown, ChevronUp, FileText, Briefcase, CreditCard, User, Plus, Trash2, Package } from "lucide-react";
import { Card } from "@/components/ui/Card";

// ============================================================================
// COMPONENTS
// ============================================================================

const CompactInput = ({ label, value, onChange, type = "text", step, placeholder = "", required = false, readOnly = false, className = "" }: any) => (
    <div className={`space-y-0.5 ${className}`}>
        <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            step={step}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            placeholder={placeholder}
            className={`w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 transition-colors ${readOnly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white/80'
                }`}
        />
    </div>
);

// ============================================================================
// MAIN CONTENT
// ============================================================================

export default function CreatePOPage() {
    const router = useRouter();

    // Initial Empty Data System
    const initialData = {
        header: {
            po_number: '',
            po_date: new Date().toISOString().split('T')[0],
            supplier_name: '',
            supplier_code: '',
            supplier_phone: '',
            supplier_fax: '',
            supplier_email: '',
            department_no: '',
            enquiry_no: '',
            enquiry_date: '',
            quotation_ref: '',
            quotation_date: '',
            rc_no: '',
            order_type: '',
            po_status: 'New',
            amend_no: 0,
            po_value: 0,
            fob_value: 0,
            net_po_value: 0,
            tin_no: '',
            ecc_no: '',
            mpct_no: '',
            inspection_by: '',
            issuer_name: '',
            issuer_designation: '',
            issuer_phone: '',
            remarks: ''
        },
        items: []
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(initialData);
    const [activeTab, setActiveTab] = useState("basic");
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [saving, setSaving] = useState(false);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const maxItemNo = data.items.length > 0 ? Math.max(...data.items.map((i: any) => i.po_item_no || 0)) : 0;
        const newItem = {
            po_item_no: maxItemNo + 1,
            material_code: '',
            material_description: '',
            drg_no: '',
            unit: '',
            ord_qty: 0,
            po_rate: 0,
            item_value: 0,
            deliveries: []
        };
        setData({ ...data, items: [...data.items, newItem] });
        setExpandedItems(new Set([...expandedItems, maxItemNo + 1]));
    };

    const removeItem = (itemNo: number) => {
        if (!data || !data.items) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newItems = data.items.filter((i: any) => i.po_item_no !== itemNo);
        setData({ ...data, items: newItems });
        const newExpanded = new Set(expandedItems);
        newExpanded.delete(itemNo);
        setExpandedItems(newExpanded);
    };

    const addDelivery = (itemNo: number) => {
        if (!data || !data.items) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newItems = data.items.map((item: any) => {
            if (item.po_item_no === itemNo) {
                const newDelivery = {
                    lot_no: (item.deliveries?.length || 0) + 1,
                    dely_qty: 0,
                    dely_date: '',
                    entry_allow_date: '',
                    dest_code: ''
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newItems = data.items.map((item: any) => {
            if (item.po_item_no === itemNo) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newDeliveries = item.deliveries.filter((_: any, idx: number) => idx !== deliveryIndex);
                return { ...item, deliveries: newDeliveries };
            }
            return item;
        });
        setData({ ...data, items: newItems });
    };

    const handleSave = async () => {
        setSaving(true);
        setTimeout(() => {
            alert('Save functionality coming soon (Phase 2)');
            setSaving(false);
        }, 1000);
    };

    const { header, items } = data;

    // Helper for updating header
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateHeader = (field: string, value: any) => {
        setData({
            ...data,
            header: { ...data.header, [field]: value }
        });
    };

    return (
        <div className="space-y-4 pb-12 w-full max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-white/50">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                            Create Purchase Order
                        </h1>
                        <p className="text-xs text-slate-500">
                            Drafting new manual PO
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => router.back()}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white/50 border border-slate-200 rounded-lg hover:bg-white transition-colors"
                    >
                        <X className="w-3.5 h-3.5 inline mr-1" /> Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? 'Saving...' : 'Save PO'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Left Column: Header Details (Tabs) */}
                <div className="md:col-span-4 space-y-4">
                    <Card variant="glass" padding="none" className="overflow-hidden h-fit sticky top-6">
                        {/* Tabs Header */}
                        <div className="flex flex-wrap border-b border-white/20 bg-white/40">
                            {[
                                { id: 'basic', icon: FileText, label: 'Basic' },
                                { id: 'references', icon: Briefcase, label: 'Ref' },
                                { id: 'financial', icon: CreditCard, label: 'Finance' },
                                { id: 'issuer', icon: User, label: 'Issuer' },
                            ].map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all flex-1 justify-center border-b-2 ${activeTab === tab.id
                                            ? "border-blue-500 text-blue-700 bg-blue-50/30"
                                            : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/40"
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" /> {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-5">
                            {activeTab === 'basic' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <CompactInput label="PO Number" value={header.po_number || ''} onChange={(e: any) => updateHeader('po_number', e.target.value)} />
                                        <CompactInput label="PO Date" value={header.po_date || ''} onChange={(e: any) => updateHeader('po_date', e.target.value)} type="date" />
                                        <CompactInput label="Supplier Name" value={header.supplier_name || ''} onChange={(e: any) => updateHeader('supplier_name', e.target.value)} />
                                    </div>
                                    <div className="h-px bg-slate-200/50 my-1" />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <CompactInput label="Supplier Code" value={header.supplier_code || ''} onChange={(e: any) => updateHeader('supplier_code', e.target.value)} />
                                        <CompactInput label="Dept (DVN)" value={header.department_no || ''} onChange={(e: any) => updateHeader('department_no', e.target.value)} />
                                        <CompactInput label="Email" value={header.supplier_email || ''} onChange={(e: any) => updateHeader('supplier_email', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <CompactInput label="Phone" value={header.supplier_phone || ''} onChange={(e: any) => updateHeader('supplier_phone', e.target.value)} />
                                        <CompactInput label="Fax" value={header.supplier_fax || ''} onChange={(e: any) => updateHeader('supplier_fax', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'references' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <CompactInput label="Enquiry No" value={header.enquiry_no || ''} onChange={(e: any) => updateHeader('enquiry_no', e.target.value)} />
                                        <CompactInput label="Enquiry Date" value={header.enquiry_date || ''} onChange={(e: any) => updateHeader('enquiry_date', e.target.value)} type="date" />
                                        <CompactInput label="Quotation Ref" value={header.quotation_ref || ''} onChange={(e: any) => updateHeader('quotation_ref', e.target.value)} />
                                    </div>
                                    <div className="h-px bg-slate-200/50 my-1" />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <CompactInput label="Quotation Date" value={header.quotation_date || ''} onChange={(e: any) => updateHeader('quotation_date', e.target.value)} type="date" />
                                        <CompactInput label="RC No" value={header.rc_no || ''} onChange={(e: any) => updateHeader('rc_no', e.target.value)} />
                                        <CompactInput label="Order Type" value={header.order_type || ''} onChange={(e: any) => updateHeader('order_type', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <CompactInput label="PO Status" value={header.po_status || ''} onChange={(e: any) => updateHeader('po_status', e.target.value)} />
                                        <CompactInput label="Amend No" value={header.amend_no || ''} onChange={(e: any) => updateHeader('amend_no', e.target.value)} type="number" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'financial' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <CompactInput label="PO Value" value={header.po_value || 0} onChange={(e: any) => updateHeader('po_value', e.target.value)} type="number" step="0.01" />
                                        <CompactInput label="Net PO Value" value={header.net_po_value || 0} onChange={(e: any) => updateHeader('net_po_value', e.target.value)} type="number" />
                                        <CompactInput label="FOB Value" value={header.fob_value || 0} onChange={(e: any) => updateHeader('fob_value', e.target.value)} type="number" />
                                    </div>
                                    <div className="h-px bg-slate-200/50 my-1" />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <CompactInput label="TIN No" value={header.tin_no || ''} onChange={(e: any) => updateHeader('tin_no', e.target.value)} />
                                        <CompactInput label="ECC No" value={header.ecc_no || ''} onChange={(e: any) => updateHeader('ecc_no', e.target.value)} />
                                        <CompactInput label="MPCT No" value={header.mpct_no || ''} onChange={(e: any) => updateHeader('mpct_no', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'issuer' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <CompactInput label="Inspection By" value={header.inspection_by || ''} onChange={(e: any) => updateHeader('inspection_by', e.target.value)} />
                                        <CompactInput label="Issuer Name" value={header.issuer_name || ''} onChange={(e: any) => updateHeader('issuer_name', e.target.value)} />
                                        <CompactInput label="Designation" value={header.issuer_designation || ''} onChange={(e: any) => updateHeader('issuer_designation', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <CompactInput label="Issuer Phone" value={header.issuer_phone || ''} onChange={(e: any) => updateHeader('issuer_phone', e.target.value)} />
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Remarks</label>
                                        <textarea
                                            value={header.remarks || ''}
                                            onChange={(e) => updateHeader('remarks', e.target.value)}
                                            rows={2} // Reduced rows
                                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white/80 resize-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Items & Deliveries */}
                <div className="md:col-span-8">
                    <Card variant="glass" padding="none" className="min-h-[500px]">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 bg-white/40">
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-blue-600" />
                                <div>
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Order Items</h3>
                                    <p className="text-[10px] text-slate-500 hidden sm:block">Manage items and delivery schedules</p>
                                </div>
                            </div>
                            <button onClick={addItem} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors shadow-sm">
                                <Plus className="w-3.5 h-3.5" /> Add Item
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {items && items.length > 0 ? items.map((item: any) => (
                                <div key={item.po_item_no} className="border border-slate-200 rounded-lg overflow-hidden bg-white/40">
                                    {/* Item Header Row */}
                                    <div className="p-3 bg-slate-50/50 flex flex-wrap gap-4 items-end">
                                        <div className="w-12">
                                            <label className="text-[10px] text-slate-400">#</label>
                                            <div className="text-sm font-semibold text-slate-700">{item.po_item_no}</div>
                                        </div>
                                        <div className="flex-1 min-w-[150px]">
                                            <CompactInput label="Description" value={item.material_description} onChange={(e: any) => {
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const newItems = items.map((i: any) => i.po_item_no === item.po_item_no ? { ...i, material_description: e.target.value } : i);
                                                setData({ ...data, items: newItems });
                                            }} placeholder="Item Description" />
                                        </div>
                                        <div className="w-24">
                                            <CompactInput label="Code" value={item.material_code} onChange={(e: any) => {
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const newItems = items.map((i: any) => i.po_item_no === item.po_item_no ? { ...i, material_code: e.target.value } : i);
                                                setData({ ...data, items: newItems });
                                            }} />
                                        </div>
                                        <div className="w-20">
                                            <CompactInput label="Unit" value={item.unit} onChange={(e: any) => {
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const newItems = items.map((i: any) => i.po_item_no === item.po_item_no ? { ...i, unit: e.target.value } : i);
                                                setData({ ...data, items: newItems });
                                            }} />
                                        </div>
                                        <div className="w-20">
                                            <CompactInput label="Qty" type="number" value={item.ord_qty} onChange={(e: any) => {
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const newItems = items.map((i: any) => i.po_item_no === item.po_item_no ? { ...i, ord_qty: parseFloat(e.target.value) } : i);
                                                setData({ ...data, items: newItems });
                                            }} />
                                        </div>
                                        <div className="w-24">
                                            <CompactInput label="Rate" type="number" value={item.po_rate} onChange={(e: any) => {
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const newItems = items.map((i: any) => i.po_item_no === item.po_item_no ? { ...i, po_rate: parseFloat(e.target.value) } : i);
                                                setData({ ...data, items: newItems });
                                            }} />
                                        </div>
                                        <div className="w-24 text-right">
                                            <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Value</label>
                                            <div className="text-xs font-bold text-slate-700 py-1.5">₹{(item.ord_qty * item.po_rate).toLocaleString()}</div>
                                        </div>

                                        <div className="flex gap-1 pb-0.5 ml-auto">
                                            <button onClick={() => toggleItem(item.po_item_no)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-white transition-colors">
                                                {expandedItems.has(item.po_item_no) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => removeItem(item.po_item_no)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-white transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Deliveries */}
                                    {expandedItems.has(item.po_item_no) && (
                                        <div className="p-3 bg-white border-t border-slate-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delivery Schedule</h4>
                                                <button onClick={() => addDelivery(item.po_item_no)} className="text-[10px] text-blue-600 font-medium hover:underline">+ Add Delivery</button>
                                            </div>

                                            {item.deliveries && item.deliveries.length > 0 ? (
                                                <div className="space-y-2">
                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                    {item.deliveries.map((delivery: any, idx: number) => (
                                                        <div key={idx} className="flex gap-2 items-center">
                                                            <div className="w-12 text-xs text-slate-500 text-center">{delivery.lot_no}</div>
                                                            <input
                                                                type="number"
                                                                placeholder="Qty"
                                                                value={delivery.dely_qty}
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                onChange={(e: any) => {
                                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                    const newItems = items.map((i: any) => {
                                                                        if (i.po_item_no === item.po_item_no) {
                                                                            const newD = [...i.deliveries];
                                                                            newD[idx] = { ...newD[idx], dely_qty: parseFloat(e.target.value) };
                                                                            return { ...i, deliveries: newD };
                                                                        }
                                                                        return i;
                                                                    });
                                                                    setData({ ...data, items: newItems });
                                                                }}
                                                                className="w-20 px-2 py-1 text-xs border border-slate-200 rounded"
                                                            />
                                                            <input type="date" value={delivery.dely_date}
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                onChange={(e: any) => {
                                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                    const newItems = items.map((i: any) => {
                                                                        if (i.po_item_no === item.po_item_no) {
                                                                            const newD = [...i.deliveries];
                                                                            newD[idx] = { ...newD[idx], dely_date: e.target.value };
                                                                            return { ...i, deliveries: newD };
                                                                        }
                                                                        return i;
                                                                    });
                                                                    setData({ ...data, items: newItems });
                                                                }}
                                                                className="w-28 px-2 py-1 text-xs border border-slate-200 rounded"
                                                            />
                                                            <input type="text" placeholder="Dest" value={delivery.dest_code}
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                onChange={(e: any) => {
                                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                    const newItems = items.map((i: any) => {
                                                                        if (i.po_item_no === item.po_item_no) {
                                                                            const newD = [...i.deliveries];
                                                                            newD[idx] = { ...newD[idx], dest_code: e.target.value };
                                                                            return { ...i, deliveries: newD };
                                                                        }
                                                                        return i;
                                                                    });
                                                                    setData({ ...data, items: newItems });
                                                                }}
                                                                className="w-20 px-2 py-1 text-xs border border-slate-200 rounded"
                                                            />
                                                            <button onClick={() => removeDelivery(item.po_item_no, idx)} className="text-slate-400 hover:text-red-500">
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 italic">No deliveries added.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-12 text-slate-400 text-xs border-dashed border border-slate-200 rounded">
                                    No items added. Click "Add Item" to start.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
