"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, FileText, X, CheckSquare } from "lucide-react";
import { api, PONote } from '@/lib/api';

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
            setTemplates(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to load templates:", err);
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
        if (!confirm("Are you sure you want to delete this template?")) return;

        try {
            await api.deletePONote(id.toString());
            loadTemplates();
        } catch (err) {
            console.error("Failed to delete template:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-primary font-medium">Loading templates...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-2">
                <div>
                    <h1 className="text-[20px] font-semibold text-text-primary tracking-tight">PO Notes Templates</h1>
                    <p className="text-[13px] text-text-secondary mt-1">Manage reusable notes for delivery challans</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ title: "", content: "" });
                        setEditingId(null);
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Template
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowForm(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                                    {editingId ? "Edit Template" : "New Template"}
                                </h2>
                                <p className="text-[11px] text-slate-500 font-medium">
                                    {editingId ? "Update existing note template" : "Create a new reusable note"}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Template Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                    placeholder="e.g., Standard Warranty Terms"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Template Content
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        rows={6}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm resize-none"
                                        placeholder="Enter text..."
                                        required
                                    />
                                    <div className="absolute bottom-3 right-3 text-[10px] text-slate-300 font-medium pointer-events-none">
                                        {formData.content.length} chars
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                        setFormData({ title: "", content: "" });
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.98]"
                                >
                                    {editingId ? "Update Template" : "Create Template"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        className="glass-card p-6 group flex flex-col h-full"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-indigo-100/50">
                                    <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-[14px] font-semibold text-text-primary line-clamp-1" title={template.title}>{template.title}</h3>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(template)}
                                    className="p-1.5 text-text-secondary hover:text-primary hover:bg-blue-50 rounded transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(template.id)}
                                    className="p-1.5 text-text-secondary hover:text-danger hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-50/50 rounded border border-border/50 p-3 mb-4">
                            <p className="text-[13px] text-text-secondary line-clamp-4 leading-relaxed whitespace-pre-wrap">{template.content}</p>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                            <div className="text-[11px] text-text-secondary/70">
                                Updated {new Date(template.updated_at).toLocaleDateString()}
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                                <CheckSquare className="w-3 h-3" /> Active
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="text-center py-16 bg-white/40 border border-dashed border-border rounded-xl">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                        <FileText className="w-8 h-8 text-text-secondary/50" />
                    </div>
                    <h3 className="text-[16px] font-medium text-text-primary mb-1">No templates yet</h3>
                    <p className="text-[13px] text-text-secondary mb-6">Create reusable notes to speed up your workflow</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Create First Template
                    </button>
                </div>
            )}
        </div>
    );
}
