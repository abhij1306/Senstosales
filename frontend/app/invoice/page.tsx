"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Plus, Download, TrendingUp, FileText, AlertCircle, Layers, Clock, Activity } from "lucide-react";
import { api, InvoiceListItem, InvoiceStats } from "@/lib/api";
import { formatDate, formatIndianCurrency } from "@/lib/utils";
import { ListPageTemplate } from "@/components/design-system/templates/ListPageTemplate";
import { SearchBar as AtomicSearchBar } from "@/components/design-system/molecules/SearchBar";
import { Accounting, TableCells, Body } from '@/components/design-system';
import { Button } from "@/components/design-system/atoms/Button";
import { Badge } from "@/components/design-system/atoms/Badge";
import type { Column, SummaryCardProps } from "@/components/design-system";

export default function InvoicePage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
    const [stats, setStats] = useState<InvoiceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invoicesData, statsData] = await Promise.all([
                    api.listInvoices(),
                    api.getInvoiceStats()
                ]);
                setInvoices(invoicesData || []);
                setStats(statsData);
            } catch (err) {
                console.error("Invoice Load Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv =>
            inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.customer_gstin && inv.customer_gstin.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [invoices, searchQuery]);

    // Table columns
    const columns: Column<InvoiceListItem>[] = [
        {
            key: "invoice_number",
            label: "Invoice Number",
            sortable: true,
            width: "15%",
            render: (_value, inv) => (
                <div
                    onClick={() => router.push(`/invoice/${encodeURIComponent(inv.invoice_number)}`)}
                    className="text-[#1A3D7C] font-medium cursor-pointer hover:underline"
                >
                    {inv.invoice_number}
                </div>
            )
        },
        {
            key: "invoice_date",
            label: "Date",
            sortable: true,
            width: "12%",
            render: (_value, inv) => (
                <span className="text-[#6B7280] whitespace-nowrap">{formatDate(inv.invoice_date)}</span>
            )
        },
        {
            key: "linked_dc_numbers",
            label: "Linked DCs",
            width: "15%",
            render: (_value, inv) => (
                <div className="flex flex-wrap gap-1">
                    {inv.linked_dc_numbers ? inv.linked_dc_numbers.split(',').map((dc: string, i: number) => (
                        <Badge
                            key={i}
                            variant="secondary"
                            className="cursor-pointer hover:bg-[#1A3D7C]/10 text-[10px]"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dc/${dc.trim()}`);
                            }}
                        >
                            {dc.trim()}
                        </Badge>
                    )) : <span className="text-[#9CA3AF] italic text-[11px]">Direct</span>}
                </div>
            )
        },
        {
            key: "po_numbers",
            label: "Linked POs",
            width: "18%",
            render: (_value, inv) => (
                <div className="flex flex-wrap gap-1">
                    {inv.po_numbers ? inv.po_numbers.split(',').map((po: string, i: number) => (
                        <Badge
                            key={i}
                            variant="outline"
                            className="cursor-pointer hover:bg-[#1A3D7C]/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/po/${po.trim()}`);
                            }}
                        >
                            {po.trim()}
                        </Badge>
                    )) : <span className="text-[#9CA3AF] italic text-[12px]">Direct</span>}
                </div>
            )
        },
        {
            key: "customer_gstin",
            label: "Customer GSTIN",
            width: "20%",
            render: (_value, inv) => (
                <span className="font-mono text-[12px]">{inv.customer_gstin || 'N/A'}</span>
            )
        },
        {
            key: "total_value",
            label: "Total Value",
            sortable: true,
            align: "right",
            width: "15%",
            render: (_value, inv) => (
                <Accounting isCurrency className="text-slate-950 font-medium">{inv.total_value}</Accounting>
            )
        },
        {
            key: "igst",
            label: "IGST",
            align: "right",
            width: "10%",
            render: (_value, inv) => (
                <span className="text-[#6B7280] text-[12px] tabular-nums">{formatIndianCurrency(inv.igst || 0)}</span>
            )
        },
        {
            key: "status",
            label: "Status",
            sortable: true,
            width: "10%",
            render: (_value, inv) => (
                <Badge variant={inv.status === 'Paid' ? 'success' : 'warning'}>
                    {inv.status || 'Pending'}
                </Badge>
            )
        }
    ];

    // Summary cards
    const summaryCards: SummaryCardProps[] = [
        {
            title: 'Total Invoices',
            value: <Accounting className="text-xl text-white">{invoices.length}</Accounting>,
            icon: <Receipt size={24} />,
            variant: 'primary',
        },
        {
            title: 'Paid Invoices',
            value: <Accounting className="text-xl text-white">{formatIndianCurrency(stats?.total_invoiced || 0)}</Accounting>,
            icon: <Clock size={24} />,
            variant: 'success'
        },
        {
            title: 'Pending Payments',
            value: <Accounting className="text-xl text-white">{formatIndianCurrency(stats?.pending_payments || 0)}</Accounting>,
            icon: <Clock size={24} />,
            variant: 'warning'
        },
        {
            title: 'Total Invoiced',
            value: <Accounting isCurrency className="text-xl text-white">{stats?.total_invoiced || 0}</Accounting>,
            icon: <Activity size={24} />,
            variant: 'secondary'
        }
    ];

    // Toolbar
    const toolbar = (
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full max-w-md">
                <AtomicSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by invoice number or GSTIN..."
                />
            </div>
            <div className="flex items-center gap-3">
                <Button variant="default" size="sm" onClick={() => router.push('/invoice/create')}>
                    <Plus size={16} />
                    Create New
                </Button>
            </div>
        </div>
    );

    return (
        <ListPageTemplate
            title="GST Invoices"
            subtitle="Manage all billing documentation and compliance"
            toolbar={toolbar}
            summaryCards={summaryCards}
            columns={columns}
            data={filteredInvoices}
            keyField="invoice_number"
            exportable
            onExport={() => window.open(`${api.baseUrl}/api/reports/register/invoice?export=true`, '_blank')}
            loading={loading}
            emptyMessage="No invoices found"
        />
    );
}
