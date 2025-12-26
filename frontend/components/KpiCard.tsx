import { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
}

export default function KpiCard({
  title,
  value,
  icon,
  iconBg = "bg-gray-100",
  iconColor = "text-gray-600",
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        {icon && (
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}
          >
            <div className={iconColor}>{icon}</div>
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
