"use client";

import { useEffect, useState } from "react";
import { api, DCListItem } from "@/lib/api";

export default function DCPage() {
    const [dcs, setDCs] = useState<DCListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.listDCs()
            .then(data => {
                setDCs(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load DCs:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Delivery Challans</h1>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                DC Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                PO Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Consignee
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {dcs.map((dc) => (
                            <tr key={dc.dc_number} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {dc.dc_number}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {dc.dc_date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {dc.po_number || "-"}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {dc.consignee_name || "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {dcs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No delivery challans found.
                    </div>
                )}
            </div>
        </div>
    );
}
