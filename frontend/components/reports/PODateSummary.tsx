/**
 * PO Date Summary Table
 * Displays PO summary with totals
 */

"use client";

import { useState } from "react";
import PaginationControls from "@/components/ui/PaginationControls";
import DownloadButton from "@/components/DownloadButton";
import { API_BASE_URL } from "@/lib/api";

interface PORow {
    po_number: string;
    po_date: string;
    total_ordered: number;
    total_dispatched: number;
    pending_qty: number;
    status: string;
}

interface PODateSummaryProps {
    data: {
        rows: PORow[];
        totals: {
            total_pos: number;
            total_ordered: number;
            total_dispatched: number;
            total_pending: number;
        };
        period: { start: string; end: string };
    };
}

export default function PODateSummary({ data }: PODateSummaryProps) {
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
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-[16px] font-semibold text-text-primary">
                    PO Summary ({data.period.start} to {data.period.end})
                </h3>
                <DownloadButton
                    url={`${API_BASE_URL}/api/smart-reports/date-summary/export?entity=po&start_date=${data.period.start}&end_date=${data.period.end}`}
                    filename={`PO_Summary_${data.period.start}_to_${data.period.end}.xlsx`}
                    label="Export"
                    size="sm"
                />
            </div>

            {/* Totals */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-text-secondary">Total POs</p>
                    <p className="text-xl font-bold text-text-primary">{data.totals.total_pos}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-text-secondary">Total Ordered</p>
                    <p className="text-xl font-bold text-text-primary">{data.totals.total_ordered.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-text-secondary">Total Dispatched</p>
                    <p className="text-xl font-bold text-text-primary">{data.totals.total_dispatched.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-text-secondary">Total Pending</p>
                    <p className="text-xl font-bold text-text-primary">{data.totals.total_pending.toLocaleString()}</p>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">PO Number</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">PO Date</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Ordered</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Dispatched</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Pending</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRows.map((row, idx) => (
                            <tr key={idx} className="border-b border-border/50 hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium text-text-primary">{row.po_number}</td>
                                <td className="py-3 px-4 text-text-secondary">{row.po_date}</td>
                                <td className="py-3 px-4 text-right text-text-primary">{row.total_ordered.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right text-text-primary">{row.total_dispatched.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right text-text-primary">{row.pending_qty.toLocaleString()}</td>
                                <td className="py-3 px-4">
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${row.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                        row.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {row.status}
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
                itemName="POs"
            />
        </div>
    );
}
