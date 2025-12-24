import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr || dateStr === '-') return "-";

    try {
        let date: Date;

        // Try to parse dd/mm/yyyy or dd-mm-yyyy format first
        if (dateStr.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/)) {
            const parts = dateStr.split(/[\/\-]/);
            // Assuming dd/mm/yyyy format
            date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
            // Try standard ISO format or other formats
            date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) return "-";

        const day = date.getDate().toString().padStart(2, '0');
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    } catch {
        return "-";
    }
}
