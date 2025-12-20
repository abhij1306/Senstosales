/**
 * Invoice Date Summary Table
 */

"use client";

interface InvoiceRow {
    invoice_number: string;
    invoice_date: string;
    linked_dc_numbers: string;
    invoice_value: number;
}

interface InvoiceDateSummaryProps {
    data: {
        rows: InvoiceRow[];
        totals: {
            total_invoices: number;
            total_value: number;
            avg_value: number;
        };
        period: { start: string; end: string };
    };
}

export default function InvoiceDateSummary({ data }: InvoiceDateSummaryProps) {
    if (!data || !data.rows || data.rows.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <p className="text-text-secondary">No data for selected period</p>
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <h3 className="text-[16px] font-semibold text-text-primary mb-4">
                Invoice Summary ({data.period.start} to {data.period.end})
            </h3>

            {/* Totals */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-text-secondary">Total Invoices</p>
                    <p className="text-xl font-bold text-text-primary">{data.totals.total_invoices}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-text-secondary">Total Value</p>
                    <p className="text-xl font-bold text-text-primary">₹{(data.totals.total_value / 100000).toFixed(2)}L</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-text-secondary">Average Value</p>
                    <p className="text-xl font-bold text-text-primary">₹{(data.totals.avg_value / 1000).toFixed(1)}K</p>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Invoice Number</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Invoice Date</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Linked DC Numbers</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Invoice Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((row, idx) => (
                            <tr key={idx} className="border-b border-border/50 hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium text-text-primary">{row.invoice_number}</td>
                                <td className="py-3 px-4 text-text-secondary">{row.invoice_date}</td>
                                <td className="py-3 px-4 text-text-primary">{row.linked_dc_numbers}</td>
                                <td className="py-3 px-4 text-right text-text-primary font-medium">₹{row.invoice_value.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
