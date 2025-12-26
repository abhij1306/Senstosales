import React, { useState } from "react";
import { Mic, Search, Sparkles } from "lucide-react";

interface CommandBarProps {
  onVoiceStart: () => void;
  onSearch: (query: string) => void;
}

export function CommandBar({ onVoiceStart, onSearch }: CommandBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  const suggestions = [
    "Monthly summary",
    "Pending issues",
    "Uninvoiced challans",
    "Compare quarters",
  ];

  return (
    <div className="relative mb-8">
      {/* Main Input */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything about orders, dispatch, or billing..."
          className="w-full pl-12 pr-14 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
        />

        {/* Voice Button */}
        <button
          type="button"
          onClick={onVoiceStart}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-xl transition-colors text-primary"
          title="Start Voice Mode"
        >
          <Mic className="w-6 h-6" />
        </button>
      </form>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mt-3 px-1">
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-primary/70">
          <Sparkles className="w-3 h-3" />
          <span>Suggested:</span>
        </div>
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSearch(s)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
