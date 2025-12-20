"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { api } from '@/lib/api';

import { ReconciliationItem } from "@/lib/api";

interface LocalReconciliationData {
    po_number: number;
    fulfillment_rate: number;
    total_ordered: number;
    total_dispatched: number;
    total_pending: number;
    items: ReconciliationItem[];
}

export default function POReconciliationPage() {
    const params = useParams();
    const poNumber = parseInt(params.id as string);
    const [data, setData] = useState<LocalReconciliationData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (poNumber) {
            api.getReconciliation(poNumber)
                .then((items: ReconciliationItem[]) => {
                    // Calculate stats
                    const total_ordered = items.reduce((sum, item) => sum + (item.ordered_quantity || 0), 0);
                    const total_dispatched = items.reduce((sum, item) => sum + (item.dispatched_quantity || 0), 0);
                    const total_pending = items.reduce((sum, item) => sum + (item.pending_quantity || 0), 0);
                    const fulfillment_rate = total_ordered > 0
                        ? parseFloat(((total_dispatched / total_ordered) * 100).toFixed(1))
                        : 0;

                    setData({
                        po_number: poNumber,
                        fulfillment_rate,
                        total_ordered,
                        total_dispatched,
                        total_pending,
                        items
                    });
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to load reconciliation:", err);
                    setLoading(false);
                });
        }
    }, [poNumber]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8">
                <div className="text-center text-gray-500">Reconciliation data not found</div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "complete": return "text-green-600 bg-green-50";
            case "partial": return "text-orange-600 bg-orange-50";
            case "not_started": return "text-gray-600 bg-gray-50";
            case "over_dispatched": return "text-red-600 bg-red-50";
            default: return "text-gray-600 bg-gray-50";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "complete": return "Complete";
            case "partial": return "Partial";
            case "not_started": return "Not Started";
            case "over_dispatched": return "Over Dispatched";
            default: return status;
        }
    };

    return (
        <div className="p-8">
            <Link
                href={`/po/${poNumber}`}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to PO Detail
            </Link>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">PO #{poNumber} Reconciliation</h1>
                    <p className="text-sm text-gray-500 mt-1">Ordered vs Dispatched Tracking</p>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <div>
                        <div className="text-sm text-gray-600">Fulfillment Rate</div>
                        <div className="text-2xl font-semibold text-blue-600">{data.fulfillment_rate}%</div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-sm text-gray-500">{data.total_dispatched} / {data.total_ordered} units</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${data.fulfillment_rate}%` }}
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Total Ordered</div>
                    <div className="text-2xl font-semibold text-gray-900 mt-1">{data.total_ordered}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Total Dispatched</div>
                    <div className="text-2xl font-semibold text-green-600 mt-1">{data.total_dispatched}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Pending</div>
                    <div className="text-2xl font-semibold text-orange-600 mt-1">{data.total_pending}</div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Item-wise Reconciliation</h2>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispatched</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.items.map((item) => {
                            const progress = (item.ordered_quantity || 0) > 0 ? ((item.dispatched_quantity || 0) / (item.ordered_quantity || 0) * 100) : 0;
                            // Mocking status since it's not in new type? Or check if API returns it. 
                            // Type defines: po_number, po_date... but NOT status?
                            // Wait, ReconciliationItem in types/index.ts does NOT have status.
                            // I need to derive status or add it to type if backend sends it.
                            // For now, derive status.
                            let status = 'not_started';
                            if (progress >= 100) status = 'complete';
                            else if (progress > 0) status = 'partial';

                            return (
                                <tr key={`${item.po_number}-${item.po_item_no}`} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.po_item_no}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        <div className="font-medium">{item.material_code}</div>
                                        <div className="text-gray-500 text-xs">{item.material_description}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{item.ordered_quantity}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-green-600">{item.dispatched_quantity}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-orange-600">{item.pending_quantity}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(status)}`}>
                                            {getStatusLabel(status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${progress >= 100 ? 'bg-green-600' :
                                                    progress > 0 ? 'bg-orange-600' : 'bg-gray-400'
                                                    }`}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
