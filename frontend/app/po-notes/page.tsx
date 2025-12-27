"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  X,
  CheckSquare,
  Quote,
} from "lucide-react";
import { api, PONote } from "@/lib/api";
import {
  H3,
  Body,
  SmallText,
  Label,
} from "@/components/design-system/atoms/Typography";
import { Button } from "@/components/design-system/atoms/Button";
import { Card } from "@/components/design-system/atoms/Card";
import { Input } from "@/components/design-system/atoms/Input";
import { Badge } from "@/components/design-system/atoms/Badge";
import { DocumentTemplate } from "@/components/design-system/templates/DocumentTemplate";
import { motion, AnimatePresence } from "framer-motion";

export default function PONotesPage() {
  const [templates, setTemplates] = useState<PONote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "" });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await api.getPONotes();
      setTemplates(data || []);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updatePONote(editingId.toString(), formData);
      } else {
        await api.createPONote(formData);
      }
      setFormData({ title: "", content: "" });
      setEditingId(null);
      setShowForm(false);
      loadTemplates();
    } catch (err) {
      console.error("Failed to save template:", err);
    }
  }, [editingId, formData, loadTemplates]);

  const handleEdit = useCallback((template: PONote) => {
    setFormData({ title: template.title, content: template.content });
    setEditingId(template.id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Delete this template permanently?")) return;
    try {
      await api.deletePONote(id.toString());
      loadTemplates();
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  }, [loadTemplates]);

  const actions = useMemo(() => (
    <Button
      variant="default"
      onClick={() => {
        setFormData({ title: "", content: "" });
        setEditingId(null);
        setShowForm(true);
      }}
      disabled={loading}
    >
      <Plus size={16} />
      New Template
    </Button>
  ), [loading]);

  return (
    <DocumentTemplate
      title="Document Templates"
      description="Reusable terms and conditions for purchase orders & challans"
      actions={actions}
      className="space-y-6"
    >
      <div className="space-y-6">
        {/* Modal remains stable with AnimatePresence */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowForm(false)}
              />
              <Card className="relative w-full max-w-xl p-0 shadow-2xl">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <H3 className="font-semibold">{editingId ? "Update Template" : "New Template"}</H3>
                    <SmallText className="text-slate-500 font-medium">
                      Template Configuration
                    </SmallText>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForm(false)}
                  >
                    <X size={16} />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Template Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="e.g., Standard Warranty Clause"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold uppercase tracking-wider text-[10px] text-slate-500 ml-1">Template Content</Label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      rows={10}
                      className="w-full px-3 py-2 text-[14px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-slate-900 resize-none"
                      placeholder="Enter documentation text..."
                      required
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="default">
                      {editingId ? "Save Changes" : "Create Template"}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Swap with simple conditional - NO nested AnimatePresence for the grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={`skeleton-${i}`}
                className="h-64 bg-slate-50/50 rounded-xl border border-slate-100 animate-pulse"
              />
            ))
          ) : (
            <>
              {templates.map((template, idx) => (
                <Card
                  key={`template-${template.id || idx}`}
                  className="flex flex-col h-full hover:shadow-lg transition-shadow animate-in"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <H3 className="text-[15px] font-semibold text-slate-930 line-clamp-1">
                          {template.title}
                        </H3>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 bg-slate-50/50 rounded-lg p-4 border border-slate-100">
                      <SmallText className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                        {template.content}
                      </SmallText>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <SmallText className="text-slate-400 font-medium">
                        Ver. {new Date(template.updated_at).getFullYear()}.
                        {new Date(template.updated_at).getMonth() + 1}
                      </SmallText>
                      <Badge variant="success" className="font-semibold px-2">
                        <CheckSquare size={12} className="mr-1" /> Active
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}

              {templates.length === 0 && (
                <Card className="text-center py-24 border-dashed border-slate-200 col-span-full">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Quote className="w-8 h-8 text-slate-300" />
                  </div>
                  <H3 className="mb-2 font-semibold">No templates configured</H3>
                  <Body className="text-slate-500 font-medium mb-6">
                    Standardize your document terms for faster processing.
                  </Body>
                  <Button onClick={() => setShowForm(true)} variant="default">
                    <Plus size={16} className="mr-2" />
                    Setup First Template
                  </Button>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </DocumentTemplate>
  );
}
