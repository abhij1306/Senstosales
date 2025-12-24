'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle2, XCircle, TrendingDown, Loader2, Search, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { formatDate, formatIndianCurrency } from '@/lib/utils';
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { DenseTable, SortConfig, Column } from "@/components/ui/DenseTable";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";

interface SRVListItem {
    srv_number: string;
    srv_date: string;
    po_number: string;
    total_received_qty: number;
    total_rejected_qty: number;
    po_found?: boolean;
    warning_message?: string;
    created_at: string;
}

interface SRVStats {
    total_srvs: number;
    total_received_qty: number;
    total_rejected_qty: number;
    rejection_rate: number;
    missing_po_count: number;
}

export default function SRVPage() {
    const router = useRouter();
    const { toast, success, error } = useToast();
    const [srvs, setSrvs] = useState<SRVListItem[]>([]);
    const [stats, setStats] = useState<SRVStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [currentFileName, setCurrentFileName] = useState<string>('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<SortConfig<SRVListItem> | null>(null);

    const handleSort = (key: keyof SRVListItem) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    useEffect(() => {
        loadSRVs();
        loadStats();
    }, []);

    const loadSRVs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/srv`);
            if (!response.ok) {
                setSrvs([]);
                return;
            }
            const data = await response.json();
            setSrvs(Array.isArray(data) ? data : []);
        } catch (error) {
            setSrvs([]);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/srv/stats`);
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errText}`);
            }
            const data = await response.json();
            setStats(data);
        } catch (error: any) {
            console.error('Error loading stats:', error);
            // toast("Stat Error", "Failed to load dashboard stats"); // Optional, maybe too noisy
        }
    };

    const isCancelled = useRef(false);

    const handleCancel = () => {
        isCancelled.current = true;
        setUploading(false);
        error("Upload Cancelled", "The upload process was stopped.");
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(files);
            setUploadResults(null);
            setUploadProgress({ current: 0, total: 0 });
            setCurrentFileName('');
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true);
        setUploadResults(null);
        setUploadProgress({ current: 0, total: selectedFiles.length });
        isCancelled.current = false;

        try {
            const CHUNK_SIZE = 25; // Upload 25 files at a time for faster progress updates
            const allResults: any[] = [];

            // Split files into chunks
            for (let i = 0; i < selectedFiles.length; i += CHUNK_SIZE) {
                if (isCancelled.current) break;
                const chunk = selectedFiles.slice(i, i + CHUNK_SIZE);

                // Show current file being processed
                setCurrentFileName(chunk[0].name);

                // Use api.uploadSRVBatch instead of direct fetch for timeout handling
                // Note: api.uploadSRVBatch handles FormData creation internally
                // We need to fetch directly here to support chunking or import api from lib
                const formData = new FormData();
                chunk.forEach(file => formData.append('files', file));

                const response = await fetch(`${API_BASE_URL}/api/srv/upload/batch`, {
                    method: 'POST',
                    body: formData,
                });
                const chunkResponse = await response.json();

                if (isCancelled.current) break;

                // Collect results - normalize response structure
                const chunkResults = (chunkResponse.results || []).map((r: any) => ({
                    filename: r.filename || 'Unknown',
                    success: r.success || false,
                    message: r.message || (r.success ? 'Uploaded successfully' : 'Upload failed')
                }));

                allResults.push(...chunkResults);

                // Update progress
                setUploadProgress({ current: Math.min(i + CHUNK_SIZE, selectedFiles.length), total: selectedFiles.length });
            }

            // Set final results
            const results = {
                total: allResults.length,
                successful: allResults.filter(r => r.success).length,
                failed: allResults.filter(r => !r.success).length,
                results: allResults
            };

            setUploadResults(results);
            setCurrentFileName('');

            if (results.successful > 0 && !isCancelled.current) {
                // success("Upload Complete", `${results.successful} files processed successfully.`); // Too noisy for large batches
                await loadSRVs();
                await loadStats();
                setSelectedFiles([]);
            }

            setUploadProgress({ current: 0, total: 0 });

        } catch (err) {
            if (!isCancelled.current) {
                error('Upload Failed', 'Please check your connection and try again.');
            }
            setCurrentFileName('');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, srv_number: string) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete SRV ${srv_number}? This will rollback quantities.`)) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/srv/${srv_number}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            success("SRV Deleted", `SRV ${srv_number} has been removed.`);
            loadSRVs();
            loadStats();
        } catch (err) {
            error("Delete Failed", "Could not delete SRV.");
        }
    };

    const columns: Column<SRVListItem>[] = [
        {
            header: "SRV Number",
            accessorKey: "srv_number",
            enableSorting: true,
            cell: (srv: SRVListItem) => (
                <div
                    onClick={() => router.push(`/srv/${srv.srv_number}`)}
                    className="font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                >
                    {srv.srv_number}
                </div>
            )
        },
        {
            header: "Date",
            accessorKey: "srv_date",
            enableSorting: true,
            cell: (srv: SRVListItem) => <span className="text-slate-500">{formatDate(srv.srv_date)}</span>
        },
        {
            header: "PO Reference",
            accessorKey: "po_number",
            enableSorting: true,
            cell: (srv: SRVListItem) => (
                <span className="text-xs font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    {srv.po_number}
                </span>
            )
        },
        {
            header: "Validation",
            accessorKey: "po_found",
            enableSorting: true,
            cell: (srv: SRVListItem) => (
                srv.po_found === false
                    ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">PO Missing</span>
                    : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">Verified</span>
            )
        },
        {
            header: "Received",
            accessorKey: "total_received_qty",
            enableSorting: true,
            className: "text-right font-medium text-emerald-600 tabular-nums",
            cell: (srv: SRVListItem) => srv.total_received_qty.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        },
        {
            header: "Rejected",
            accessorKey: "total_rejected_qty",
            enableSorting: true,
            className: "text-right font-medium text-red-600 tabular-nums",
            cell: (srv: SRVListItem) => srv.total_rejected_qty > 0 ? srv.total_rejected_qty.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'
        },
        {
            header: "Actions",
            accessorKey: "srv_number", // Virtual accessor
            className: "w-[50px] text-center",
            cell: (srv: SRVListItem) => (
                <button
                    onClick={(e) => handleDelete(e, srv.srv_number)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete SRV"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )
        }
    ];

    if (loading) return (
        <div className="flex items-center justify-center h-[50vh] text-slate-400 font-medium animate-pulse">
            Loading Receipts...
        </div>
    );

    // Filter, Sort, and Paginate
    const filteredSrvs = srvs.filter(srv =>
        srv.srv_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (srv.po_number && srv.po_number.toString().includes(searchQuery))
    );

    const sortedSrvs = [...filteredSrvs].sort((a, b) => {
        if (!sortConfig) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;

        // Handle null/undefined values
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const paginatedSrvs = sortedSrvs.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[20px] font-semibold text-slate-900 tracking-tight">Receipt Vouchers (SRV)</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Inbound material reconciliation</p>
                </div>
                <div className="flex gap-2">
                    <label className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center gap-2 shadow-sm transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Upload SRV Files
                        <input
                            type="file"
                            multiple
                            accept=".html,.htm,.xls,.xlsx,.pdf"
                            onChange={handleFileSelect}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlassCard className="p-4 flex flex-col justify-between h-[90px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total SRVs</span>
                            <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-[28px] font-bold text-slate-800">{stats.total_srvs.toLocaleString('en-IN')}</div>
                    </GlassCard>

                    <GlassCard className="p-4 flex flex-col justify-between h-[90px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Received Qty</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-[28px] font-bold text-slate-800">{formatIndianCurrency(stats.total_received_qty)}</div>
                    </GlassCard>

                    <GlassCard className="p-4 flex flex-col justify-between h-[90px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rejected Qty</span>
                            <XCircle className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="text-[28px] font-bold text-slate-800">{formatIndianCurrency(stats.total_rejected_qty)}</div>
                    </GlassCard>

                    <GlassCard className="p-4 flex flex-col justify-between h-[90px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Missing PO Link</span>
                            <TrendingDown className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-[28px] font-bold text-slate-800">{stats.missing_po_count.toLocaleString('en-IN')}</div>
                    </GlassCard>
                </div>
            )}

            {/* Enhanced Upload Progress Indicator */}
            {(selectedFiles.length > 0 || uploadResults) && (
                <GlassCard className="p-4 space-y-4 border-dashed border-blue-200 bg-blue-50/20">
                    {selectedFiles.length > 0 && !uploading && !uploadResults && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">{selectedFiles.length} files selected</span>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition-all flex items-center gap-2"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                Start Upload
                            </button>
                        </div>
                    )}

                    {uploading && (
                        <div className="space-y-2">
                            {/* Progress Bar */}
                            <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out ${uploadProgress.current === 0 ? 'animate-pulse' : ''}`}
                                    style={{ width: `${uploadProgress.total > 0 ? Math.max((uploadProgress.current / uploadProgress.total) * 100, 3) : 3}%` }}
                                />
                            </div>

                            {/* Status Text with Cancel Button */}
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 font-medium">
                                    {uploadProgress.current === uploadProgress.total
                                        ? `All ${uploadProgress.total} files processed`
                                        : `Processing files ${uploadProgress.current + 1}-${Math.min(uploadProgress.current + 25, uploadProgress.total)} of ${uploadProgress.total}`
                                    }
                                </span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleCancel}
                                        className="text-red-500 hover:text-red-700 font-medium hover:underline transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <span className="text-blue-600 font-semibold">
                                        {uploadProgress.total > 0 ? Math.round((uploadProgress.current / uploadProgress.total) * 100) : 0}%
                                    </span>
                                </div>
                            </div>

                            {/* Current File Name */}
                            {currentFileName && (
                                <div className="text-[10px] text-slate-500 truncate" title={currentFileName}>
                                    📄 {currentFileName}
                                </div>
                            )}

                            {/* Info Message */}
                            <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                                <Loader2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0 animate-spin" />
                                <p className="text-[11px] text-blue-700">
                                    Large batches may take several minutes. Please do not close this page.
                                    {selectedFiles.length > 25 && ` Processing ${selectedFiles.length} files in batches of 25...`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Upload Results Summary */}
                    {uploadResults && !uploading && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">Upload Complete</span>
                                <button
                                    onClick={() => {
                                        setUploadResults(null);
                                        setSelectedFiles([]);
                                    }}
                                    className="text-xs text-slate-500 hover:text-slate-800"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="flex gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-emerald-600 font-medium">{uploadResults.successful} successful</span>
                                </div>
                                {uploadResults.failed > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <XCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-red-600 font-medium">{uploadResults.failed} failed</span>
                                    </div>
                                )}
                            </div>

                            {/* Failed Files List */}
                            {uploadResults.failed > 0 && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg space-y-2">
                                    <h5 className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                                        <XCircle className="w-3.5 h-3.5" />
                                        Failed Files ({uploadResults.failed})
                                    </h5>
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                        {uploadResults.results
                                            .filter((r: any) => !r.success)
                                            .map((result: any, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(result.filename);
                                                    }}
                                                    className="w-full p-2 bg-white border border-red-100 rounded text-[11px] hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer text-left"
                                                    title={`Click to copy: ${result.filename}`}
                                                >
                                                    <div className="font-medium text-red-700 truncate flex items-center gap-1.5">
                                                        <FileText className="w-3 h-3 flex-shrink-0" />
                                                        {result.filename}
                                                    </div>
                                                    <div className="text-red-600 mt-0.5">
                                                        {result.message}
                                                    </div>
                                                    <div className="text-[9px] text-red-400 mt-1">
                                                        Click to copy filename
                                                    </div>
                                                </button>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </GlassCard>
            )}

            {/* Filters */}
            <div className="flex gap-2 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search SRV, PO reference..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-white/60 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            <DenseTable
                loading={loading}
                data={paginatedSrvs}
                columns={columns}
                keyField="srv_number"
                onSort={handleSort}
                sortConfig={sortConfig}
                className="bg-white/60 shadow-sm backdrop-blur-sm min-h-[500px]"
                onRowClick={(srv) => router.push(`/srv/${srv.srv_number}`)}
            />

            <Pagination
                currentPage={currentPage}
                totalItems={filteredSrvs.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
            />
        </div>
    );
}
