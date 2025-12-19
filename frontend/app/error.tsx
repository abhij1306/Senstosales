'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Application error:', error)
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="glass-card p-8 max-w-md w-full text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-danger/10 rounded-full">
                        <AlertTriangle className="w-8 h-8 text-danger" />
                    </div>
                </div>
                <h2 className="text-[18px] font-semibold text-text-primary mb-2">
                    Something went wrong!
                </h2>
                <p className="text-[13px] text-text-secondary mb-6">
                    {error.message || 'An unexpected error occurred'}
                </p>
                <button
                    onClick={reset}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    )
}
