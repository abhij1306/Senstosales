import React from 'react';
import { AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';

interface Insight {
    type: 'warning' | 'success' | 'info';
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface AIInsightsPanelProps {
    insights: Insight[];
}

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case 'success':
                return <TrendingUp className="w-5 h-5 text-teal-500" />;
            default:
                return <TrendingUp className="w-5 h-5 text-blue-500" />;
        }
    };

    const getBorderColor = (type: string) => {
        switch (type) {
            case 'warning':
                return 'border-l-orange-500';
            case 'success':
                return 'border-l-teal-500';
            default:
                return 'border-l-blue-500';
        }
    };

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    AI Insights
                </h3>
                <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
            </div>

            <div className="space-y-3">
                {insights.map((insight, idx) => (
                    <div
                        key={idx}
                        className={`bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group border-l-4 ${getBorderColor(insight.type)}`}
                    >
                        <div className="flex gap-3">
                            <div className="mt-0.5">{getIcon(insight.type)}</div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {insight.title}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                                    {insight.description}
                                </p>
                                {insight.action && (
                                    <button
                                        onClick={insight.action.onClick}
                                        className="text-[10px] font-medium text-primary mt-2 hover:underline flex items-center gap-1"
                                    >
                                        {insight.action.label}
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
