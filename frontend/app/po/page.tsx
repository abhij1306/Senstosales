"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, POListItem, POStats } from "@/lib/api";
import {
    Upload, X, CheckCircle, XCircle, Loader2, Plus, Search, Filter,
    TrendingUp, ClipboardList, Clock, DollarSign, FileText, ChevronRight
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { DenseTable, SortConfig, Column } from "@/components/ui/DenseTable";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface UploadResult {
    filename: string;
    success: boolean;
    po_number: number | null;
    message: string;
}

interface BatchUploadResponse {
    total: number;
    successful: number;
    failed: number;
    results: UploadResult[];
}

export default function POPage() {
    const router = useRouter();
    const { toast, success, error } = useToast();
    const [pos, setPOs] = useState<POListItem[]>([]);
    const [stats, setStats] = useState<POStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadResults, setUploadResults] = useState<BatchUploadResponse | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Statuses");

    // Upload State
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [currentFileName, setCurrentFileName] = useState<string>('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<SortConfig<POListItem> | null>(null);
    const isCancelled = useRef(false);

    const handleSort = (key: keyof POListItem) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [posData, statsData] = await Promise.all([
                    api.listPOs(),
                    api.getPOStats()
                ]);
                setPOs(posData);
                setStats(statsData);
            } catch (err) {
                console.error("Failed to load PO data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(files);
        setUploadResults(null);
        setUploadProgress({ current: 0, total: 0 });
        setCurrentFileName('');
    };

    const removeFile = (index: number) => {
        setSelectedFiles(files => files.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true);
        setUploadResults(null);
        setUploadProgress({ current: 0, total: selectedFiles.length });
        let successful = 0;
        let failed = 0;
        let processedCount = 0;
        const totalFiles = selectedFiles.length;
        const results: UploadResult[] = [];

        try {
            const CHUNK_SIZE = 25;

            for (let i = 0; i < totalFiles; i += CHUNK_SIZE) {
                if (isCancelled.current) break;

                const chunk = selectedFiles.slice(i, i + CHUNK_SIZE);
                setCurrentFileName(chunk[0].name);

                try {
                    const response = await api.uploadPOBatch(chunk);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const data: any = response;

                    if (data.status === 'error') {
                        throw new Error(data.message || 'Upload failed');
                    }

                    if (data.results) {
                        successful += data.results.successful || 0;
                        failed += data.results.failed || 0;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        results.push(...(data.results.results || []));
                    }
                } catch (err: any) {
                    console.error("Batch upload error:", err);
                    chunk.forEach(file => {
                        failed++;
                        results.push({
                            filename: file.name,
                            success: false,
                            po_number: null,
                            message: err.message || "Network error or timeout"
                        });
                    });
                }

                processedCount += chunk.length;
                setUploadProgress({
                    current: processedCount,
                    total: totalFiles
                });

                await new Promise(resolve => setTimeout(resolve, 50));
            }

            if (isCancelled.current) {
                toast("Upload Cancelled", `Processed ${processedCount} of ${totalFiles} files.`);
            } else {
                success(`Processed ${totalFiles} files. Successful: ${successful}, Failed: ${failed}`);
            }

            const finalResponse: BatchUploadResponse = {
                total: results.length,
                successful,
                failed,
                results
            };

            setUploadResults(finalResponse);

            if (successful > 0) {
                const [updatedPos, updatedStats] = await Promise.all([
                    api.listPOs(),
                    api.getPOStats()
                ]);
                setPOs(updatedPos);
                setStats(updatedStats);
            }

        } catch (err: any) {
            error(err.message || 'Failed to upload files');
        } finally {
            setUploading(false);
            setCurrentFileName('');
            isCancelled.current = false;
            setSelectedFiles([]);
        }
    };

    const handleCancel = () => {
        if (uploading) {
            isCancelled.current = true;
        }
    };

    const columns: Column<POListItem>[] = [
        {
            header: "PO Number",
            accessorKey: "po_number",
            enableSorting: true,
            cell: (po: POListItem) => (
                <div
                    onClick={() => router.push(`/po/${po.po_number}`)}
                    className="font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                >
                    PO-{po.po_number}
                </div>
            )
        },
        {
            header: "Date",
            accessorKey: "po_date",
            enableSorting: true,
            cell: (po: POListItem) => <span className="text-slate-600 font-medium text-xs">{formatDate(po.po_date)}</span>
        },
        {
            header: "Ord",
            accessorKey: "total_ordered_quantity",
            enableSorting: true,
            className: "text-right w-[80px] text-slate-700 font-medium border-l border-slate-100",
            cell: (po: POListItem) => po.total_ordered_quantity?.toFixed(0) || '-'
        },
        {
            header: "Del",
            accessorKey: "total_dispatched_quantity",
            enableSorting: true,
            className: "text-right w-[80px] text-slate-700 border-l border-slate-100",
            cell: (po: POListItem) => (
                <span className={(po.total_dispatched_quantity || 0) > 0 ? "text-slate-700 font-medium" : "text-slate-400 font-normal"}>
                    {po.total_dispatched_quantity?.toFixed(0) || '0'}
                </span>
            )
        },
        {
            header: "Recd",
            accessorKey: "total_received_quantity",
            enableSorting: true,
            className: "text-right w-[80px] border-l border-slate-100",
            cell: (po: POListItem) => (
                <span className={(po.total_received_quantity || 0) > 0 ? "text-emerald-600 font-medium" : "text-slate-400 font-normal"}>
                    {po.total_received_quantity?.toFixed(0) || '0'}
                </span>
            )
        },
        {
            header: "Rej",
            accessorKey: "total_rejected_quantity",
            enableSorting: true,
            className: "text-right w-[80px] border-l border-slate-100 border-r-2 border-r-transparent",
            cell: (po: POListItem) => (
                <span className={(po.total_rejected_quantity || 0) > 0 ? "text-red-600 font-medium" : "text-slate-300 font-normal"}>
                    {po.total_rejected_quantity?.toFixed(0) || '0'}
                </span>
            )
        },
        {
            header: "Value",
            accessorKey: "po_value",
            enableSorting: true,
            className: "text-right",
            cell: (po: POListItem) => (
                <span className="font-semibold text-slate-700">
                    ₹{(po.po_value || 0).toLocaleString('en-IN')}
                </span>
            )
        }
    ];

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh] bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
    );

    // Filter, Sort, and Paginate
    const filteredPOs = pos.filter(po => {
        const matchesSearch =
            po.po_number.toString().includes(searchQuery) ||
            (po.supplier_name && po.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()));
        const status = po.status || 'New';
        const matchesStatus = statusFilter === 'All Statuses' || status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const sortedPOs = [...filteredPOs].sort((a, b) => {
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

    const paginatedPOs = sortedPOs.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-4 md:p-6 space-y-6 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Purchase Orders</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Procurement tracking and management</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push('/po/create')}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-xs font-semibold shadow-sm transition-all shadow-blue-500/20"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Create Order
                    </button>
                    <label className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center gap-2 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Batch Upload
                        <input
                            type="file"
                            accept=".html"
                            multiple
                            onChange={handleFileSelect}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>


            {/* KPIs */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlassCard className="flex flex-col justify-between h-[90px] p-4">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total POs</span>
                            <FileText className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="text-[28px] font-bold text-slate-800">{pos.length}</div>
                    </GlassCard>
                    <GlassCard className="flex flex-col justify-between h-[90px] p-4">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Orders</span>
                            <ClipboardList className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-[28px] font-bold text-slate-800">{stats.open_orders_count}</div>
                    </GlassCard>
                    <GlassCard className="flex flex-col justify-between h-[90px] p-4">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</span>
                            <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-[28px] font-bold text-slate-800">{stats.pending_approval_count}</div>
                    </GlassCard>
                    <GlassCard className="flex flex-col justify-between h-[90px] p-4">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Value (YTD)</span>
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[28px] font-bold text-slate-800">₹{stats.total_value_ytd.toLocaleString('en-IN')}</div>
                            <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {stats.total_value_change}% vs last month
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}


            {/* Upload Progress Indicator */}
            {(selectedFiles.length > 0 || uploadResults) && (
                <GlassCard className="p-4 space-y-4 border-dashed border-blue-200 bg-blue-50/20">
                    {selectedFiles.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">{selectedFiles.length} files selected</span>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition-all flex items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-3.5 h-3.5" />
                                            Start Upload
                                        </>
                                    )}
                                </button>
                            </div>

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
                                        <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-[11px] text-blue-700">
                                            Large batches may take several minutes. Please do not close this page.
                                            {selectedFiles.length > 100 && ` Processing ${selectedFiles.length} files in batches of 50...`}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {uploadResults && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-800">Upload Complete</h4>
                                <button
                                    onClick={() => setUploadResults(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
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
                                            .filter(r => !r.success)
                                            .map((result, idx) => (
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

            {/* filters */}
            <div className="flex gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-white/60 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            <DenseTable
                loading={loading}
                data={paginatedPOs}
                columns={columns}
                onRowClick={(po) => router.push(`/po/view?id=${po.po_number}`)}
                className="bg-white/60 shadow-sm backdrop-blur-sm min-h-[500px]"
                keyField="po_number"
                onSort={handleSort}
                sortConfig={sortConfig}
            />

            <Pagination
                currentPage={currentPage}
                totalItems={filteredPOs.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
            />
        </div>
    );
}
