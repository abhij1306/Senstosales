"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, POListItem, POStats } from "@/lib/api";
import {
    Upload, X, CheckCircle, XCircle, Loader2, Plus, Search, Filter,
    Download, ListFilter, TrendingUp, AlertCircle, FileText, ClipboardList,
    Clock, DollarSign, Calendar as CalendarIcon
} from "lucide-react";
import Pagination from "@/components/Pagination";

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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

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
            const results: BatchUploadResponse = await api.uploadPOBatch(selectedFiles);
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
            // Optionally set error state here if needed
        } finally {
            setUploading(false);
        }
    };

    // Filter logic
    const filteredPOs = pos.filter(po => {
        const matchesSearch =
            po.po_number.toString().includes(searchQuery) ||
            (po.supplier_name && po.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()));

        // Mock status filtering matching the previous logic or potential new statuses
        const status = po.po_status || 'New';
        const matchesStatus = statusFilter === 'All Statuses' || status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const paginatedPOs = filteredPOs.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Purchase Orders</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage procurement requests, track status, and view history.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/po/create')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create New PO
                    </button>
                    <label className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-2 shadow-sm transition-colors">
                        <Upload className="w-4 h-4" />
                        Upload PO Files
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

            {/* KPI Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Open Orders */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Open Orders</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                {stats.open_orders_count}
                            </h3>
                            <span className="inline-flex mt-2 items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Active
                            </span>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <ClipboardList className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>

                    {/* Pending Approval */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Approval</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                {stats.pending_approval_count}
                            </h3>
                            <span className="inline-flex mt-2 items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                Requires Attention
                            </span>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>

                    {/* Total Value (YTD) */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Value (YTD)</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                ₹{stats.total_value_ytd.toLocaleString('en-IN')}
                            </h3>
                            <div className="flex items-center mt-2 text-green-600 text-sm font-medium">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                <span>{stats.total_value_change}% from last month</span>
                            </div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <DollarSign className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Area (Conditional) */}
            {(selectedFiles.length > 0 || uploadResults) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-sm">
                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-gray-900">
                                    Selected Files ({selectedFiles.length})
                                </h3>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload All
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {selectedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <span className="text-sm text-gray-700">{file.name}</span>
                                        <button
                                            onClick={() => removeFile(idx)}
                                            disabled={uploading}
                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upload Results */}
                    {uploadResults && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Upload Results</h3>
                            <div className="flex gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-sm text-gray-700">
                                        <strong>{uploadResults.successful}</strong> successful
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <span className="text-sm text-gray-700">
                                        <strong>{uploadResults.failed}</strong> failed
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {uploadResults.results.map((result, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg border ${result.success
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-red-50 border-red-100'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {result.success ? (
                                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {result.filename}
                                                </div>
                                                <div className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                                                    {result.message}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by PO number or supplier..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full sm:w-40 pl-10 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option>All Statuses</option>
                                <option>Active</option>
                                <option>New</option>
                                <option>Closed</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l border-gray-300 h-4" />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 text-gray-500 border-b border-gray-200 text-xs uppercase tracking-wider font-semibold">
                                <th className="px-6 py-4 w-12 text-center">
                                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                </th>
                                <th className="px-6 py-4">PO Number</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Value</th>
                                <th className="px-6 py-4 text-center">Ordered</th>
                                <th className="px-6 py-4 text-center">Dispatched</th>
                                <th className="px-6 py-4 text-center">Pending</th>
                                <th className="px-6 py-4">Linked Challans</th>
                                <th className="px-6 py-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredPOs.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="w-12 h-12 text-gray-300 mb-3" />
                                            <h3 className="text-lg font-medium text-gray-900">No purchase orders found</h3>
                                            <p className="text-gray-500 text-sm mt-1 max-w-sm">
                                                Try adjusting your search or filters, or upload a new PO to get started.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedPOs.map((po) => (
                                    <tr key={po.po_number} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-3 text-center">
                                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        </td>
                                        <td className="px-6 py-3">
                                            <Link
                                                href={`/po/${po.po_number}`}
                                                className="text-blue-600 font-semibold hover:text-blue-800 hover:underline"
                                            >
                                                PO-{po.po_number}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-600 font-medium">
                                            {po.po_date || 'N/A'}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-900 font-semibold">
                                            ₹{po.po_value?.toLocaleString('en-IN') || '0'}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-700 text-center font-medium">
                                            {po.total_ordered_qty?.toLocaleString() || '0'}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-blue-600 text-center font-medium">
                                            {po.total_dispatched_qty?.toLocaleString() || '0'}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${po.total_pending_qty > 0
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                {po.total_pending_qty?.toLocaleString() || '0'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm">
                                            {po.linked_dc_numbers ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(() => {
                                                        const dcs = po.linked_dc_numbers.split(',').map(d => d.trim()).filter(Boolean);

                                                        if (dcs.length <= 2) {
                                                            return dcs.map((dc, i) => (
                                                                <Link
                                                                    key={i}
                                                                    href={`/dc/${dc}`}
                                                                    className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100 font-medium hover:bg-indigo-100 transition-colors"
                                                                >
                                                                    {dc}
                                                                </Link>
                                                            ));
                                                        }

                                                        return (
                                                            <div className="relative group">
                                                                <button className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded border border-indigo-200 font-bold hover:bg-indigo-200 transition-colors">
                                                                    {dcs.length} Challans
                                                                </button>
                                                                <div className="absolute left-0 top-full mt-1 hidden group-hover:block w-48 bg-white border border-gray-200 shadow-xl rounded-lg p-2 z-20">
                                                                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-2 px-1 tracking-wider">Linked Challans</div>
                                                                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                                                                        {dcs.map((dc, i) => (
                                                                            <Link
                                                                                key={i}
                                                                                href={`/dc/${dc}`}
                                                                                className="block px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors"
                                                                            >
                                                                                {dc}
                                                                            </Link>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                                                <div className="flex space-x-[3px]">
                                                    <div className="w-1 h-1 bg-current rounded-full" />
                                                    <div className="w-1 h-1 bg-current rounded-full" />
                                                    <div className="w-1 h-1 bg-current rounded-full" />
                                                </div>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredPOs.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}
