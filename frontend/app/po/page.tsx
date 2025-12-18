"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, POListItem } from "@/lib/api";
import { Upload, Plus } from "lucide-react";

export default function POPage() {
    const [pos, setPOs] = useState<POListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadPOs();
    }, []);

    const loadPOs = async () => {
        try {
            const data = await api.listPOs();
            setPOs(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to load POs:", err);
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            await api.uploadPOHTML(file);
            await loadPOs(); // Reload list
            alert("PO uploaded successfully!");
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to upload PO");
        } finally {
            setUploading(false);
            e.target.value = ""; // Reset input
        }
    };

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
                <h1 className="text-2xl font-semibold text-gray-900">Purchase Orders</h1>
                <div className="flex gap-3">
                    <label className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        {uploading ? "Uploading..." : "Upload PO HTML"}
                        <input
                            type="file"
                            accept=".html"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                PO Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Supplier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Value
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amendment
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {pos.map((po) => (
                            <tr key={po.po_number} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link
                                        href={`/po/${po.po_number}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        {po.po_number}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {po.po_date || "-"}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {po.supplier_name || "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {po.po_value ? `₹${po.po_value.toLocaleString()}` : "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {po.amend_no || 0}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {pos.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No purchase orders found. Upload a PO HTML file to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
