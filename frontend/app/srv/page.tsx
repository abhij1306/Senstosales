'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle2, XCircle, TrendingDown, Loader2, Search, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { DenseTable } from "@/components/ui/DenseTable";
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
            setUploadResults(null);
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true);
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));
        try {
            const response = await fetch(`${API_BASE_URL}/api/srv/upload/batch`, {
                method: 'POST',
                body: formData,
            });
            const results = await response.json();
            setUploadResults(results);
            if (results.successful > 0) {
                success("Upload Complete", `${results.successful} files processed successfully.`);
                await loadSRVs();
                await loadStats();
                setSelectedFiles([]);
            } else if (results.failed > 0) {
                error("Upload Issues", `${results.failed} files failed to process.`);
            }
        } catch (err) {
            error('Upload Failed', 'Please check your connection and try again.');
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

    const columns = [
        {
            header: "SRV Number",
            accessorKey: "srv_number" as keyof SRVListItem,
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
            accessorKey: "srv_date" as keyof SRVListItem,
            cell: (srv: SRVListItem) => <span className="text-slate-500">{formatDate(srv.srv_date)}</span>
        },
        {
            header: "PO Reference",
            accessorKey: "po_number" as keyof SRVListItem,
            cell: (srv: SRVListItem) => (
                <span className="text-xs font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    PO-{srv.po_number}
                </span>
            )
        },
        {
            header: "Validation",
            accessorKey: "po_found" as keyof SRVListItem,
            cell: (srv: SRVListItem) => (
                srv.po_found === false
                    ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">PO Missing</span>
                    : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">Verified</span>
            )
        },
        {
            header: "Received",
            accessorKey: "total_received_qty" as keyof SRVListItem,
            className: "text-right font-medium text-emerald-600",
            cell: (srv: SRVListItem) => srv.total_received_qty.toFixed(2)
        },
        {
            header: "Rejected",
            accessorKey: "total_rejected_qty" as keyof SRVListItem,
            className: "text-right font-medium text-red-600",
            cell: (srv: SRVListItem) => srv.total_rejected_qty > 0 ? srv.total_rejected_qty.toFixed(2) : '-'
        },
        {
            header: "Actions",
            accessorKey: "srv_number" as keyof SRVListItem, // Virtual accessor
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
                        <div className="text-[28px] font-bold text-slate-800">{stats.total_srvs}</div>
                    </GlassCard>

                    <GlassCard className="p-4 flex flex-col justify-between h-[90px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Received Qty</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-[28px] font-bold text-slate-800">{stats.total_received_qty.toFixed(0)}</div>
                    </GlassCard>

                    <GlassCard className="p-4 flex flex-col justify-between h-[90px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rejected Qty</span>
                            <XCircle className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="text-[28px] font-bold text-slate-800">{stats.total_rejected_qty.toFixed(0)}</div>
                    </GlassCard>

                    <GlassCard className="p-4 flex flex-col justify-between h-[90px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Missing PO Link</span>
                            <TrendingDown className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-[28px] font-bold text-slate-800">{stats.missing_po_count}</div>
                    </GlassCard>
                </div>
            )}

            {(selectedFiles.length > 0 || uploadResults) && (
                <GlassCard className="p-4 space-y-4 border-dashed border-blue-200 bg-blue-50/20">
                    {selectedFiles.length > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">{selectedFiles.length} files queued</span>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-50 flex items-center gap-2"
                            >
                                {uploading && <Loader2 className="w-3 h-3 animate-spin" />}
                                {uploading ? "Uploading..." : "Start Upload"}
                            </button>
                        </div>
                    )}
                    {uploadResults && (
                        <div className="flex gap-4 text-xs">
                            <span className="text-emerald-600 font-medium">{uploadResults.successful} success</span>
                            <span className="text-red-600 font-medium">{uploadResults.failed} failed</span>
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
                data={srvs.filter(srv =>
                    srv.srv_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (srv.po_number && srv.po_number.toString().includes(searchQuery))
                )}
                columns={columns}
                className="bg-white/60 shadow-sm backdrop-blur-sm min-h-[500px]"
                onRowClick={(srv) => router.push(`/srv/${srv.srv_number}`)}
            />
        </div>
    );
}
