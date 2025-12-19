"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, InvoiceListItem, InvoiceStats } from "@/lib/api";
import { Plus, Search, Filter, Download, ListFilter, TrendingUp, AlertCircle, FileText, CheckCircle, Calendar as CalendarIcon, Eye } from "lucide-react";
import Pagination from "@/components/Pagination";

export default function InvoicePage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
    const [stats, setStats] = useState<InvoiceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Statuses");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invoicesData, statsData] = await Promise.all([
                    api.listInvoices(),
                    api.getInvoiceStats()
                ]);
                setInvoices(invoicesData);
                setStats(statsData);
            } catch (err) {
                console.error("Failed to load invoice data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Helper to determine status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-amber-100 text-amber-800';
            case 'Issued': return 'bg-blue-50 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Filter logic
    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch =
            inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.customer_gstin && inv.customer_gstin.toLowerCase().includes(searchQuery.toLowerCase()));

        // Status filtering can be re-enabled when status is available in API
        // const matchesStatus = statusFilter === 'All Statuses' || inv.status === statusFilter;

        return matchesSearch;
    });

    // Pagination Logic
    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading Invoices...</div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
            {/* Page Header */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GST Invoices</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage invoices, track payments, and link delivery challans.</p>
                    </div>
                    <button
                        onClick={() => router.push('/invoice/create')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Invoice
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Invoiced */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Invoiced</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                ₹{stats.total_invoiced.toLocaleString('en-IN')}
                            </h3>
                            <div className="flex items-center mt-2 text-green-600 text-sm font-medium">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                <span>{stats.total_invoiced_change}% from last month</span>
                            </div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>

                    {/* Pending Payments */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Payments</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                ₹{stats.pending_payments.toLocaleString('en-IN')}
                            </h3>
                            <div className="mt-2 text-gray-500 text-sm font-medium">
                                {stats.pending_payments_count} Invoices unpaid
                            </div>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>

                    {/* GST Collected */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total GST Collected</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                ₹{stats.gst_collected.toLocaleString('en-IN')}
                            </h3>
                            <div className="flex items-center mt-2 text-green-600 text-sm font-medium">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                <span>{stats.gst_collected_change}% from last month</span>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Filters & Actions */}
                <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Invoice # or Customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="flex gap-4 w-full sm:w-auto items-center">
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px]"
                            >
                                <option>All Statuses</option>
                                <option>Paid</option>
                                <option>Pending</option>
                                <option>Overdue</option>
                            </select>
                            <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" title="Download Report">
                                <Download className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" title="More Filters">
                                <ListFilter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 text-gray-500 border-b border-gray-200 text-xs uppercase tracking-wider font-semibold">
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Invoice #</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Linked Challans</th>
                                <th className="px-6 py-4 text-right">Taxable Amt</th>
                                <th className="px-6 py-4 text-right">Total Amt</th>
                                <th className="px-6 py-4 text-center w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="w-12 h-12 text-gray-300 mb-3" />
                                            <h3 className="text-lg font-medium text-gray-900">No invoices found</h3>
                                            <p className="text-gray-500 text-sm mt-1 max-w-sm">Try adjusting your search or filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedInvoices.map((invoice) => {
                                    // Default status to 'Issued' until payment tracking is implemented
                                    const status = 'Issued';

                                    return (
                                        <tr key={invoice.invoice_number} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <button
                                                    onClick={() => router.push(`/invoice/${invoice.invoice_number}`)}
                                                    className="text-blue-600 font-semibold hover:text-blue-800 hover:underline"
                                                >
                                                    {invoice.invoice_number}
                                                </button>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-600 font-medium">
                                                {invoice.invoice_date}
                                            </td>
                                            <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                {invoice.customer_gstin || 'Unknown Customer'}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {invoice.linked_dc_numbers ? invoice.linked_dc_numbers.split(',').map((dc, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200 font-medium">
                                                            {dc.trim()}
                                                        </span>
                                                    )) : (
                                                        <span className="text-gray-400 text-xs italic">--</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm text-gray-600 font-medium">
                                                {invoice.taxable_value ? `₹${invoice.taxable_value.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                                                {invoice.total_invoice_value ? `₹${invoice.total_invoice_value.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <button
                                                    onClick={() => router.push(`/invoice/${invoice.invoice_number}`)}
                                                    className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-gray-100"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Integrated */}
                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredInvoices.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}
