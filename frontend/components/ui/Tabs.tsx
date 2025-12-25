import React from 'react';

interface Tab {
    id: string;
    label: string;
    icon?: React.ElementType;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, className = "" }) => {
    return (
        <div className={`flex items-center gap-1 border-b border-slate-100 ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative
            ${activeTab === tab.id
                            ? 'text-indigo-600'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    {tab.icon && <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-slate-400'}`} />}
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                    )}
                </button>
            ))}
        </div>
    );
};

export default Tabs;
