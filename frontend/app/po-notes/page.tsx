"use client";

import { useEffect, useState, Suspense } from "react";
import { Plus, Edit2, Trash2, FileText, X, CheckSquare, Quote, Sparkles } from "lucide-react";
import { api, PONote } from '@/lib/api';
import { H1, H3, Body, SmallText, Label } from "@/components/design-system/atoms/Typography";
import { Button } from "@/components/design-system/atoms/Button";
import { Card } from "@/components/design-system/atoms/Card";
import { Input } from "@/components/design-system/atoms/Input";
import { Badge } from "@/components/design-system/atoms/Badge";

function PONotesContent() {
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Body className="text-[#6B7280] animate-pulse">Loading templates...</Body>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <H1>Document Templates</H1>
                    <Body className="text-[#6B7280] mt-1">
                        Reusable terms and conditions for purchase orders & challans
                    </Body>
                </div>
                <Button
                    variant="default"
                    onClick={() => {
                        setFormData({ title: "", content: "" });
                        setEditingId(null);
                        setShowForm(true);
                    }}
                >
                    <Plus size={16} />
                    New Template
                </Button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowForm(false)}
                    />
                    <Card className="relative w-full max-w-xl p-0 shadow-2xl">
                        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                            <div>
                                <H3>{editingId ? "Update Template" : "New Template"}</H3>
                                <SmallText className="text-[#6B7280]">Template Configuration</SmallText>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                                <X size={16} />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Template Title</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Standard Warranty Clause"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Template Content</Label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={10}
                                    className="w-full px-3 py-2 text-[14px] border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A3D7C] resize-none"
                                    placeholder="Enter documentation text..."
                                    required
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="default">
                                    {editingId ? "Save Changes" : "Create Template"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <Card key={template.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 bg-[#1A3D7C]/10 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-[#1A3D7C]" />
                                    </div>
                                    <H3 className="text-[16px] line-clamp-1">{template.title}</H3>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(template)} title="Edit">
                                        <Edit2 size={14} />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)} className="text-[#DC2626] hover:text-[#991B1B]" title="Delete">
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
                                    Ver. {new Date(template.updated_at).getFullYear()}.{new Date(template.updated_at).getMonth() + 1}
                                </SmallText>
                                <Badge variant="success">
                                    <CheckSquare size={12} /> Active
                                </Badge>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {templates.length === 0 && (
                <Card className="text-center py-24 border-dashed border-[#E5E7EB]">
                    <div className="w-16 h-16 bg-[#F9FAFB] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Quote className="w-8 h-8 text-[#D1D5DB]" />
                    </div>
                    <H3 className="mb-2">No templates configured</H3>
                    <Body className="text-[#6B7280] mb-6">Standardize your document terms for faster processing.</Body>
                    <Button onClick={() => setShowForm(true)} variant="default">
                        <Plus size={16} />
                        Setup First Template
                    </Button>
                </Card>
            )}
        </div>
    );
}

export default function PONotesPage() {
    return (
        <Suspense fallback={<div className="p-32 text-center"><Body className="text-[#6B7280] animate-pulse">Loading...</Body></div>}>
            <PONotesContent />
        </Suspense>
    );
}
