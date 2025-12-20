import React from 'react';
import { DollarSign, Package, Truck, Handshake, Clock, Grid3x3 } from 'lucide-react';

interface ReportCard {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    formats: string[];
    onGenerate: (format: string) => void;
}

interface ReportCardsGridProps {
    reports: ReportCard[];
}

export function ReportCardsGrid({ reports }: ReportCardsGridProps) {
    const getIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            'dollar': DollarSign,
            'package': Package,
            'truck': Truck,
            'handshake': Handshake,
            'clock': Clock,
            'grid': Grid3x3
        };
        const Icon = icons[iconName] || Package;
        return <Icon className="w-6 h-6" />;
    };

    const getColorClasses = (color: string) => {
        const colors: Record<string, string> = {
            'green': 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
            'orange': 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
            'teal': 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
            'pink': 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
            'red': 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
            'indigo': 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
        };
        return colors[color] || colors['green'];
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reports.map((report) => (
                <div
                    key={report.id}
                    className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group relative"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(report.color)}`}>
                            {getIcon(report.icon)}
                        </div>
                    </div>

                    <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-1">
                        {report.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 flex-1">
                        {report.description}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 flex gap-2">
                        {report.formats.length > 1 && (
                            <button
                                onClick={() => report.onGenerate(report.formats[0])}
                                className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700"
                            >
                                {report.formats[0].toUpperCase()}
                            </button>
                        )}
                        <button
                            onClick={() => report.onGenerate(report.formats[report.formats.length - 1])}
                            className="flex-1 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                            Generate
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
