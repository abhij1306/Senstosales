interface KpiCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
}

export default function KpiCard({ title, value, subtitle }: KpiCardProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
            <div className="text-3xl font-semibold text-gray-900">{value}</div>
            {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
        </div>
    );
}
