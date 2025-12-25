import React, { useState } from 'react';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
    url: string;
    filename: string;
    label?: string;
    className?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export default function DownloadButton({
    url,
    filename,
    label = "Download Excel",
    className = "",
    variant = 'outline',
    size = 'md'
}: DownloadButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsLoading(true);
        try {
            const response = await fetch(url, {
                method: 'GET',
            });

            if (!response.ok) {
                let errorMessage = "Download failed";
                try {
                    const errorData = await response.json();
                    // Handle both standard FastAPI detail and our structured AppException
                    errorMessage = errorData.message || errorData.detail?.message || errorData.detail || errorMessage;
                } catch (e) {
                    // Not JSON or other parsing error
                }
                throw new Error(errorMessage);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error: any) {
            console.error("Download Error:", error);
            alert(`Failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const sizeStyles = {
        sm: "px-2.5 py-1 text-xs",
        md: "px-3 py-1.5 text-sm",
        lg: "px-4 py-2 text-base"
    };

    const baseStyles = "inline-flex items-center gap-2 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
        outline: "border border-gray-300 text-text-primary bg-white hover:bg-gray-50",
        ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    };

    // Icon sizes
    const iconSize = size === 'sm' ? "w-3 h-3" : size === 'lg' ? "w-5 h-5" : "w-4 h-4";

    return (
        <button
            onClick={handleDownload}
            disabled={isLoading}
            className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className} ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
        >
            {isLoading ? (
                <svg className={`animate-spin -ml-1 mr-2 ${iconSize} text-current`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <Download className={iconSize} />
            )}
            {label}
        </button>
    );
}
