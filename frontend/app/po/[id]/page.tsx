"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, PODetail } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function PODetailPage() {
    const params = useParams();
    const poNumber = parseInt(params.id as string);
    const [po, setPO] = useState<PODetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (poNumber) {
            api.getPODetail(poNumber)
                .then(data => {
                    setPO(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to load PO:", err);
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

    if (!po) {
        return (
            <div className="p-8">
                <div className="text-center text-gray-500">PO not found</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <Link
                href="/po"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Purchase Orders
            </Link>

            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
                PO #{po.header.po_number}
            </h1>

            {/* Header Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Header Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <div className="text-sm text-gray-500">PO Date</div>
                        <div className="font-medium text-gray-900">{po.header.po_date || "-"}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Supplier</div>
                        <div className="font-medium text-gray-900">{po.header.supplier_name || "-"}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Supplier Code</div>
                        <div className="font-medium text-gray-900">{po.header.supplier_code || "-"}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">PO Value</div>
                        <div className="font-medium text-gray-900">
                            {po.header.po_value ? `₹${po.header.po_value.toLocaleString()}` : "-"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Item No
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Material Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Rate
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Value
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {po.items.map((item) => (
                            <tr key={item.po_item_no}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.po_item_no}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.material_code || "-"}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {item.material_description || "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.ord_qty || "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.po_rate ? `₹${item.po_rate.toLocaleString()}` : "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.item_value ? `₹${item.item_value.toLocaleString()}` : "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
