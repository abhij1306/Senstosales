import React, { useState } from 'react';
import { Search, Mic, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface CollapsibleVoiceHeaderProps {
    onVoiceStart: () => void;
    onSearch: (query: string) => void;
}

export function CollapsibleVoiceHeader({ onVoiceStart, onSearch }: CollapsibleVoiceHeaderProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
            setIsExpanded(false);
        }
    };

    const suggestions = [
        "Monthly summary",
        "Pending issues",
        "Uninvoiced challans",
        "Compare quarters"
    ];

    return (
        <div className="bg-white border-b border-gray-200 transition-all duration-200">
            {/* Compact Header */}
            <div className="px-6 py-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-semibold text-gray-900">Reports & Analytics</h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* Compact Search */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        <span className="text-xs">Ask anything...</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <button
                        onClick={onVoiceStart}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        title="Voice Mode"
                    >
                        <Mic className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Expanded Search Bar */}
            {isExpanded && (
                <div className="px-6 pb-3 animate-in slide-in-from-top-2 duration-200">
                    <form onSubmit={handleSubmit} className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask about orders, dispatch, billing..."
                            className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={onVoiceStart}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-blue-600"
                        >
                            <Mic className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        <div className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Suggested:</span>
                        </div>
                        {suggestions.map((s) => (
                            <button
                                key={s}
                                onClick={() => {
                                    onSearch(s);
                                    setIsExpanded(false);
                                }}
                                className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-[10px] font-medium text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
