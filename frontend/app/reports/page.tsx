"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState("reconciliation");
    const [reconciliationData, setReconciliationData] = useState<any[]>([]);
    const [dcWithoutInvoice, setDcWithoutInvoice] = useState<any[]>([]);
    const [supplierSummary, setSupplierSummary] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadReportData();
    }, [activeReport]);

    const loadReportData = async () => {
        setLoading(true);
        try {
            if (activeReport === "reconciliation") {
                const data = await api.getReport("po-dc-invoice-reconciliation");
                setReconciliationData(data);
            } else if (activeReport === "dc-without-invoice") {
                const data = await api.getReport("dc-without-invoice");
                setDcWithoutInvoice(data);
            } else if (activeReport === "supplier-summary") {
                const data = await api.getReport("supplier-summary");
                setSupplierSummary(data);
            }
        } catch (err) {
            console.error("Failed to load report:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Reports</h1>

            {/* Report Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveReport("reconciliation")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeReport === "reconciliation"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                >
                    PO-DC Reconciliation
                </button>
                <button
                    onClick={() => setActiveReport("dc-without-invoice")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeReport === "dc-without-invoice"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                >
                    DCs Without Invoice
                </button>
                <button
                    onClick={() => setActiveReport("supplier-summary")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeReport === "supplier-summary"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                >
                    Supplier Summary
                </button>
            </div>

            {loading && (
                <div className="text-center py-12 text-gray-500">Loading report...</div>
            )}

            {/* PO-DC Reconciliation Report */}
            {!loading && activeReport === "reconciliation" && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispatched</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reconciliationData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.po_number}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{row.po_item_no}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{row.material_description || row.material_code}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{row.ord_qty}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{row.dispatched_qty}</td>
                                    <td className={`px-6 py-4 text-sm font-medium ${row.pending_qty > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                        {row.pending_qty}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {reconciliationData.length === 0 && (
                        <div className="text-center py-12 text-gray-500">No data available</div>
                    )}
                </div>
            )}

            {/* DCs Without Invoice Report */}
            {!loading && activeReport === "dc-without-invoice" && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DC Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DC Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consignee</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {dcWithoutInvoice.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.dc_number}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{row.dc_date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{row.po_number || "-"}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{row.consignee_name || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {dcWithoutInvoice.length === 0 && (
                        <div className="text-center py-12 text-gray-500">All DCs have been invoiced!</div>
                    )}
                </div>
            )}

            {/* Supplier Summary Report */}
            {!loading && activeReport === "supplier-summary" && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Count</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last PO Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {supplierSummary.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.supplier_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{row.po_count}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        ₹{(row.total_po_value || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{row.last_po_date || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {supplierSummary.length === 0 && (
                        <div className="text-center py-12 text-gray-500">No supplier data available</div>
                    )}
                </div>
            )}
        </div>
    );
}
