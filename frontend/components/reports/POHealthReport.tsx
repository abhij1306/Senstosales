/**
 * PO Health Summary Report Component
 * Displays one row per PO with complete status
 */

import { AlertTriangle, CheckCircle, Clock, Package } from 'lucide-react';

interface POHealthData {
    period: string;
    summary: {
        total_pos: number;
        not_started: number;
        partially_dispatched: number;
        fully_dispatched: number;
    };
    pos: Array<{
        po_number: string;
        supplier_name: string;
        po_date: string;
        po_value: number;
        ordered_qty: number;
        dispatched_qty: number;
        pending_qty: number;
        po_age_days: number;
        fulfillment_status: string;
        invoice_status: string;
        fulfillment_pct: number;
    }>;
}

interface POHealthReportProps {
    data: POHealthData;
    aiSummary: string;
    onGeneratePDF: () => void;
}

export default function POHealthReport({ data, aiSummary, onGeneratePDF }: POHealthReportProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'FULLY_DISPATCHED': return 'text-success bg-success/10';
            case 'PARTIALLY_DISPATCHED': return 'text-warning bg-warning/10';
            case 'NOT_STARTED': return 'text-danger bg-danger/10';
            default: return 'text-text-secondary bg-gray-100';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-[18px] font-semibold text-text-primary">PO Health Summary</h2>
                <p className="text-[12px] text-text-secondary mt-1">Period: {data.period}</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="glass-card p-4">
                    <p className="text-[11px] text-text-secondary uppercase">Total POs</p>
                    <p className="text-[24px] font-bold text-text-primary mt-1">{data.summary.total_pos}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-[11px] text-text-secondary uppercase">Not Started</p>
                    <p className="text-[24px] font-bold text-danger mt-1">{data.summary.not_started}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-[11px] text-text-secondary uppercase">Partial</p>
                    <p className="text-[24px] font-bold text-warning mt-1">{data.summary.partially_dispatched}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-[11px] text-text-secondary uppercase">Complete</p>
                    <p className="text-[24px] font-bold text-success mt-1">{data.summary.fully_dispatched}</p>
                </div>
            </div>

            {/* AI Summary */}
            {aiSummary && (
                <div className="glass-card p-4 bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary text-lg">✨</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-[12px] font-semibold text-text-primary mb-1">AI Insight</p>
                            <p className="text-[13px] text-text-secondary leading-relaxed">{aiSummary}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* PO Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase">PO Number</th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase">Supplier</th>
                                <th className="px-4 py-3 text-right text-[11px] font-semibold text-text-secondary uppercase">Ordered</th>
                                <th className="px-4 py-3 text-right text-[11px] font-semibold text-text-secondary uppercase">Dispatched</th>
                                <th className="px-4 py-3 text-right text-[11px] font-semibold text-text-secondary uppercase">Pending</th>
                                <th className="px-4 py-3 text-right text-[11px] font-semibold text-text-secondary uppercase">Age (Days)</th>
                                <th className="px-4 py-3 text-center text-[11px] font-semibold text-text-secondary uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-[11px] font-semibold text-text-secondary uppercase">Fulfillment %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.pos.slice(0, 20).map((po) => (
                                <tr key={po.po_number} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-[13px] font-medium text-text-primary">{po.po_number}</td>
                                    <td className="px-4 py-3 text-[12px] text-text-secondary truncate max-w-[200px]">{po.supplier_name}</td>
                                    <td className="px-4 py-3 text-[13px] text-text-primary text-right">{po.ordered_qty.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-[13px] text-text-primary text-right">{po.dispatched_qty.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-[13px] font-medium text-warning text-right">{po.pending_qty.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-[13px] text-text-secondary text-right">{po.po_age_days}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${getStatusColor(po.fulfillment_status)}`}>
                                            {po.fulfillment_status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[13px] text-text-primary text-right">{po.fulfillment_pct}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data.pos.length > 20 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-border text-center">
                        <p className="text-[12px] text-text-secondary">Showing 20 of {data.pos.length} POs</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={onGeneratePDF}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 transition-colors"
                >
                    Generate PDF
                </button>
                <button className="px-4 py-2 bg-white border border-border text-text-primary rounded-lg text-[13px] font-medium hover:bg-gray-50 transition-colors">
                    Export Excel
                </button>
            </div>
        </div>
    );
}
