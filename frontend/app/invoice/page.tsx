"use client";

import { useEffect, useState } from "react";
import { api, InvoiceListItem } from "@/lib/api";

export default function InvoicePage() {
    const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.listInvoices()
            .then(data => {
                setInvoices(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load invoices:", err);
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
                <h1 className="text-2xl font-semibold text-gray-900">GST Invoices</h1>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Invoice Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                PO Numbers
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Value
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                            <tr key={invoice.invoice_number} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {invoice.invoice_number}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {invoice.invoice_date}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {invoice.po_numbers || "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {invoice.total_invoice_value
                                        ? `₹${invoice.total_invoice_value.toLocaleString()}`
                                        : "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {invoices.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No invoices found.
                    </div>
                )}
            </div>
        </div>
    );
}
