'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, TrendingDown } from 'lucide-react';

interface SRVListItem {
    srv_number: string;
    srv_date: string;
    po_number: string;
    total_received_qty: number;
    total_rejected_qty: number;
    created_at: string;
}

interface SRVStats {
    total_srvs: number;
    total_received_qty: number;
    total_rejected_qty: number;
    rejection_rate: number;
}

export default function SRVPage() {
    const [srvs, setSrvs] = useState<SRVListItem[]>([]);
    const [stats, setStats] = useState<SRVStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadSRVs();
        loadStats();
    }, []);

    const loadSRVs = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/srv');
            if (!response.ok) {
                console.error('Failed to load SRVs:', response.status);
                setSrvs([]);
                return;
            }
            const data = await response.json();
            setSrvs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading SRVs:', error);
            setSrvs([]);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/srv/stats');
            if (!response.ok) {
                console.error('Failed to load SRV stats:', response.status);
                return;
            }
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error loading SRV stats:', error);
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
            const response = await fetch('http://localhost:8000/api/srv/upload/batch', {
                method: 'POST',
                body: formData,
            });
            const results = await response.json();
            setUploadResults(results);

            if (results.successful > 0) {
                await loadSRVs();
                await loadStats();
                setSelectedFiles([]);
            }
        } catch (error) {
            console.error('Error uploading SRVs:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // Pagination
    const totalPages = Math.ceil(srvs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSRVs = srvs.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Stores Receipt Vouchers (SRV)</h1>
                    <p className="text-sm text-gray-500 mt-1">Upload and track buyer-generated SRVs</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Total SRVs</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_srvs}</p>
                                </div>
                                <FileText className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Total Received</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        {stats.total_received_qty.toFixed(0)}
                                    </p>
                                </div>
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Total Rejected</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">
                                        {stats.total_rejected_qty.toFixed(0)}
                                    </p>
                                </div>
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Rejection Rate</p>
                                    <p className="text-2xl font-bold text-orange-600 mt-1">
                                        {stats.rejection_rate.toFixed(2)}%
                                    </p>
                                </div>
                                <TrendingDown className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload SRV Files</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="flex-1">
                                <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 cursor-pointer transition-colors">
                                    <div className="text-center">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-gray-700">
                                            {selectedFiles.length > 0
                                                ? `${selectedFiles.length} file(s) selected`
                                                : 'Click to select SRV HTML files'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Supports multiple files</p>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept=".html"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {selectedFiles.length > 0 && (
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
                            </button>
                        )}

                        {uploadResults && (
                            <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                                <p className="text-sm font-medium text-gray-900">
                                    Upload Results: {uploadResults.successful} successful, {uploadResults.failed} failed
                                </p>
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                    {uploadResults.results.map((result: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className={`text-xs p-2 rounded ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                                }`}
                                        >
                                            <span className="font-medium">{result.filename}:</span> {result.message}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* SRV List */}
                <div className="bg-white rounded-xl border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">SRV List</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SRV Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SRV Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Received Qty</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rejected Qty</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            Loading SRVs...
                                        </td>
                                    </tr>
                                ) : paginatedSRVs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No SRVs found. Upload SRV files to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedSRVs.map((srv) => (
                                        <tr key={srv.srv_number} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <a
                                                    href={`/srv/${srv.srv_number}`}
                                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    {srv.srv_number}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{srv.srv_date}</td>
                                            <td className="px-6 py-4">
                                                <a
                                                    href={`/po/${srv.po_number}`}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    {srv.po_number}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-green-600 font-medium">
                                                {srv.total_received_qty.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-red-600 font-medium">
                                                {srv.total_rejected_qty.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <a
                                                    href={`/srv/${srv.srv_number}`}
                                                    className="text-xs text-blue-600 hover:text-blue-800"
                                                >
                                                    View Details
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-700">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, srvs.length)} of{' '}
                                {srvs.length} SRVs
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
