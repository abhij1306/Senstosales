/**
 * Date-Wise Summary Controls
 * Compact controls row for entity selection, date picking, and actions
 */

"use client";

import { useState } from 'react';
import { Calendar, Download, Eye } from 'lucide-react';

interface DateSummaryControlsProps {
    onViewSummary: (entity: string, startDate: string, endDate: string) => void;
    onExport: () => void;
    exportEnabled: boolean;
    loading: boolean;
}

export default function DateSummaryControls({
    onViewSummary,
    onExport,
    exportEnabled,
    loading
}: DateSummaryControlsProps) {
    const [entity, setEntity] = useState('po');
    const [startDate, setStartDate] = useState('2019-01-01');
    const [endDate, setEndDate] = useState('2019-12-31');

    const handleView = () => {
        onViewSummary(entity, startDate, endDate);
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Entity Dropdown */}
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-text-secondary">Summary Type:</label>
                <select
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg text-sm font-medium text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                    <option value="po">PO Summary</option>
                    <option value="challan">Challan Summary</option>
                    <option value="invoice">Invoice Summary</option>
                </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-secondary" />
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg text-sm text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-text-secondary">to</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg text-sm text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto">
                <button
                    onClick={handleView}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Eye className="w-4 h-4" />
                    View Summary
                </button>
                <button
                    onClick={onExport}
                    disabled={!exportEnabled || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Download Excel
                </button>
            </div>
        </div>
    );
}
