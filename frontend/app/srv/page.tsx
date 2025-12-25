"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle2, XCircle, Loader2, Trash2, Receipt, Layers, Clock, Activity, FileText, AlertCircle, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ListPageTemplate } from "@/components/design-system/templates/ListPageTemplate";
import { SearchBar as AtomicSearchBar } from "@/components/design-system/molecules/SearchBar";
import { Accounting, Body, Badge, Card, Label, Button } from '@/components/design-system';
import type { Column, SummaryCardProps } from "@/components/design-system";

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
}

interface SRVStats {
    total_srvs: number;
    total_received_qty: number;
    total_rejected_qty: number;
    rejection_rate: number;
}

export default function SRVPage() {
    const router = useRouter();
    const [srvs, setSrvs] = useState<SRVListItem[]>([]);
    const [stats, setStats] = useState<SRVStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const isCancelled = useRef(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [srvRes, statsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/srv`),
                fetch(`${API_BASE_URL}/api/srv/stats`)
            ]);
            const srvData = await srvRes.json();
            const statsData = await statsRes.json();
            setSrvs(Array.isArray(srvData) ? srvData : []);
            setStats(statsData);
        } catch (error) {
            console.error('Load Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setSelectedFiles(Array.from(e.target.files));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true);
        setUploadProgress({ current: 0, total: selectedFiles.length });
        isCancelled.current = false;

        try {
            const CHUNK_SIZE = 25;
            for (let i = 0; i < selectedFiles.length; i += CHUNK_SIZE) {
                if (isCancelled.current) break;
                const chunk = selectedFiles.slice(i, i + CHUNK_SIZE);
                const formData = new FormData();
                chunk.forEach(file => formData.append('files', file));
                await fetch(`${API_BASE_URL}/api/srv/upload/batch`, {
                    method: 'POST',
                    body: formData,
                });
                setUploadProgress({ current: Math.min(i + CHUNK_SIZE, selectedFiles.length), total: selectedFiles.length });
            }
            await loadData();
            setSelectedFiles([]);
        } catch (err) {
            console.error('Upload Error:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, srv_number: string) => {
        e.stopPropagation();
        if (!confirm(`Delete SRV ${srv_number}?`)) return;
        try {
            await fetch(`${API_BASE_URL}/api/srv/${srv_number}`, { method: 'DELETE' });
            await loadData();
        } catch (err) {
            console.error('Delete Error:', err);
        }
    };

    const filteredSrvs = srvs.filter(srv =>
        (srv.srv_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (srv.po_number && srv.po_number.toString().includes(searchQuery))
    );

    // Table columns
    const columns: Column<SRVListItem>[] = [
        {
            key: "srv_number",
            label: "SRV Number",
            sortable: true,
            width: "10%",
            render: (_value, srv) => (
                <div onClick={() => router.push(`/srv/${srv.srv_number}`)} className="cursor-pointer">
                    <div className="text-[#1A3D7C] font-medium hover:underline">
                        SRV-{srv.srv_number}
                    </div>
                </div>
            )
        },
        {
            key: "srv_date",
            label: "SRV DATE",
            sortable: true,
            width: "10%",
            render: (v) => (
                <div className="text-[12px] text-[#6B7280]">{formatDate(v as string)}</div>
            )
        },
        {
            key: "po_number",
            label: "PO REF",
            sortable: true,
            width: "8%",
            render: (_value, srv) => (
                <Badge variant="outline">{srv.po_number}</Badge>
            )
        },
        {
            key: "challan_numbers",
            label: "Challan Nos",
            width: "14%",
            render: (_value, srv) => (
                <div className="flex flex-wrap gap-1">
                    {srv.challan_numbers ? srv.challan_numbers.split(',').slice(0, 2).map((num: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{num.trim()}</Badge>
                    )) : <span className="text-[#9CA3AF] text-[12px]">-</span>}
                </div>
            )
        },
        {
            key: "invoice_numbers",
            label: "Invoice Nos",
            width: "14%",
            render: (_value, srv) => (
                <div className="flex flex-wrap gap-1">
                    {srv.invoice_numbers ? srv.invoice_numbers.split(',').slice(0, 2).map((inv: string, i: number) => (
                        <Badge key={i} variant="default" className="text-[10px]">{inv.trim()}</Badge>
                    )) : <span className="text-[#9CA3AF] text-[12px]">None</span>}
                </div>
            )
        },
        {
            key: "total_order_qty",
            label: "ORDERED",
            align: "right",
            width: "8%",
            render: (v) => <Accounting className="text-[#6B7280]">{v}</Accounting>
        },
        {
            key: "total_received_qty",
            label: "RECEIVED",
            align: "right",
            width: "8%",
            render: (v) => <Accounting className="font-medium text-[#1A3D7C]">{v}</Accounting>
        },
        {
            key: "total_accepted_qty",
            label: "ACCEPTED",
            align: "right",
            width: "8%",
            render: (v) => <Accounting className="text-[#16A34A]">{v}</Accounting>
        },
        {
            key: "total_rejected_qty",
            label: "REJECTED",
            align: "right",
            width: "8%",
            render: (v) => <Accounting className="text-[#DC2626]">{v}</Accounting>
        },
        {
            key: "actions",
            label: "",
            width: "6%",
            render: (_value, srv) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(e as any, srv.srv_number)}
                    className="text-[#DC2626] hover:text-[#991B1B]"
                >
                    <Trash2 size={16} />
                </Button>
            )
        }
    ];

    // Summary cards
    const summaryCards: SummaryCardProps[] = [
        {
            title: 'Total SRVs',
            value: <Accounting className="text-xl text-white">{stats?.total_srvs || 0}</Accounting>,
            icon: <Layers size={24} />,
            variant: 'primary',
        },
        {
            title: 'Total Received',
            value: <Accounting className="text-xl text-white">{stats?.total_received_qty || 0}</Accounting>,
            icon: <CheckCircle2 size={24} />,
            variant: 'success',
        },
        {
            title: 'Total Rejected',
            value: <Accounting className="text-xl text-white">{stats?.total_rejected_qty || 0}</Accounting>,
            icon: <XCircle size={24} />,
            variant: 'warning',
        },
        {
            title: 'Rejection Rate',
            value: <Accounting className="text-xl text-white font-medium">{`${((stats?.rejection_rate || 0) * 100).toFixed(1)}%`}</Accounting>,
            icon: <Receipt size={24} />,
            variant: 'secondary'
        }
    ];

    // Toolbar with upload
    const toolbar = (
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full max-w-md">
                <AtomicSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by SRV number or PO..."
                />
            </div>

            {selectedFiles.length > 0 || uploading ? (
                <Card className="p-4 flex items-center gap-4 min-w-96">
                    {uploading ? (
                        <>
                            <Loader2 className="animate-spin text-[#1A3D7C]" size={20} />
                            <div className="flex-1">
                                <div className="text-[14px] font-semibold">Uploading SRVs...</div>
                                <div className="text-[12px] text-[#6B7280]">
                                    {uploadProgress.current} of {uploadProgress.total} processed
                                </div>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => { isCancelled.current = true; }}>
                                Stop
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="flex-1">
                                <div className="text-[14px] font-semibold">{selectedFiles.length} files selected</div>
                            </div>
                            <Button variant="default" size="sm" onClick={handleUpload}>
                                <Upload size={16} />
                                Upload
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedFiles([])}>
                                Cancel
                            </Button>
                        </>
                    )}
                </Card>
            ) : (
                <label>
                    <input type="file" multiple accept=".pdf,.xlsx" onChange={handleFileSelect} className="hidden" />
                    <Button variant="secondary" size="sm" asChild>
                        <span>
                            <Upload size={16} />
                            Upload SRVs
                        </span>
                    </Button>
                </label>
            )}
        </div>
    );

    return (
        <ListPageTemplate
            title="Service Receipt Vouchers"
            subtitle="Manage inbound material receipt and quality inspection"
            toolbar={toolbar}
            summaryCards={summaryCards}
            columns={columns}
            data={filteredSrvs}
            keyField="srv_number"
            loading={loading}
            emptyMessage="No service receipt vouchers found"
        />
    );
}
