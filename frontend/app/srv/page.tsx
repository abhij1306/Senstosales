"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Receipt,
  Layers,
  Clock,
  Activity,
  FileText,
  AlertCircle,
  Plus,
  Search,
  X,
  ExternalLink,
  ChevronRight
} from "lucide-react";

import { api, API_BASE_URL } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";

// Atomic Design Components
import { DocumentTemplate } from "@/components/design-system/templates/DocumentTemplate";
import { ListPageTemplate } from "@/components/design-system/templates/ListPageTemplate";
import { GlassContainer } from "@/components/design-system/atoms/GlassContainer";
import {
  Accounting,
  H1,
  H3,
  Label,
  Body,
  SmallText
} from "@/components/design-system/atoms/Typography";
import { Button } from "@/components/design-system/atoms/Button";
import { Input } from "@/components/design-system/atoms/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/design-system/molecules/Dialog";
import { StatusBadge } from "@/components/design-system/organisms/StatusBadge";
import type { Column } from "@/components/design-system/organisms/DataTable";
import type { SummaryCardProps } from "@/components/design-system/organisms/SummaryCards";

export default function SRVListPage() {
  const router = useRouter();
  const [srvs, setSrvs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const isCancelled = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, [searchQuery, page, pageSize]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [srvData, statsData] = await Promise.all([
        api.listSRVs(undefined, (page - 1) * pageSize, pageSize),
        api.getSRVStats()
      ]);

      setSrvs(srvData);
      setStats(statsData);
      setTotalItems(statsData?.total_srvs || 0);
    } catch (err) {
      console.error(err);
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
    let processedCount = 0;

    try {
      const CHUNK_SIZE = 5; // Smaller chunk for SRVs initially
      for (let i = 0; i < selectedFiles.length; i += CHUNK_SIZE) {
        if (isCancelled.current) break;
        const chunk = selectedFiles.slice(i, i + CHUNK_SIZE);
        await api.uploadSRVBatch(chunk);
        processedCount += chunk.length;
        setUploadProgress({
          current: processedCount,
          total: selectedFiles.length,
        });
        // Brief delay for UI updates
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!isCancelled.current) {
        await loadData();
        setSelectedFiles([]);
      }
    } catch (err) {
      console.error("Upload Error:", err);
    } finally {
      setUploading(false);
      isCancelled.current = false;
    }
  };

  const handleDelete = useCallback(async (srvNumber: string) => {
    if (!confirm(`Permanently delete SRV #${srvNumber}?`)) return;
    try {
      await fetch(`${API_BASE_URL}/api/srv/${srvNumber}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  }, []);

  const columns: Column<any>[] = useMemo(() => [
    {
      key: "srv_number",
      label: "SRV VOUCHER",
      width: "15%",
      render: (v: any) => (
        <div className="flex flex-col">
          <Link href={`/srv/${v}`} className="font-black text-blue-600 hover:underline flex items-center gap-1">
            #{v}
            <ChevronRight size={12} />
          </Link>
          <SmallText className="text-slate-400 font-medium uppercase tracking-tighter">Inbound Receipt</SmallText>
        </div>
      ),
    },
    {
      key: "srv_date",
      label: "DATE",
      width: "12%",
      render: (v) => (
        <span className="text-slate-600 font-bold">{formatDate(v as string)}</span>
      ),
    },
    {
      key: "po_number",
      label: "PO REFERENCE",
      width: "12%",
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <Link href={`/po/${v}`} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-black border border-slate-200 hover:bg-slate-200 transition-colors">
            {v}
          </Link>
          {!row.po_found && (
            <AlertCircle size={14} className="text-rose-500" />
          )}
        </div>
      ),
    },
    {
      key: "total_accepted_qty",
      label: "ACCEPTED",
      align: "right",
      width: "12%",
      render: (v) => (
        <Accounting className="text-emerald-600 font-black">{v}</Accounting>
      ),
    },
    {
      key: "total_rejected_qty",
      label: "REJECTED",
      align: "right",
      width: "12%",
      render: (v) => (
        <Accounting className={cn(Number(v) > 0 ? "text-rose-500 font-bold" : "text-slate-300 font-medium")}>{v}</Accounting>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "5%",
      render: (_, row) => (
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.srv_number)} className="text-slate-300 hover:text-rose-600">
          <Trash2 size={14} />
        </Button>
      )
    }
  ], [handleDelete]);

  const summaryCards: SummaryCardProps[] = useMemo(() => [
    {
      title: "Active Vouchers",
      value: stats?.total_srvs || 0,
      icon: <Layers size={20} />,
      variant: "default",
    },
    {
      title: "Accepted Volume",
      value: stats?.total_received_qty || 0,
      icon: <CheckCircle2 size={20} />,
      variant: "success",
    },
    {
      title: "Rejection Rate",
      value: `${stats?.rejection_rate || 0}%`,
      icon: <XCircle size={20} />,
      variant: "warning",
    },
  ], [stats]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return srvs;
    const q = searchQuery.toLowerCase();
    return srvs.filter(s =>
      s.srv_number?.toLowerCase().includes(q) ||
      s.po_number?.toString().includes(q)
    );
  }, [srvs, searchQuery]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Master Reference: Toolbar Construction (Atomic)
  const toolbar = (
    <div className="flex items-center gap-4 w-full justify-between">
      <div className="w-80 relative">
        <Input
          id="srv-search"
          name="srv-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by SRV or PO..."
          className="pl-10 h-11 bg-white/50 border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      </div>
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".html"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="default"
          size="default"
          className="shadow-lg shadow-blue-500/20 px-6 font-bold uppercase tracking-wider text-[10px] cursor-pointer"
          onClick={handleUploadClick}
        >
          <Upload size={16} className="mr-2" />
          Ingest HTML
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <ListPageTemplate
        title="MATERIAL RECEIPTS"
        subtitle="Comprehensive audit trail for Stores Receipt Vouchers (SRV)"
        columns={columns}
        data={filteredData}
        loading={loading}
        keyField="srv_number"
        summaryCards={summaryCards}
        toolbar={toolbar}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
      />

      {/* Floating Action Button (FAB) - Appears when files selected */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
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
              <span className="font-black uppercase tracking-[0.15em]">
                Process {selectedFiles.length} SRVs
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <Dialog
        open={uploading || selectedFiles.length > 0}
        onOpenChange={(open) => {
          if (!open && !uploading) setSelectedFiles([]);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{uploading ? "BATCH INGESTION" : "CONFIRM SRV UPLOAD"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {!uploading ? (
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={32} />
                </div>
                <H3>{selectedFiles.length} Documents Selected</H3>
                <Body className="text-slate-500">
                  SRV HTML files will be parsed, items extracted, and linked to POs.
                </Body>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Cinematic Card Stack Animation */}
                <div className="relative h-32 flex items-center justify-center perspective-1000">
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
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                              <FileText size={12} className="text-white" />
                            </div>
                            <SmallText className="uppercase text-slate-400 truncate w-full">
                              {file.name}
                            </SmallText>
                          </div>
                          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-emerald-500"
                              initial={{ width: "0%" }}
                              animate={{ width: idx === 0 ? "100%" : "0%" }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <Label className="text-blue-600 uppercase mb-1">
                        Status
                      </Label>
                      <Body className="text-slate-900 font-medium">
                        Processing {uploadProgress.current} of{" "}
                        {uploadProgress.total} files
                      </Body>
                    </div>
                    <div className="text-right">
                      <Label className="text-slate-400 uppercase mb-1">
                        Progress
                      </Label>
                      <div className="text-sm font-mono font-bold text-slate-900">
                        {Math.round(
                          (uploadProgress.current / uploadProgress.total) * 100,
                        ) || 0}
                        %
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="bg-blue-600 h-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full mt-4">
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
