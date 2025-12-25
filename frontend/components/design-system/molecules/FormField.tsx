"use client";

import React from 'react';
import { Input, InputProps } from '../atoms/Input';
import { Label } from '../atoms/Typography';
import { cn } from "@/lib/utils";

/**
 * FormField Molecule - Atomic Design System v1.0
 * Composition: Label (16px) + Input + Error Message
 */

export interface FormFieldProps extends InputProps {
    label?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
    ({ label, error, helperText, required, className, ...inputProps }, ref) => {
        return (
            <div className={cn("space-y-1.5", className)}>
                {label && (
                    <Label className="block">
                        {label}
                        {required && <span className="text-[#DC2626] ml-1">*</span>}
                    </Label>
                )}

                <Input
                    ref={ref}
                    error={error}
                    required={required}
                    {...inputProps}
                />

                {helperText && !error && (
                    <p className="text-[12px] text-[#6B7280]">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);
FormField.displayName = "FormField";
