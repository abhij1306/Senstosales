"use client";

import { useEffect, useState, Suspense } from "react";
import { Plus, Edit2, Trash2, FileText, X, CheckSquare, Loader2, Quote, Sparkles } from "lucide-react";
import { api, PONote } from '@/lib/api';
import GlassCard from "@/components/ui/GlassCard";

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
            <div className="flex items-center justify-center min-h-[50vh] animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 p-6 space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="heading-xl flex items-center gap-4">
                        <Sparkles className="w-8 h-8 text-blue-500" />
                        Document Templates
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">Reusable terms and conditions for purchase orders & challans</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ title: "", content: "" });
                        setEditingId(null);
                        setShowForm(true);
                    }}
                    className="btn-premium btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    New Template
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-xl glass-panel p-0 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-white/20 bg-white/20 flex items-center justify-between">
                            <div>
                                <h2 className="heading-md uppercase tracking-widest text-blue-700">
                                    {editingId ? "Update Template" : "New Template"}
                                </h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Template Configuration</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-label">Template Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="input-premium font-bold"
                                    placeholder="e.g., Standard Warranty Clause"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-label">Template Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={10}
                                    className="input-premium resize-none leading-relaxed text-sm"
                                    placeholder="Enter documentation text..."
                                    required
                                />
                            </div>

                            <div className="flex gap-4 justify-end pt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="btn-premium btn-ghost">Cancel</button>
                                <button type="submit" className="btn-premium btn-primary px-8">
                                    {editingId ? "Save Changes" : "Create Template"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map((template) => (
                    <GlassCard key={template.id} variant="interact" className="flex flex-col h-full hover:ring-2 hover:ring-blue-100 p-0 overflow-hidden">
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50/50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm group-hover:scale-110 transition-transform">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{template.title}</h3>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(template)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(template.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 bg-white/30 rounded-2xl p-4 border border-white/40 shadow-inner">
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{template.content}</p>
                            </div>

                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    VER. {new Date(template.updated_at).getFullYear()}.{new Date(template.updated_at).getMonth() + 1}
                                </span>
                                <span className="badge-premium badge-emerald">
                                    <CheckSquare className="w-3 h-3 mr-1" /> Active
                                </span>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {templates.length === 0 && (
                <GlassCard className="text-center py-24 flex flex-col items-center justify-center border-dashed border-slate-300">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <Quote className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="heading-md mb-2">No templates configured</h3>
                    <p className="text-sm text-slate-500 mb-8 max-w-sm italic">Standardize your document terms for faster processing.</p>
                    <button onClick={() => setShowForm(true)} className="btn-premium btn-primary">
                        <Plus className="w-4 h-4" /> Setup First Template
                    </button>
                </GlassCard>
            )}
        </div>
    );
}

export default function PONotesPage() {
    return (
        <Suspense fallback={<div className="p-32 text-center animate-pulse text-blue-500 font-bold">Initializing Engine...</div>}>
            <PONotesContent />
        </Suspense>
    );
}
