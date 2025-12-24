"use client";

import { useEffect, useState, Suspense } from "react";
import { Plus, Edit2, Trash2, FileText, X, CheckSquare, Loader2, Quote } from "lucide-react";
import { api, PONote } from '@/lib/api';
import { Card } from "@/components/ui/Card";


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
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
                <div className="text-purple-600 font-medium animate-pulse flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading templates...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-4 md:p-8 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                            <Quote className="w-6 h-6 text-purple-600" />
                            PO Note Templates
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Manage reusable notes and terms for purchase orders & challans</p>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({ title: "", content: "" });
                            setEditingId(null);
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all text-sm font-semibold active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Template
                    </button>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowForm(false)}
                        />

                        {/* Modal Content */}
                        <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">
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
                                    <X className="w-5 h-5" />
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
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all shadow-sm"
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
                                            rows={8}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all shadow-sm resize-none leading-relaxed"
                                            placeholder="Enter note text..."
                                            required
                                        />
                                        <div className="absolute bottom-3 right-3 text-[10px] text-slate-300 font-bold bg-white/80 px-2 py-0.5 rounded-full pointer-events-none border border-slate-100">
                                            {formData.content.length} chars
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex gap-3 justify-end pt-2 border-t border-slate-50 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            setEditingId(null);
                                            setFormData({ title: "", content: "" });
                                        }}
                                        className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-[0.98]"
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
                        <Card key={template.id} variant="glass" padding="none" className="group flex flex-col h-full hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 border-white/60">
                            <div className="p-5 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100 shadow-sm group-hover:bg-purple-100 transition-colors">
                                            <FileText className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <h3 className="text-[14px] font-bold text-slate-700 line-clamp-1 group-hover:text-purple-700 transition-colors" title={template.title}>{template.title}</h3>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                                        <button
                                            onClick={() => handleEdit(template)}
                                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 bg-slate-50/50 rounded-xl border border-slate-200/50 p-3 mb-4 group-hover:border-purple-200/50 transition-colors">
                                    <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed whitespace-pre-wrap">{template.content}</p>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                                    <div className="text-[10px] font-medium text-slate-400">
                                        Updated {new Date(template.updated_at).toLocaleDateString()}
                                    </div>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                        <CheckSquare className="w-3 h-3" /> Active
                                    </span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {templates.length === 0 && (
                    <Card variant="glass" className="text-center py-16 flex flex-col items-center justify-center border-dashed border-slate-300 bg-white/40">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-inner">
                            <FileText className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-1">No templates found</h3>
                        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Create reusable notes to speed up your workflow and ensure consistency across your documents.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all text-sm font-bold"
                        >
                            <Plus className="w-4 h-4" />
                            Create First Template
                        </button>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default function PONotesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
                <div className="text-purple-600 font-medium animate-pulse flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading...
                </div>
            </div>
        }>
            <PONotesContent />
        </Suspense>
    );
}
