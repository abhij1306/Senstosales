"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api, POListItem, POStats } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/design-system/molecules/Dialog";
import { FileText, Activity, Clock, Plus, Upload, X, ShoppingCart } from "lucide-react";
import { formatDate, formatIndianCurrency, cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/hooks/useDebounce";
import {
  Accounting,
  Body,
  H1,
  H3,
  Label,
  SmallText,
} from "@/components/design-system/atoms/Typography";
import { Button } from "@/components/design-system/atoms/Button";
import { Badge } from "@/components/design-system/atoms/Badge";
import { Input } from "@/components/design-system/atoms/Input";
import { StatusBadge } from "@/components/design-system/organisms/StatusBadge";
import { SearchBar } from "@/components/design-system/molecules/SearchBar";
import { ListPageTemplate } from "@/components/design-system/templates/ListPageTemplate";
import { type Column } from "@/components/design-system/organisms/DataTable";
import { type SummaryCardProps } from "@/components/design-system/organisms/SummaryCards";
import { useCallback } from "react";
import { Flex, Stack, Box } from "@/components/design-system/atoms/Layout";

// --- OPTIMIZATION: Static Columns Definitions ---
const columns: Column<POListItem>[] = [
  {
    key: "po_number",
    label: "NUMBER",
    width: "10%",
    render: (_value, po) => (
      <Link href={`/po/${po.po_number}`} className="block">
        <Body className="text-blue-600 font-semibold hover:underline">
          {po.po_number}
        </Body>
      </Link>
    ),
  },
  {
    key: "po_date",
    label: "DATE",
    width: "10%",
    render: (v) => (
      <Body className="text-slate-600">{formatDate(String(v))}</Body>
    ),
  },
  {
    key: "po_value",
    label: "VALUE",
    width: "13%",
    align: "right",
    isCurrency: true,
  },
  {
    key: "total_items_count",
    label: "Items",
    width: "7%",
    align: "center",
    isNumeric: true,
  },
  {
    key: "total_ordered_quantity",
    label: "Ord",
    width: "9%",
    align: "right",
    isNumeric: true,
  },
  {
    key: "total_dispatched_quantity",
    label: "Dlv",
    width: "10%",
    align: "right",
    isNumeric: true,
    render: (v) => <Accounting className="text-emerald-600">{Number(v)}</Accounting>,
  },
  {
    key: "total_pending_quantity",
    label: "Bal",
    width: "9%",
    align: "right",
    isNumeric: true,
    render: (v) => <Accounting className="text-amber-500">{Number(v)}</Accounting>,
  },
  {
    key: "total_received_quantity",
    label: "Rec",
    width: "10%",
    align: "right",
    isNumeric: true,
    render: (v) => <Accounting className="text-blue-600">{Number(v)}</Accounting>,
  },
  {
    key: "po_status",
    label: "Status",
    width: "12%",
    render: (v) => <StatusBadge status={String(v)} />,
  },
];

export default function POListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [pos, setPOs] = useState<POListItem[]>([]);
  const [stats, setStats] = useState<POStats>({
    total_pos: 0,
    active_count: 0,
    total_value: 0,
    pending_pos: 0,
    completed_pos: 0,
    total_value_ytd: 0,
    open_orders_count: 0,
    pending_approval_count: 0,
    total_value_change: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const isCancelled = useRef(false);

  // Fetch POs and stats on mount
  useEffect(() => {
    async function fetchPOs() {
      setLoading(true);
      try {
        const [posResponse, statsResponse] = await Promise.all([
          fetch("/api/po/"),
          fetch("/api/po/stats"),
        ]);

        if (!posResponse.ok) {
          throw new Error("Failed to fetch POs");
        }

        const posResult = await posResponse.json();
        const statsResult = await statsResponse.json();

        const posData = posResult.data || posResult;
        const statsData = statsResult.data || statsResult;

        setPOs(posData);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching POs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPOs();
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
      const CHUNK_SIZE = 10;
      for (let i = 0; i < selectedFiles.length; i += CHUNK_SIZE) {
        if (isCancelled.current) break;
        const chunk = selectedFiles.slice(i, i + CHUNK_SIZE);
        await api.uploadPOBatch(chunk);
        processedCount += chunk.length;
        setUploadProgress({
          current: processedCount,
          total: selectedFiles.length,
        });

        // Brief delay to allow main thread to process UI updates
        await new Promise((resolve) => setTimeout(resolve, 100));
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
        value: pos.length,
        icon: <FileText size={24} />,
        variant: "default",
      },
      {
        title: "Open Orders",
        value: stats?.open_orders_count || 0,
        icon: <Activity size={24} />,
        variant: "default",
      },
      {
        title: "Pending Approval",
        value: stats?.pending_approval_count || 0,
        icon: <Clock size={24} />,
        variant: "default",
      },
      {
        title: "Total Value",
        value: formatIndianCurrency(stats?.total_value_ytd || 0),
        icon: <Activity size={24} />,
        variant: "default",
      },
    ],
    [pos.length, stats],
  );

  // Master Reference: Toolbar Construction (Atomic)
  const handleSearch = useCallback((val: string) => {
    setSearchQuery(val);
  }, []);

  const toolbar = (
    <Flex align="center" gap={3}>
      <SearchBar
        value={searchQuery}
        onChange={handleSearch}
        placeholder="Search POs..."
        className="w-64"
      />

      <Box className="relative">
        <input
          type="file"
          multiple
          accept=".html"
          onChange={handleFileSelect}
          className="hidden"
          id="po-upload"
        />
        <label htmlFor="po-upload">
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="cursor-pointer bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm"
          >
            <Flex align="center">
              <Upload size={16} className="mr-2 text-slate-500" />
              <Body className="text-inherit">Upload HTML</Body>
            </Flex>
          </Button>
        </label>
      </Box>

      <Button
        variant="default"
        size="sm"
        onClick={() => router.push("/po/create")}
        className="bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10"
      >
        <Flex align="center">
          <Plus size={16} className="mr-2" />
          <Body className="text-inherit">New PO</Body>
        </Flex>
      </Button>
    </Flex>
  );

  return (
    <>
      <ListPageTemplate
        title="PURCHASE ORDERS"
        subtitle="Track procurement contracts and delivery schedules"
        toolbar={toolbar}
        summaryCards={summaryCards}
        columns={columns as any}
        data={filteredPOs}
        keyField="po_number"
        page={page}
        pageSize={pageSize}
        totalItems={filteredPOs.length}
        onPageChange={(newPage) => setPage(newPage)}
        loading={loading}
        emptyMessage="No purchase orders found"
      />

      {/* Floating Action Button (FAB) */}
      <Stack className="fixed bottom-8 right-8 z-50" gap={4}>
        <AnimatePresence>
          {selectedFiles.length > 0 && !uploading && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              onClick={handleUpload}
              className="group flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.3)] hover:bg-emerald-700 hover:shadow-[0_25px_50px_rgba(16,185,129,0.4)] transition-all active:scale-95"
            >
              <Upload size={20} className="group-hover:bounce" />
              <Body className="font-black uppercase tracking-[0.15em] text-white">
                Process {selectedFiles.length} Docs
              </Body>
            </motion.button>
          )}
        </AnimatePresence>

        <button
          onClick={() => router.push("/po/create")}
          className="w-16 h-16 bg-slate-900 text-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:bg-black hover:scale-110 transition-all active:scale-95 flex items-center justify-center group relative overflow-hidden"
        >
          <Box className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus
            size={28}
            className="group-hover:rotate-90 transition-transform duration-500"
          />
        </button>
      </Stack>

      <Dialog
        isOpen={uploading || selectedFiles.length > 0}
        onClose={() => {
          if (!uploading) setSelectedFiles([]);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{uploading ? "BATCH INGESTION" : "CONFIRM UPLOAD"}</DialogTitle>
          </DialogHeader>

          <Stack gap={6} className="py-4">
            {!uploading ? (
              <Stack align="center" gap={2} className="text-center">
                <Box className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={32} />
                </Box>
                <H3>{selectedFiles.length} Documents Ready</H3>
                <Body className="text-slate-500">
                  Purchase orders will be parsed and synchronized with the central
                  ledger.
                </Body>
              </Stack>
            ) : (
              <Stack gap={8}>
                {/* Cinematic Card Stack Animation */}
                <Flex align="center" justify="center" className="relative h-32 perspective-1000">
                  <AnimatePresence mode="popLayout">
                    {selectedFiles
                      .slice(uploadProgress.current, uploadProgress.current + 3)
                      .map((file, idx) => (
                        <motion.div
                          key={file.name + idx}
                          initial={{ opacity: 0, x: 50, scale: 0.8, rotate: 5 }}
                          animate={{
                            opacity: 1 - idx * 0.3,
                            x: idx * 10,
                            z: -idx * 50,
                            scale: 1 - idx * 0.05,
                            rotate: idx * 2,
                          }}
                          exit={{
                            opacity: 0,
                            x: -150,
                            rotate: -15,
                            transition: { duration: 0.4, ease: "circIn" },
                          }}
                          className="absolute w-48 h-24 bg-white border-2 border-slate-100 rounded-xl shadow-xl p-4 flex flex-col justify-between"
                          style={{
                            boxShadow: `0 ${10 + idx * 5}px ${20 + idx * 10}px rgba(0,0,0,${0.1 - idx * 0.02})`,
                            zIndex: 10 - idx,
                          }}
                        >
                          <Flex align="center" gap={2}>
                            <Box className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                              <FileText size={12} className="text-white" />
                            </Box>
                            <SmallText className="uppercase text-slate-400 truncate w-full">
                              {file.name}
                            </SmallText>
                          </Flex>
                          <Box className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-emerald-500 origin-left"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: idx === 0 ? 1 : 0 }}
                              transition={{ duration: 0.5 }}
                              style={{ width: "100%" }}
                            />
                          </Box>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </Flex>

                <Stack gap={3}>
                  <Flex justify="between" align="end">
                    <Stack>
                      <Label className="text-blue-600 uppercase mb-1">
                        Status
                      </Label>
                      <Body className="text-slate-900 font-medium">
                        Processing {uploadProgress.current} of{" "}
                        {uploadProgress.total} files
                      </Body>
                    </Stack>
                    <Stack className="text-right">
                      <Label className="text-slate-400 uppercase mb-1">
                        Progress
                      </Label>
                      <Body className="text-sm font-mono font-bold text-slate-900">
                        {Math.round(
                          (uploadProgress.current / uploadProgress.total) * 100,
                        )}
                        %
                      </Body>
                    </Stack>
                  </Flex>

                  <Box className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="bg-blue-600 h-full origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      style={{ width: "100%" }}
                    />
                  </Box>
                </Stack>
              </Stack>
            )}
          </Stack>

          <Stack gap={3} className="w-full mt-4">
            {!uploading ? (
              <Button
                variant="default"
                onClick={handleUpload}
                className="w-full py-6 text-sm font-bold uppercase tracking-widest"
              >
                <Upload size={18} className="mr-2" />
                Start Processing
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  isCancelled.current = true;
                }}
                className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <X size={16} className="mr-2" />
                Halt Operation
              </Button>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
