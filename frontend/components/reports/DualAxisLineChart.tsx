import React from 'react';

interface TrendData {
    month: string;
    ordered_value: number;
    invoiced_value: number;
}

interface DualAxisChartProps {
    data: TrendData[];
}

export function DualAxisLineChart({ data }: DualAxisChartProps) {
    if (!data || data.length === 0) return null;

    // Calculate scales
    const maxOrdered = Math.max(...data.map(d => d.ordered_value));
    const maxInvoiced = Math.max(...data.map(d => d.invoiced_value));
    const scaleOrdered = maxOrdered > 0 ? 100 / maxOrdered : 1;
    const scaleInvoiced = maxInvoiced > 0 ? 100 / maxInvoiced : 1;

    // Generate SVG path for line charts
    const generatePath = (values: number[], scale: number) => {
        const width = 100;
        const step = width / (values.length - 1 || 1);

        return values.map((val, idx) => {
            const x = idx * step;
            const y = 100 - (val * scale);
            return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    };

    const orderedPath = generatePath(data.map(d => d.ordered_value), scaleOrdered);
    const invoicedPath = generatePath(data.map(d => d.invoiced_value), scaleInvoiced);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Sales vs Dispatch Trends</h3>
                <div className="flex items-center gap-3 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-blue-500"></div> Ordered
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-green-500"></div> Invoiced
                    </div>
                </div>
            </div>

            <div className="relative h-48 w-full">
                {/* Grid lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />

                    {/* Ordered line */}
                    <path
                        d={orderedPath}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Invoiced line */}
                    <path
                        d={invoicedPath}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Data points */}
                    {data.map((d, idx) => {
                        const x = (idx / (data.length - 1 || 1)) * 100;
                        const yOrdered = 100 - (d.ordered_value * scaleOrdered);
                        const yInvoiced = 100 - (d.invoiced_value * scaleInvoiced);

                        return (
                            <g key={idx}>
                                <circle cx={x} cy={yOrdered} r="1.5" fill="#3b82f6" vectorEffect="non-scaling-stroke" />
                                <circle cx={x} cy={yInvoiced} r="1.5" fill="#10b981" vectorEffect="non-scaling-stroke" />
                            </g>
                        );
                    })}
                </svg>

                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[9px] text-gray-400 font-medium">
                    {months.map((month, idx) => (
                        <span key={idx} className={data[idx] ? 'opacity-100' : 'opacity-30'}>
                            {month}
                        </span>
                    ))}
                </div>
            </div>

            {/* AI Insight */}
            <div className="mt-3 p-2 bg-blue-50/50 rounded text-[10px] text-blue-800 flex items-start gap-1.5">
                <span className="font-semibold shrink-0">💡</span>
                <p>
                    Invoicing trails orders by 12% this quarter. Consider expediting dispatch for pending items.
                </p>
            </div>
        </div>
    );
}
