import React, { useState } from 'react';
import { Search, Mic, Send, Sparkles } from 'lucide-react';

interface AICommandPanelProps {
    onVoiceStart: () => void;
    onSubmit: (query: string) => void;
    children?: React.ReactNode;
}

export function AICommandPanel({ onVoiceStart, onSubmit, children }: AICommandPanelProps) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSubmit(query);
            setQuery('');
        }
    };

    const suggestions = [
        { text: "Pending BHEL POs", icon: "📦", color: "orange" },
        { text: "Bhopal Delivery Schedule", icon: "🚚", color: "teal" },
        { text: "Monthly Revenue", icon: "📊", color: "primary" }
    ];

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900/50 rounded-2xl p-1 shadow-sm border border-indigo-100 dark:border-slate-700 mb-10 ring-1 ring-black/5">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: AI Input */}
                    <div className="lg:col-span-8 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                Senstographic AI
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-xl">
                                Your personal data analyst. Ask natural questions about your BHEL Purchase Orders, stock availability, or Bhopal delivery schedules.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Search Input */}
                            <form onSubmit={handleSubmit} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-indigo-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-200 blur"></div>
                                <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center p-1.5 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                                    <div className="p-2 text-slate-400">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="w-full border-none bg-transparent focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 text-sm h-10 outline-none"
                                        placeholder="Ask anything... e.g., 'Draft a DC for BHEL PO #4500 items ready for dispatch'"
                                    />
                                    <button
                                        type="button"
                                        onClick={onVoiceStart}
                                        className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex items-center justify-center mr-1"
                                        title="Voice Mode"
                                    >
                                        <Mic className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="submit"
                                        className="p-2.5 bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>

                            {/* Quick Ask Chips */}
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider py-1.5">
                                    Quick Ask:
                                </span>
                                {suggestions.map((s, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setQuery(s.text);
                                            onSubmit(s.text);
                                        }}
                                        className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-sm"
                                    >
                                        <span>{s.icon}</span>
                                        {s.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: AI Insights */}
                    <div className="lg:col-span-4 border-l border-slate-200 dark:border-slate-700/50 pl-0 lg:pl-8 pt-6 lg:pt-0">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
