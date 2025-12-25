"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X, FileText, Briefcase, CreditCard, User, Plus, Trash2, Package, Loader2, Sparkles } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Tabs from "@/components/ui/Tabs";

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
    const [saving, setSaving] = useState(false);

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
    };

    const removeItem = (itemNo: number) => {
        if (!data || !data.items) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newItems = data.items.filter((i: any) => i.po_item_no !== itemNo);
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
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6 space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/80 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white shadow-sm transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-[20px] font-semibold text-slate-800 tracking-tight uppercase">Create Purchase Order</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest">
                                PROCUREMENT
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                {header.po_number || 'ST/PO/24-25/---'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="btn-premium btn-ghost h-11 px-6 text-slate-500"
                    >
                        <X className="w-4 h-4" /> Discard
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-premium btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 shadow-indigo-200 h-11 px-8"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save PO'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left Column: Details & Items */}
                <div className="lg:col-span-8 space-y-10">
                    <GlassCard className="p-0 overflow-hidden border-slate-200/60 shadow-sm transition-all">
                        <Tabs
                            tabs={[
                                { id: 'basic', icon: FileText, label: 'Basic Info' },
                                { id: 'references', icon: Briefcase, label: 'References' },
                                { id: 'financial', icon: CreditCard, label: 'Financials' },
                                { id: 'issuer', icon: User, label: 'Issuer Details' },
                            ]}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            className="px-6 pt-6"
                        />

                        <div className="p-10">
                            {activeTab === 'basic' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-label">PO Number</label>
                                        <input value={header.po_number || ''} onChange={(e) => updateHeader('po_number', e.target.value)} className="input-premium font-black uppercase" placeholder="e.g. PO/24-25/001" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-label">PO Date</label>
                                        <input type="date" value={header.po_date || ''} onChange={(e) => updateHeader('po_date', e.target.value)} className="input-premium font-bold" />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-label">Supplier Name</label>
                                        <input value={header.supplier_name || ''} onChange={(e) => updateHeader('supplier_name', e.target.value)} className="input-premium font-bold" placeholder="Legal name of supplier" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-label">Supplier Code</label>
                                        <input value={header.supplier_code || ''} onChange={(e) => updateHeader('supplier_code', e.target.value)} className="input-premium font-black uppercase" placeholder="VND-001" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-label">Department</label>
                                        <input value={header.department_no || ''} onChange={(e) => updateHeader('department_no', e.target.value)} className="input-premium font-bold" placeholder="Department code/name" />
                                    </div>
                                    <div className="col-span-full h-px bg-slate-50 my-2" />
                                    <div className="space-y-2">
                                        <label className="text-label">Email Address</label>
                                        <input value={header.supplier_email || ''} onChange={(e) => updateHeader('supplier_email', e.target.value)} className="input-premium" placeholder="contact@supplier.com" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-label">Phone</label>
                                            <input value={header.supplier_phone || ''} onChange={(e) => updateHeader('supplier_phone', e.target.value)} className="input-premium" placeholder="+91..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-label">Fax</label>
                                            <input value={header.supplier_fax || ''} onChange={(e) => updateHeader('supplier_fax', e.target.value)} className="input-premium" placeholder="Fax no." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'references' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-label">Enquiry No</label>
                                        <input value={header.enquiry_no || ''} onChange={(e) => updateHeader('enquiry_no', e.target.value)} className="input-premium font-black" placeholder="ENQ/..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-label">Enquiry Date</label>
                                        <input type="date" value={header.enquiry_date || ''} onChange={(e) => updateHeader('enquiry_date', e.target.value)} className="input-premium font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-label">Quotation Ref</label>
                                        <input value={header.quotation_ref || ''} onChange={(e) => updateHeader('quotation_ref', e.target.value)} className="input-premium font-black" placeholder="QTN/..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-label">Quotation Date</label>
                                        <input type="date" value={header.quotation_date || ''} onChange={(e) => updateHeader('quotation_date', e.target.value)} className="input-premium font-bold" />
                                    </div>
                                    <div className="col-span-full h-px bg-slate-50 my-2" />
                                    <div className="space-y-2">
                                        <label className="text-label">Order Type</label>
                                        <input value={header.order_type || ''} onChange={(e) => updateHeader('order_type', e.target.value)} className="input-premium font-bold" placeholder="e.g. Regular, AMC, Service" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'financial' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-label">TIN Number</label>
                                        <input value={header.tin_no || ''} onChange={(e) => updateHeader('tin_no', e.target.value)} className="input-premium font-black" placeholder="Tax ID" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-label">ECC Number</label>
                                        <input value={header.ecc_no || ''} onChange={(e) => updateHeader('ecc_no', e.target.value)} className="input-premium font-black" placeholder="Excise Control Code" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-label">MPCT Number</label>
                                        <input value={header.mpct_no || ''} onChange={(e) => updateHeader('mpct_no', e.target.value)} className="input-premium font-black" placeholder="MPCT ref" />
                                    </div>
                                    <div className="col-span-full h-px bg-slate-50 my-2" />
                                    <div className="space-y-2">
                                        <label className="text-label">Net PO Value</label>
                                        <input type="number" value={header.net_po_value || 0} onChange={(e) => updateHeader('net_po_value', e.target.value)} className="input-premium font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-label">FOB Value</label>
                                        <input type="number" value={header.fob_value || 0} onChange={(e) => updateHeader('fob_value', e.target.value)} className="input-premium font-bold" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'issuer' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2 col-span-full">
                                        <label className="text-label">Inspection By</label>
                                        <input value={header.inspection_by || ''} onChange={(e) => updateHeader('inspection_by', e.target.value)} className="input-premium font-bold" placeholder="Department or Third Party" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-label">Issuer Name</label>
                                        <input value={header.issuer_name || ''} onChange={(e) => updateHeader('issuer_name', e.target.value)} className="input-premium font-bold" placeholder="Authorized Person" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-label">Role / Designation</label>
                                        <input value={header.issuer_designation || ''} onChange={(e) => updateHeader('issuer_designation', e.target.value)} className="input-premium font-bold" placeholder="Designation" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-label">Contact Phone</label>
                                        <input value={header.issuer_phone || ''} onChange={(e) => updateHeader('issuer_phone', e.target.value)} className="input-premium" placeholder="Direct line" />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-label">Internal Remarks</label>
                                        <textarea
                                            value={header.remarks || ''}
                                            onChange={(e) => updateHeader('remarks', e.target.value)}
                                            rows={2}
                                            className="input-premium resize-none"
                                            placeholder="Confidential notes or special instructions..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Package className="w-3.5 h-3.5" /> Purchase Items
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest">
                                    {items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'}
                                </span>
                                <button onClick={addItem} className="h-8 px-4 rounded-xl bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-sm">
                                    <Plus className="w-3.5 h-3.5" /> <span>Add Row</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                            {items && items.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="table-th w-16 text-center">#SL</th>
                                            <th className="table-th">Description of Material</th>
                                            <th className="table-th w-28">Mat. Code</th>
                                            <th className="table-th w-20">Unit</th>
                                            <th className="table-th text-right w-24">Ord Qty</th>
                                            <th className="table-th text-right w-28">PO Rate</th>
                                            <th className="table-th text-right w-32">Item Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/50">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {items.map((item: any) => (
                                            <tr key={item.po_item_no} className="table-row group">
                                                <td className="table-td text-center font-black text-slate-300 text-[10px]">{item.po_item_no}</td>
                                                <td className="table-td">
                                                    <input
                                                        value={item.material_description}
                                                        onChange={(e) => {
                                                            const newItems = items.map((i: any) => i.po_item_no === item.po_item_no ? { ...i, material_description: e.target.value } : i);
                                                            setData({ ...data, items: newItems });
                                                        }}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                                                        placeholder="e.g. MS Plate 10mm IS:2062"
                                                    />
                                                </td>
                                                <td className="table-td">
                                                    <input
                                                        value={item.material_code}
                                                        onChange={(e) => {
                                                            const newItems = items.map((i: any) => i.po_item_no === item.po_item_no ? { ...i, material_code: e.target.value.toUpperCase() } : i);
                                                            setData({ ...data, items: newItems });
                                                        }}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 font-black text-slate-400 uppercase text-[10px] tracking-tight"
                                                        placeholder="CODE"
                                                    />
                                                </td>
                                                <td className="table-td">
                                                    <input
                                                        value={item.unit}
                                                        onChange={(e) => {
                                                            const newItems = items.map((i: any) => i.po_item_no === item.po_item_no ? { ...i, unit: e.target.value.toUpperCase() } : i);
                                                            setData({ ...data, items: newItems });
                                                        }}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-500 text-[10px] font-bold uppercase"
                                                        placeholder="UN"
                                                    />
                                                </td>
                                                <td className="table-td text-right">
                                                    <input
                                                        type="number"
                                                        value={item.ord_qty}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            const newItems = items.map((i: any) => i.po_item_no === item.po_item_no ? { ...i, ord_qty: val } : i);
                                                            setData({ ...data, items: newItems });
                                                        }}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-right font-black text-slate-800"
                                                    />
                                                </td>
                                                <td className="table-td text-right">
                                                    <input
                                                        type="number"
                                                        value={item.po_rate}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            const newItems = items.map((i: any) => i.po_item_no === item.po_item_no ? { ...i, po_rate: val } : i);
                                                            setData({ ...data, items: newItems });
                                                        }}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-right font-bold text-blue-600"
                                                    />
                                                </td>
                                                <td className="table-td text-right group-hover:bg-slate-50/80 transition-all">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <span className="font-black text-slate-700 text-sm">₹{(item.ord_qty * item.po_rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                        <button
                                                            onClick={() => removeItem(item.po_item_no)}
                                                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
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
                                        <Package className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Your item list is empty</p>
                                        <button onClick={addItem} className="text-xs text-blue-500 hover:underline font-bold">Add your first material line</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Commercial Summary */}
                <div className="lg:col-span-4 space-y-8 h-fit lg:sticky lg:top-8">
                    <GlassCard className="p-8 border-blue-100/50 shadow-lg shadow-blue-500/5 overflow-hidden relative group">
                        <div className="absolute -right-8 -top-8 h-32 w-32 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />

                        <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2 relative">
                            <Briefcase className="w-3.5 h-3.5" /> Commercial Value
                        </h3>

                        <div className="space-y-5 relative">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gross PO Value</span>
                                <span className="text-sm font-bold text-slate-700 tabular-nums">
                                    ₹{items.reduce((sum: number, item: any) => sum + (item.ord_qty * item.po_rate), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Payable</span>
                                <span className="text-sm font-bold text-slate-700 tabular-nums">₹{(header.net_po_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="pt-5 border-t border-slate-100">
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] block mb-2">Total PO Amount</span>
                                <div className="text-4xl font-black text-slate-900 tracking-tighter mb-4 drop-shadow-sm tabular-nums">
                                    ₹{items.reduce((sum: number, item: any) => sum + (item.ord_qty * item.po_rate), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-[9px] font-bold leading-relaxed text-slate-500 italic uppercase tracking-wider">
                                    Consolidated value across all items. Taxes and duties as per terms.
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8 border-slate-100/50 shadow-sm">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Order Context</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Status</span>
                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 uppercase uppercase">
                                    {header.po_status || 'NEW'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Amendment</span>
                                <span className="text-xs font-black text-slate-700">#{header.amend_no || 0}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-50">
                                <p className="text-[9px] font-medium text-slate-400 leading-relaxed uppercase tracking-widest">
                                    Once saved, this PO will be available for Delivery Challan linking and Invoice generation.
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

        </div>
    );
}
