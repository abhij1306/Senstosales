"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextType {
    toast: (title: string, message?: string, type?: ToastType) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, title, message, type }]);

        // Auto dismiss after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const helpers = {
        toast: (title: string, message?: string, type: ToastType = 'info') => addToast(title, message, type),
        success: (title: string, message?: string) => addToast(title, message, 'success'),
        error: (title: string, message?: string) => addToast(title, message, 'error'),
    };

    return (
        <ToastContext.Provider value={helpers}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            "pointer-events-auto min-w-[300px] max-w-sm rounded-lg shadow-lg border p-4 flex gap-3 transform transition-all duration-300 animate-in slide-in-from-right-12 fade-in",
                            t.type === 'success' && "bg-emerald-50 border-emerald-100 text-emerald-900",
                            t.type === 'error' && "bg-red-50 border-red-100 text-red-900",
                            t.type === 'warning' && "bg-amber-50 border-amber-100 text-amber-900",
                            t.type === 'info' && "bg-blue-50 border-blue-100 text-blue-900",
                        )}
                    >
                        <div className="shrink-0 mt-0.5">
                            {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                            {t.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600" />}
                            {t.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm">{t.title}</h4>
                            {t.message && <p className="text-xs opacity-90 mt-0.5">{t.message}</p>}
                        </div>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
