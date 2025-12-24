"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, POListItem, POStats } from "@/lib/api";
import {
    Upload, X, CheckCircle, XCircle, Loader2, Plus, Search, Filter,
    TrendingUp, ClipboardList, Clock, DollarSign, FileText, ChevronRight
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { DenseTable } from "@/components/ui/DenseTable";
import { formatDate } from "@/lib/utils";

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
    const [pos, setPOs] = useState<POListItem[]>([]);
    const [stats, setStats] = useState<POStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadResults, setUploadResults] = useState<BatchUploadResponse | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Statuses");

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
    };

    const removeFile = (index: number) => {
        setSelectedFiles(files => files.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true);
        setUploadResults(null);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: { success: boolean, results: any[] } = await api.uploadPOBatch(selectedFiles);
            const results: BatchUploadResponse = {
                total: response.results.length,
                successful: response.results.filter((r: any) => r.success).length,
                failed: response.results.filter((r: any) => !r.success).length,
                results: response.results.map((r: any) => ({
                    filename: r.filename || 'Unknown',
                    success: r.success || false,
                    po_number: r.po_number || null,
                    message: r.message || (r.success ? 'Uploaded successfully' : 'Upload failed')
                }))
            };
            setUploadResults(results);
            if (results.successful > 0) {
                const [updatedPos, updatedStats] = await Promise.all([
                    api.listPOs(),
                    api.getPOStats()
                ]);
                setPOs(updatedPos);
                setStats(updatedStats);
            }
            setSelectedFiles([]);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    const filteredPOs = pos.filter(po => {
        const matchesSearch =
            po.po_number.toString().includes(searchQuery) ||
            (po.supplier_name && po.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()));
        const status = po.po_status || 'New';
        const matchesStatus = statusFilter === 'All Statuses' || status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const columns = [
        {
            header: "PO Number",
            accessorKey: "po_number" as keyof POListItem,
            cell: (po: POListItem) => (
                <div className="font-medium text-blue-600">PO-{po.po_number}</div>
            )
        },
        {
            header: "Date",
            accessorKey: "po_date" as keyof POListItem,
            cell: (po: POListItem) => <span className="text-slate-500">{formatDate(po.po_date)}</span>
        },

        {
            header: "Value",
            accessorKey: "po_value" as keyof POListItem,
            className: "text-right font-medium",
            cell: (po: POListItem) => `₹${po.po_value?.toLocaleString('en-IN') || '0'}`
        },
        {
            header: "Ordered",
            accessorKey: "total_ordered_quantity" as keyof POListItem,
            className: "text-right font-medium",
            cell: (po: POListItem) => po.total_ordered_quantity?.toLocaleString() || '0'
        },
        {
            header: "Pending",
            accessorKey: "total_pending_quantity" as keyof POListItem,
            className: "text-center",
            cell: (po: POListItem) => (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-semibold ${po.total_pending_quantity > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                    }`}>
                    {po.total_pending_quantity?.toLocaleString() || '0'}
                </span>
            )
        },
        {
            header: "Linked Challans",
            accessorKey: "linked_dc_numbers" as keyof POListItem,
            cell: (po: POListItem) => {
                if (!po.linked_dc_numbers) return <span className="text-slate-300">-</span>;
                const dcs = po.linked_dc_numbers.split(',').map(d => d.trim()).filter(Boolean);
                if (dcs.length === 0) return <span className="text-slate-300">-</span>;

                return (
                    <div className="flex flex-wrap gap-1">
                        {dcs.slice(0, 2).map((dc, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded font-medium">
                                {dc}
                            </span>
                        ))}
                        {dcs.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded">
                                +{dcs.length - 2}
                            </span>
                        )}
                    </div>
                )
            }
        },
        {
            header: "",
            accessorKey: "po_number" as keyof POListItem,
            className: "w-8",
            cell: () => <ChevronRight className="w-4 h-4 text-slate-300" />
        }
    ];

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[20px] font-semibold text-slate-900 tracking-tight">Purchase Orders</h1>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Upload Feedback */}
            {(selectedFiles.length > 0 || uploadResults) && (
                <GlassCard className="p-4 space-y-4 border-dashed border-blue-200 bg-blue-50/20">
                    {selectedFiles.length > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">{selectedFiles.length} files selected</span>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-50"
                            >
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
                data={filteredPOs}
                columns={columns}
                onRowClick={(po) => router.push(`/po/view?id=${po.po_number}`)}
                className="bg-white/60 shadow-sm backdrop-blur-sm min-h-[500px]"
            />
        </div>
    );
}
