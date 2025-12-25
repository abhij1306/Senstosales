'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle2, XCircle, Loader2, Search, Trash2, Activity, Layers, Receipt } from 'lucide-react';
import { api, API_BASE_URL } from '@/lib/api';
import { formatDate, formatIndianCurrency } from '@/lib/utils';
import GlassCard from "@/components/ui/GlassCard";
import { DenseTable, SortConfig, Column } from "@/components/ui/DenseTable";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";

interface SRVListItem {
    srv_number: string;
    srv_date: string;
    po_number: string;
    total_received_qty: number;
    total_rejected_qty: number;
    total_order_qty: number;
    total_challan_qty: number;
    total_accepted_qty: number;
    challan_numbers?: string;
    invoice_numbers?: string;
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
    const { success, error } = useToast();
    const [srvs, setSrvs] = useState<SRVListItem[]>([]);
    const [stats, setStats] = useState<SRVStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<SortConfig<SRVListItem> | null>(null);
    const isCancelled = useRef(false);

    useEffect(() => {
        loadSRVs();
        loadStats();
    }, []);

    const loadSRVs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/srv`);
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
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Stats Load Error:', error);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true);
        setUploadProgress({ current: 0, total: selectedFiles.length });
        isCancelled.current = false;
        const allResults: any[] = [];

        try {
            const CHUNK_SIZE = 25;
            for (let i = 0; i < selectedFiles.length; i += CHUNK_SIZE) {
                if (isCancelled.current) break;
                const chunk = selectedFiles.slice(i, i + CHUNK_SIZE);
                const formData = new FormData();
                chunk.forEach(file => formData.append('files', file));
                const response = await fetch(`${API_BASE_URL}/api/srv/upload/batch`, {
                    method: 'POST',
                    body: formData,
                });
                const chunkResponse = await response.json();
                allResults.push(...(chunkResponse.results || []));
                setUploadProgress({ current: Math.min(i + CHUNK_SIZE, selectedFiles.length), total: selectedFiles.length });
            }
            setUploadResults({ successful: allResults.filter(r => r.success).length, failed: allResults.filter(r => !r.success).length });
            await Promise.all([loadSRVs(), loadStats()]);
            setSelectedFiles([]);
        } catch (err) {
            error('Ingestion Failure', 'System encountered a processing error.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, srv_number: string) => {
        e.stopPropagation();
        if (!confirm(`Permanently delete SRV ${srv_number}?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/srv/${srv_number}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete Error');
            success("Purge Complete", `SRV ${srv_number} removed from ledger.`);
            await Promise.all([loadSRVs(), loadStats()]);
        } catch (err) {
            error("Purge Error", "Record deletion failed.");
        }
    };

    const columns: Column<SRVListItem>[] = [
        {
            header: "Receipt Details",
            accessorKey: "srv_number",
            enableSorting: true,
            cell: (srv: SRVListItem) => (
                <div onClick={() => router.push(`/srv/${srv.srv_number}`)} className="flex flex-col cursor-pointer group">
                    <span className="link font-black text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-tighter">SRV-{srv.srv_number}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(srv.srv_date)}</span>
                </div>
            )
        },
        {
            header: "Challan No",
            accessorKey: "challan_numbers",
            cell: (srv: SRVListItem) => (
                <div className="flex flex-col gap-1 max-w-[120px]">
                    {srv.challan_numbers ? srv.challan_numbers.split(',').map((num: string, i: number) => (
                        <span key={i} className="badge-premium badge-slate text-[9px] tracking-tight truncate border-none bg-slate-100" title={num}>{num}</span>
                    )) : <span className="text-slate-300 text-[10px] italic">-</span>}
                </div>
            )
        },
        {
            header: "Invoice No",
            accessorKey: "invoice_numbers",
            cell: (srv: SRVListItem) => (
                <div className="flex flex-wrap gap-1">
                    {srv.invoice_numbers ? srv.invoice_numbers.split(',').map((inv: string) => (
                        <span key={inv} className="badge-premium badge-rose text-[9px] px-2 py-0.5">{inv}</span>
                    )) : <span className="text-slate-300 italic">None</span>}
                </div>
            )
        },
        {
            header: "Contract Ref",
            accessorKey: "po_number",
            enableSorting: true,
            cell: (srv: SRVListItem) => (
                <span className="badge-premium badge-blue self-start text-[9px] px-2 py-0.5 border-none bg-blue-50">{srv.po_number}</span>
            )
        },
        {
            header: "Manifest Qty",
            accessorKey: "total_order_qty",
            className: "text-right",
            cell: (srv: SRVListItem) => (
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ORD: {(srv.total_order_qty || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">CHL: {(srv.total_challan_qty || 0).toLocaleString('en-IN')}</span>
                </div>
            )
        },
        {
            header: "Inspection Outcome",
            accessorKey: "total_received_qty",
            className: "text-right",
            cell: (srv: SRVListItem) => (
                <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RCV</span>
                        <span className="font-black text-indigo-600 tracking-tighter">{(srv.total_received_qty || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-[8px]">ACC</span>
                        <span className="font-black text-emerald-600 tracking-tighter">{(srv.total_accepted_qty || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {(srv.total_rejected_qty || 0) > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-[8px]">REJ</span>
                            <span className="font-black text-rose-600 tracking-tighter">{(srv.total_rejected_qty || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "",
            accessorKey: "srv_number",
            className: "w-10",
            cell: (srv: SRVListItem) => (
                <button onClick={(e) => handleDelete(e, srv.srv_number)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Purge Record">
                    <Trash2 className="w-4 h-4" />
                </button>
            )
        }
    ];

    if (loading) return <div className="p-32 text-center animate-pulse text-indigo-500 font-bold uppercase tracking-widest text-xs">Synchronizing Inbound Repository...</div>;

    const filteredSrvs = srvs.filter(srv =>
        (srv.srv_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (srv.po_number && srv.po_number.toString().includes(searchQuery))
    );

    const sortedSrvs = [...filteredSrvs].sort((a, b) => {
        if (!sortConfig) return 0;
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        if (aVal === bVal) return 0;
        return (sortConfig.direction === 'asc' ? 1 : -1) * (aVal > bVal ? 1 : -1);
    });

    const paginatedSrvs = sortedSrvs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 p-6 space-y-10 pb-32">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="heading-xl flex items-center gap-4">
                        <Receipt className="w-8 h-8 text-indigo-600" />
                        Receipt Vouchers
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">Execute inbound reconciliation and quality audits</p>
                </div>
                <label className="btn-premium btn-primary shadow-xl bg-gradient-to-r from-indigo-600 to-blue-600">
                    <Upload className="w-4 h-4" />
                    Ingest Vouchers
                    <input type="file" multiple hidden onChange={handleFileSelect} />
                </label>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KpiCard title="Reconciliation Count" value={stats.total_srvs} icon={Layers} color="indigo" trend="Global Vol" />
                    <KpiCard title="Accepted Qty" value={stats.total_received_qty} icon={CheckCircle2} color="emerald" trend="Verified" />
                    <KpiCard title="Rejected Qty" value={stats.total_rejected_qty} icon={XCircle} color="rose" trend="Audit Required" />
                </div>
            )}

            {selectedFiles.length > 0 && (
                <GlassCard className="p-6 border-dashed border-indigo-200 bg-indigo-50/10 flex items-center justify-between animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-4">
                        <Loader2 className={`w-8 h-8 ${uploading ? 'animate-spin text-indigo-600' : 'text-slate-300'}`} />
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest text-indigo-700">{uploading ? 'Processing Data' : `${selectedFiles.length} Records Selected`}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                                {uploading ? `Processing batch... ${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` : 'Ready for system ingestion'}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        {!uploading && <button onClick={() => setSelectedFiles([])} className="btn-premium btn-ghost">Cancel</button>}
                        <button onClick={handleUpload} disabled={uploading} className="btn-premium btn-primary px-8">
                            {uploading ? "Syncing..." : "Start Ingestion"}
                        </button>
                    </div>
                </GlassCard>
            )}

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
                    <h2 className="heading-md uppercase tracking-wider text-slate-800">Inbound Inventory</h2>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="SEARCH BY SRV OR PO..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-premium pl-12 font-bold uppercase tracking-widest text-[10px]"
                        />
                    </div>
                </div>

                <div className="glass-panel overflow-x-auto">
                    <DenseTable
                        data={paginatedSrvs}
                        columns={columns}
                        onSort={(key) => {
                            setSortConfig(prev => ({
                                key,
                                direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
                            }));
                        }}
                        sortConfig={sortConfig}
                        onRowClick={(srv) => router.push(`/srv/${srv.srv_number}`)}
                        className="bg-transparent border-none rounded-none min-w-[1000px]"
                    />
                    <div className="p-4 border-t border-white/20 bg-white/10">
                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredSrvs.length}
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

function KpiCard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <GlassCard className="p-6 h-[110px] flex flex-col justify-between group border-white/60">
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-label uppercase opacity-60 m-0">{title}</span>
                    <div className="text-xl font-black text-slate-800 tracking-tighter mt-1 group-hover:text-indigo-600 transition-colors uppercase">{value.toLocaleString()}</div>
                </div>
                <div className={`p-2 rounded-xl bg-${color}-50/50 border border-${color}-100 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-4 h-4 text-${color}-600`} />
                </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase mt-2">
                <Activity className="w-3 h-3" /> {trend}
            </div>
        </GlassCard>
    );
}
