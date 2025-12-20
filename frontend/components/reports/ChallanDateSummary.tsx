/**
 * Challan Date Summary Table
 */

"use client";

import { useState } from "react";
import PaginationControls from "@/components/ui/PaginationControls";

interface ChallanRow {
    dc_number: string;
    dc_date: string;
    po_number: string;
    dispatched_qty: number;
    invoice_status: string;
}

interface ChallanDateSummaryProps {
    data: {
        rows: ChallanRow[];
        totals: {
            total_challans: number;
            total_dispatched: number;
            uninvoiced_count: number;
        };
        period: { start: string; end: string };
    };
}

export default function ChallanDateSummary({ data }: ChallanDateSummaryProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    if (!data || !data.rows || data.rows.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <p className="text-text-secondary">No data for selected period</p>
            </div>
        );
    }

    const totalPages = Math.ceil(data.rows.length / ITEMS_PER_PAGE);
    const paginatedRows = data.rows.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="glass-card p-6">
            <h3 className="text-[16px] font-semibold text-text-primary mb-4">
                Challan Summary ({data.period.start} to {data.period.end})
            </h3>

            {/* Totals */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-text-secondary">Total Challans</p>
                    <p className="text-xl font-bold text-text-primary">{data.totals.total_challans}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-text-secondary">Total Dispatched</p>
                    <p className="text-xl font-bold text-text-primary">{data.totals.total_dispatched.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-text-secondary">Uninvoiced</p>
                    <p className="text-xl font-bold text-text-primary">{data.totals.uninvoiced_count}</p>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">DC Number</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">DC Date</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Linked PO</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Dispatched Qty</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Invoice Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRows.map((row, idx) => (
                            <tr key={idx} className="border-b border-border/50 hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium text-text-primary">{row.dc_number}</td>
                                <td className="py-3 px-4 text-text-secondary">{row.dc_date}</td>
                                <td className="py-3 px-4 text-text-primary">{row.po_number}</td>
                                <td className="py-3 px-4 text-right text-text-primary">{row.dispatched_qty.toLocaleString()}</td>
                                <td className="py-3 px-4">
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${row.invoice_status === 'Invoiced' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {row.invoice_status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemName="DC's"
            />
        </div>
    );
}
