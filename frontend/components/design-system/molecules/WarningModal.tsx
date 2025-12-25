"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../atoms/Button';
import { H2, Body } from '../atoms/Typography';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from "@/lib/utils";

/**
 * WarningModal Molecule - Atomic Design System v1.0
 * Critical for destructive actions (e.g., DB reset)
 * Must block user interaction until decision made
 */

export interface WarningModalProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: 'default' | 'destructive';
}

export const WarningModal: React.FC<WarningModalProps> = ({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    confirmVariant = "destructive"
}) => {
    const [isVisible, setIsVisible] = useState(open);

    useEffect(() => {
        setIsVisible(open);

        // Lock body scroll when modal is open
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    // Handle Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) {
                onCancel();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [open, onCancel]);

    if (!isVisible) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="warning-modal-title"
        >
            <div
                className={cn(
                    "relative bg-white rounded-lg shadow-lg",
                    "w-full max-w-md mx-4 p-6",
                    "animate-in fade-in zoom-in-95 duration-200"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-[#6B7280] hover:text-[#111827] transition-colors"
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#DC2626]/10 mb-4">
                    <AlertTriangle size={24} className="text-[#DC2626]" />
                </div>

                {/* Content */}
                <H2 id="warning-modal-title" className="mb-2">
                    {title}
                </H2>
                <Body className="text-[#6B7280] mb-6">
                    {message}
                </Body>

                {/* Actions */}
                <div className="flex items-center gap-3 justify-end">
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={confirmVariant}
                        onClick={() => {
                            onConfirm();
                            setIsVisible(false);
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
};
