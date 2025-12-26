"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, POListItem, POStats } from "@/lib/api";
import { Dialog } from "@/components/design-system/molecules/Dialog";
import { FileText, Activity, Clock, Plus, Upload, X } from "lucide-react";
import { formatDate, formatIndianCurrency } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/hooks/useDebounce";
import { H1 } from "@/components/design-system/atoms/Typography";
import {
  Accounting,
  Body,
  SmallText,
  Label,
} from "@/components/design-system/atoms/Typography";
import { TableRowCell as TableCells } from "@/components/design-system/molecules/TableCells";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/molecules/Tabs";
import { Button } from "@/components/design-system/atoms/Button";
import { Badge } from "@/components/design-system/atoms/Badge";
import { Input } from "@/components/design-system/atoms/Input";
import { ListPageTemplate } from "@/components/design-system/templates/ListPageTemplate";
import { Column } from "@/components/design-system/organisms/DataTable";
import { SummaryCardProps } from "@/components/design-system/organisms/SummaryCards";

// --- OPTIMIZATION: Static Columns Definitions ---
const columns: Column<POListItem>[] = [
  {
    key: "po_number",
    label: "NUMBER",
    width: "10%",
    render: (_v, row) => (
      <Link
        href={`/po/${row.po_number}`}
        className="font-medium text-[#1A3D7C] hover:underline"
      >
        <motion.span layoutId={`po-title-${row.po_number}`}>
          {row.po_number}
        </motion.span>
      </Link>
    ),
  },
  {
    key: "po_date",
    label: "DATE",
    width: "10%",
    render: (_v, row) => (
      <Body className="text-slate-600">{formatDate(row.po_date)}</Body>
    ),
  },
  {
    key: "po_value",
    label: "VALUE",
    width: "13%",
    align: "right",
    render: (_v, row) => <Accounting isCurrency>{row.po_value}</Accounting>,
  },
  {
    key: "total_items_count",
    label: "Items",
    width: "7%",
    align: "center",
    render: (v) => <Accounting className="text-slate-500">{v}</Accounting>,
  },
  {
    key: "total_ordered_quantity",
    label: "Ord",
    width: "9%",
    align: "right",
    render: (v) => <Accounting>{v}</Accounting>,
  },
  {
    key: "total_dispatched_quantity",
    label: "Dlv",
    width: "10%",
    align: "right",
    render: (v) => <Accounting className="text-green-600">{v}</Accounting>,
  },
  {
    key: "total_pending_quantity",
    label: "Bal",
    width: "9%",
    align: "right",
    render: (v) => <Accounting className="text-orange-600">{v}</Accounting>,
  },
  {
    key: "total_received_quantity",
    label: "Rec",
    width: "10%",
    align: "right",
    render: (v) => <Accounting className="text-blue-600">{v}</Accounting>,
  },
  {
    key: "po_status",
    label: "Status",
    width: "12%",
    render: (_v, row) => (
      <Badge variant={row.po_status === "Active" ? "success" : "default"}>
        {row.po_status}
      </Badge>
    ),
  },
];

export default function POListPage() {
  const router = useRouter();
  const [pos, setPOs] = useState<POListItem[]>([]);
  const [stats, setStats] = useState<POStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const isCancelled = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [posData, statsData] = await Promise.all([
          api.listPOs(),
          api.getPOStats(),
        ]);
        setPOs(posData || []);
        setStats(statsData);
      } catch (err) {
        console.error("PO Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(Array.from(e.target.files || []));
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
        setUploadProgress({
          current: processedCount,
          total: selectedFiles.length,
        });
      }

      if (!isCancelled.current) {
        const [updatedPos, updatedStats] = await Promise.all([
          api.listPOs(),
          api.getPOStats(),
        ]);
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

  const filteredPOs = useMemo(() => {
    return pos.filter(
      (po) =>
        po.po_number
          .toString()
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        po.supplier_name?.toLowerCase().includes(debouncedSearch.toLowerCase()),
    );
  }, [pos, debouncedSearch]);

  // --- OPTIMIZATION: Memoized Summary Cards ---
  const summaryCards = useMemo(
    (): SummaryCardProps[] => [
      {
        title: "Total Orders",
        value: (
          <Accounting className="text-xl text-white">{pos.length}</Accounting>
        ),
        icon: <FileText size={24} />,
        variant: "primary",
      },
      {
        title: "Open Orders",
        value: (
          <Accounting className="text-xl text-white">
            {stats?.open_orders_count || 0}
          </Accounting>
        ),
        icon: <Activity size={24} />,
        variant: "success",
      },
      {
        title: "Pending Approval",
        value: (
          <Accounting className="text-xl text-white">
            {stats?.pending_approval_count || 0}
          </Accounting>
        ),
        icon: <Clock size={24} />,
        variant: "warning",
      },
      {
        title: "Total Value",
        value: (
          <Accounting isCurrency short className="text-xl text-white">
            {stats?.total_value_ytd || 0}
          </Accounting>
        ),
        icon: <Activity size={24} />,
        variant: "secondary",
      },
    ],
    [pos.length, stats],
  );

  const toolbar = (
    <div className="flex items-center gap-3">
      <Input
        id="po-search"
        name="po-search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search POs..."
        className="w-64"
      />
      <div className="relative">
        <input
          type="file"
          multiple
          accept=".html"
          onChange={handleFileSelect}
          className="hidden"
          id="po-upload"
        />
        <label htmlFor="po-upload">
          <Button variant="secondary" size="sm" asChild>
            <span className="cursor-pointer">
              <Upload size={16} />
              Upload HTML
            </span>
          </Button>
        </label>
      </div>
      <Button
        variant="default"
        size="sm"
        onClick={() => router.push("/po/create")}
      >
        <Plus size={16} />
        New PO
      </Button>
    </div>
  );

  return (
    <>
      <ListPageTemplate
        title="PURCHASE ORDERS"
        subtitle="Track procurement contracts and delivery schedules"
        toolbar={toolbar}
        summaryCards={summaryCards}
        columns={columns}
        data={filteredPOs}
        keyField="po_number"
        page={page}
        pageSize={pageSize}
        totalItems={filteredPOs.length}
        onPageChange={(newPage) => setPage(newPage)}
        loading={loading}
        emptyMessage="No purchase orders found"
      />

      <Dialog
        isOpen={uploading || selectedFiles.length > 0}
        onClose={() => {
          if (!uploading) setSelectedFiles([]);
        }}
        title={uploading ? "Uploading Purchase Orders" : "Confirm Upload"}
        maxWidth="max-w-md"
        footer={
          !uploading && (
            <Button variant="default" onClick={handleUpload} className="w-full">
              Start Upload
            </Button>
          )
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Body className="font-medium text-slate-700">
              {uploading
                ? "Processing files..."
                : `${selectedFiles.length} files selected`}
            </Body>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-[#1A3D7C] h-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>
                  {uploadProgress.current} / {uploadProgress.total} processed
                </span>
                <span>
                  {Math.round(
                    (uploadProgress.current / uploadProgress.total) * 100,
                  )}
                  %
                </span>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
