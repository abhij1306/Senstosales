"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, POListItem, POStats } from "@/lib/api";
import {
    Upload, X, CheckCircle, XCircle, Loader2, Plus, Search,
    TrendingUp, Clock, DollarSign, FileText, Activity, Layers, Sparkles
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { DenseTable, SortConfig, Column } from "@/components/ui/DenseTable";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate, formatIndianCurrency } from "@/lib/utils";

export default function POPage() {
    const router = useRouter();
    const [pos, setPOs] = useState<POListItem[]>([]);
    const [stats, setStats] = useState<POStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<SortConfig<POListItem> | null>(null);
    const isCancelled = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [posData, statsData] = await Promise.all([
                    api.listPOs(),
                    api.getPOStats()
                ]);
                setPOs(posData || []);
                setStats(statsData);
            } catch (err) {
                console.error("Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(files);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true);
        setUploadProgress({ current: 0, total: selectedFiles.length });
        let processedCount = 0;

        try {
            const CHUNK_SIZE = 25;
            for (let i = 0; i < selectedFiles.length; i += CHUNK_SIZE) {
                if (isCancelled.current) break;
                const chunk = selectedFiles.slice(i, i + CHUNK_SIZE);
                await api.uploadPOBatch(chunk);
                processedCount += chunk.length;
                setUploadProgress({ current: processedCount, total: selectedFiles.length });
            }

            // Only refresh and clear if not cancelled
            if (!isCancelled.current) {
                const [updatedPos, updatedStats] = await Promise.all([api.listPOs(), api.getPOStats()]);
                setPOs(updatedPos || []);
                setStats(updatedStats);
                setSelectedFiles([]);
            }
        } catch (err) {
            console.error("Upload Error:", err);
        } finally {
            setUploading(false);
            isCancelled.current = false;
        }
    };

    const columns: Column<POListItem>[] = [
        {
            header: "Purchase ID",
            accessorKey: "po_number",
            enableSorting: true,
            cell: (po: POListItem) => (
                <div onClick={() => router.push(`/po/view?id=${po.po_number}`)} className="link font-bold text-sm">
                    {po.po_number}
                </div>
            )
        },
        {
            header: "Order Date",
            accessorKey: "po_date",
            enableSorting: true,
            cell: (po: POListItem) => <span className="text-meta font-bold uppercase">{formatDate(po.po_date)}</span>
        },
        {
            header: "Items",
            accessorKey: "total_items_count",
            className: "text-right w-16",
            cell: (po: POListItem) => (
                <span className="badge-premium badge-slate opacity-75 tabular-nums">
                    {po.total_items_count || 0}
                </span>
            )
        },
        {
            header: "Ord",
            accessorKey: "total_ordered_quantity",
            className: "text-right",
            cell: (po: POListItem) => <span className="text-accounting">{po.total_ordered_quantity?.toLocaleString() ?? 0}</span>
        },
        {
            header: "Del",
            accessorKey: "total_dispatched_quantity",
            className: "text-right",
            cell: (po: POListItem) => <span className={`text-accounting ${(po.total_dispatched_quantity ?? 0) > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{po.total_dispatched_quantity?.toLocaleString() ?? 0}</span>
        },
        {
            header: "Accepted",
            accessorKey: "total_received_quantity",
            className: "text-right",
            cell: (po: POListItem) => <span className={`text-accounting ${(po.total_received_quantity ?? 0) > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>{po.total_received_quantity?.toLocaleString() ?? 0}</span>
        },
        {
            header: "Balance",
            accessorKey: "total_pending_quantity",
            className: "text-right font-black",
            cell: (po: POListItem) => {
                const balance = (po.total_ordered_quantity ?? 0) - (po.total_dispatched_quantity ?? 0);
                return <span className={`text-accounting ${balance > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{balance.toLocaleString()}</span>
            }
        },
        {
            header: "Gross Value",
            accessorKey: "po_value",
            enableSorting: true,
            className: "text-right",
            cell: (po: POListItem) => <span className="text-accounting font-bold text-slate-800">{formatIndianCurrency(po.po_value)}</span>
        }
    ];

    const filteredPOs = pos.filter(po => po.po_number.toString().includes(searchQuery));
    const sortedPOs = [...filteredPOs].sort((a, b) => {
        if (!sortConfig) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === bVal) return 0;
        return (sortConfig.direction === 'asc' ? 1 : -1) * (aVal > bVal ? 1 : -1);
    });
    const paginatedPOs = sortedPOs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (loading) return <div className="p-32 text-center animate-pulse text-blue-500 font-bold uppercase tracking-widest text-xs">Synchronizing Repository...</div>;

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="heading-xl flex items-center gap-4">
                        <Layers className="w-8 h-8 text-blue-500" />
                        Procurement Pipeline
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">Execute and track enterprise purchase orders</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => router.push('/po/create')} className="btn-premium btn-primary shadow-xl">
                        <Plus className="w-4 h-4" />
                        New Order
                    </button>
                    <label className="btn-premium btn-ghost">
                        <Upload className="w-4 h-4" />
                        Batch Ingest
                        <input type="file" multiple hidden onChange={handleFileSelect} />
                    </label>
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Active Contracts" value={pos.length} icon={FileText} color="indigo" />
                    <StatCard title="Open Fulfillment" value={stats.open_orders_count} icon={Activity} color="blue" />
                    <StatCard title="Pending Review" value={stats.pending_approval_count} icon={Clock} color="amber" />
                    <StatCard title="Total Pipeline" value={formatIndianCurrency(stats.total_value_ytd)} icon={DollarSign} color="emerald" trend={`${stats.total_value_change}%`} />
                </div>
            )}

            {selectedFiles.length > 0 && !uploading && (
                <GlassCard className="p-6 border-dashed border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between animate-in slide-in-from-top-4 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                            <Sparkles className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm font-black uppercase tracking-wider text-blue-700">{selectedFiles.length} Documents Selected</div>
                            <div className="text-xs font-bold text-blue-500 mt-0.5 uppercase tracking-wide">Ready for system ingestion</div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setSelectedFiles([])} className="btn-premium btn-ghost border-none bg-white/50 h-12 w-12 p-0 hover:bg-white shadow-md">
                            <X className="w-5 h-5" />
                        </button>
                        <button onClick={handleUpload} disabled={uploading} className="btn-premium btn-primary px-8 h-12 shadow-lg">
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            {uploading ? "Processing..." : "Start Sync"}
                        </button>
                    </div>
                </GlassCard>
            )}

            {uploading && uploadProgress.total > 0 && (
                <GlassCard className="p-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 animate-in slide-in-from-top-4 shadow-xl overflow-hidden">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                </div>
                                <div>
                                    <div className="text-sm font-black uppercase tracking-wider text-blue-700">Processing Purchase Orders</div>
                                    <div className="text-xs font-bold text-blue-500">
                                        {uploadProgress.current} of {uploadProgress.total} documents ingested
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-2xl font-black text-blue-600">{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Complete</div>
                                </div>
                                <button
                                    onClick={() => {
                                        isCancelled.current = true;
                                        setUploading(false);
                                    }}
                                    className="btn-premium btn-ghost border-red-200 text-red-600 h-10 px-4"
                                >
                                    <X className="w-4 h-4" /> Stop
                                </button>
                            </div>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="relative h-3 bg-white/50 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500 ease-out relative overflow-hidden"
                                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                            </div>
                        </div>

                        {/* File Processing Animation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                            {selectedFiles.slice(0, uploadProgress.current).map((file, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <FileText className="w-4 h-4 text-emerald-500" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-slate-700 truncate">{file.name}</div>
                                    </div>
                                    <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center">
                                        <span className="text-emerald-600 text-xs">✓</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            )}

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
                    <h2 className="heading-md uppercase tracking-wider text-slate-800">Pipeline Inventory</h2>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="SEARCH BY PURCHASE ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-premium pl-12 font-bold uppercase tracking-widest text-[10px]"
                        />
                    </div>
                </div>

                <div className="glass-panel overflow-hidden">
                    <DenseTable
                        data={paginatedPOs}
                        columns={columns}
                        onRowClick={(po) => router.push(`/po/view?id=${po.po_number}`)}
                        className="bg-transparent border-none"
                    />
                    <div className="p-4 border-t border-white/20 bg-white/10">
                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredPOs.length}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <GlassCard className="p-6 h-[110px] flex flex-col justify-between group">
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-label uppercase opacity-60 m-0">{title}</span>
                    <div className="text-xl font-black text-slate-800 tracking-tighter mt-1 group-hover:text-blue-600 transition-colors">{typeof value === 'number' ? value.toLocaleString() : value}</div>
                </div>
                <div className={`p-2 rounded-xl bg-${color}-50/50 border border-${color}-100 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-4 h-4 text-${color}-600`} />
                </div>
            </div>
            {trend && (
                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase mt-2">
                    <TrendingUp className="w-3 h-3" /> {trend} Growth
                </div>
            )}
        </GlassCard>
    );
}
