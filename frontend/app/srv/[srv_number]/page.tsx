'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { ArrowLeft, FileText, Package } from 'lucide-react';

interface SRVHeader {
    srv_number: string;
    srv_date: string;
    po_number: string;
    srv_status: string;
    created_at: string;
}

interface SRVItem {
    id: number;
    po_item_no: number;
    lot_no: number | null;
    received_qty: number;
    rejected_qty: number;
    challan_no: string | null;
    invoice_no: string | null;
    remarks: string | null;
}

interface SRVDetail {
    header: SRVHeader;
    items: SRVItem[];
}

export default function SRVDetailPage({ params }: { params: Promise<{ srv_number: string }> }) {
    const { srv_number } = use(params);
    const [srv, setSrv] = useState<SRVDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSRVDetail();
    }, [srv_number]);

    const loadSRVDetail = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/srv/${srv_number}`);
            const data = await response.json();
            setSrv(data);
        } catch (error) {
            console.error('Error loading SRV detail:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <p className="text-gray-500">Loading SRV details...</p>
            </div>
        );
    }

    if (!srv) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <p className="text-gray-500">SRV not found</p>
            </div>
        );
    }

    const totalReceived = srv.items.reduce((sum, item) => sum + item.received_qty, 0);
    const totalRejected = srv.items.reduce((sum, item) => sum + item.rejected_qty, 0);
    const rejectionRate = totalReceived + totalRejected > 0
        ? ((totalRejected / (totalReceived + totalRejected)) * 100).toFixed(2)
        : '0.00';

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <a
                        href="/srv"
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </a>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">SRV {srv.header.srv_number}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Created on {srv.header.created_at ? new Date(srv.header.created_at).toLocaleDateString() : srv.header.srv_date}
                        </p>
                    </div>
                </div>

                {/* SRV Header Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">SRV Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">SRV Number</p>
                            <p className="text-sm font-medium text-gray-900">{srv.header.srv_number}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">SRV Date</p>
                            <p className="text-sm font-medium text-gray-900">{srv.header.srv_date}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">PO Number</p>
                            <a
                                href={`/po/${srv.header.po_number}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                                {srv.header.po_number}
                            </a>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {srv.header.srv_status}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Received</p>
                            <p className="text-sm font-medium text-green-600">{totalReceived.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Rejected</p>
                            <p className="text-sm font-medium text-red-600">{totalRejected.toFixed(2)} ({rejectionRate}%)</p>
                        </div>
                    </div>
                </div>

                {/* SRV Items Table */}
                <div className="bg-white rounded-xl border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                        <Package className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">SRV Items</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Item No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot No</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Received Qty</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rejected Qty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Challan No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {srv.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.po_item_no}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{item.lot_no || '-'}</td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                                            {item.received_qty.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-red-600">
                                            {item.rejected_qty.toFixed(2)}
                                            {item.rejected_qty > 0 && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                                                    {((item.rejected_qty / (item.received_qty + item.rejected_qty)) * 100).toFixed(1)}%
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{item.challan_no || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{item.invoice_no || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{item.remarks || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
