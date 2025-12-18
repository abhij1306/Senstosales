"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit2, Save, X, FileText, Package } from "lucide-react";

export default function DCDetailPage() {
    const router = useRouter();
    const params = useParams();
    const dcId = params?.id as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [hasInvoice, setHasInvoice] = useState(false);
    const [invoiceId, setInvoiceId] = useState<string | null>(null);

    useEffect(() => {
        if (!dcId) return;

        // Load DC data
        fetch(`http://localhost:8000/api/dc/${dcId}`)
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load DC:", err);
                setLoading(false);
            });

        // Check if DC has Invoice
        fetch(`http://localhost:8000/api/dc/${dcId}/invoice`)
            .then(res => res.json())
            .then(invoiceData => {
                if (invoiceData && invoiceData.invoice_id) {
                    setHasInvoice(true);
                    setInvoiceId(invoiceData.invoice_id);
                }
            })
            .catch(err => {
                console.log("No Invoice found for this DC");
            });
    }, [dcId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!data || !data.header) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">DC not found</div>
            </div>
        );
    }

    const { header, items } = data;

    const Field = ({ label, value }: { label: string; value: any }) => (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <div className="text-sm text-gray-900">{value || '-'}</div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Delivery Challan {header.dc_number}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Date: {header.dc_date} | PO: {header.po_number}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {editMode ? (
                        <>
                            <button
                                onClick={() => setEditMode(false)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <X className="w-4 h-4 inline mr-2" />
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    alert('Save functionality coming soon');
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Save className="w-4 h-4 inline mr-2" />
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    if (hasInvoice && invoiceId) {
                                        router.push(`/invoice/${invoiceId}`);
                                    } else {
                                        router.push(`/invoice/create?dc=${dcId}`);
                                    }
                                }}
                                className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 ${hasInvoice
                                        ? 'bg-blue-600 hover:bg-blue-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                {hasInvoice ? 'Edit Invoice' : 'Create Invoice'}
                            </button>
                            <button
                                onClick={() => setEditMode(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Edit2 className="w-4 h-4 inline mr-2" />
                                Edit
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* PO Reference */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Purchase Order Reference</h3>
                </div>
                <button
                    onClick={() => router.push(`/po/${header.po_number}`)}
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                    View PO #{header.po_number}
                </button>
            </div>

            {/* DC Details - Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-4 gap-6">
                    <Field label="DC Number" value={header.dc_number} />
                    <Field label="DC Date" value={header.dc_date} />
                    <Field label="PO Number" value={header.po_number} />
                    <Field label="Department No" value={header.department_no} />
                </div>
            </div>

            {/* Consignee Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Consignee Details</h2>
                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <Field label="Consignee Name" value={header.consignee_name} />
                    </div>
                    <Field label="Consignee GSTIN" value={header.consignee_gstin} />
                    <Field label="Inspection Company" value={header.inspection_company} />
                    <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Consignee Address</label>
                        <div className="text-sm text-gray-900 whitespace-pre-line">{header.consignee_address || '-'}</div>
                    </div>
                </div>
            </div>

            {/* Transport Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Transport Details</h2>
                <div className="grid grid-cols-3 gap-6">
                    <Field label="Mode of Transport" value={header.mode_of_transport} />
                    <Field label="Vehicle Number" value={header.vehicle_no} />
                    <Field label="Transporter" value={header.transporter} />
                    <Field label="LR Number" value={header.lr_no} />
                    <Field label="E-Way Bill Number" value={header.eway_bill_no} />
                </div>
            </div>

            {/* Items Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Items Dispatched</h2>
                {items && items.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item No</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispatch Qty</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HSN Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HSN Rate %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {items.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.po_item_no}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{item.material_code}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{item.material_description}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{item.unit}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{item.dispatch_qty}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">₹{item.po_rate?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{item.hsn_code || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{item.hsn_rate || '-'}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 text-center py-8">
                        No items found for this DC
                    </div>
                )}
            </div>

            {/* Remarks */}
            {header.remarks && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Remarks / Notes</h2>
                    <div className="text-sm text-gray-900 whitespace-pre-line">{header.remarks}</div>
                </div>
            )}
        </div>
    );
}
