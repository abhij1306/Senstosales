"use client";

import { useEffect, useState } from "react";
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

  const loadTemplates = async () => {
    try {
      const data = await api.getPONotes();
      setTemplates(data || []);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  const handleEdit = (template: PONote) => {
    setFormData({ title: template.title, content: template.content });
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this template permanently?")) return;
    try {
      await api.deletePONote(id.toString());
      loadTemplates();
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  };

  const actions = (
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
  );

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
                <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <H3>{editingId ? "Update Template" : "New Template"}</H3>
                    <SmallText className="text-[#6B7280]">
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
                    <Label>Template Content</Label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      rows={10}
                      className="w-full px-3 py-2 text-[14px] border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A3D7C] resize-none"
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
                key={i}
                className="h-64 bg-slate-50/50 rounded-xl border border-slate-100 animate-pulse"
              />
            ))
          ) : (
            <>
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="flex flex-col h-full hover:shadow-lg transition-shadow animate-in"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-[#1A3D7C]/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#1A3D7C]" />
                        </div>
                        <H3 className="text-[16px] line-clamp-1">
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
                          className="text-[#DC2626] hover:text-[#991B1B]"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]">
                      <SmallText className="text-[#6B7280] leading-relaxed whitespace-pre-wrap">
                        {template.content}
                      </SmallText>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E5E7EB]">
                      <SmallText className="text-[#9CA3AF]">
                        Ver. {new Date(template.updated_at).getFullYear()}.
                        {new Date(template.updated_at).getMonth() + 1}
                      </SmallText>
                      <Badge variant="success">
                        <CheckSquare size={12} /> Active
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}

              {templates.length === 0 && (
                <Card className="text-center py-24 border-dashed border-[#E5E7EB] col-span-full">
                  <div className="w-16 h-16 bg-[#F9FAFB] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Quote className="w-8 h-8 text-[#D1D5DB]" />
                  </div>
                  <H3 className="mb-2">No templates configured</H3>
                  <Body className="text-[#6B7280] mb-6">
                    Standardize your document terms for faster processing.
                  </Body>
                  <Button onClick={() => setShowForm(true)} variant="default">
                    <Plus size={16} />
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
