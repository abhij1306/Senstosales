"use client";

import React, { useState, useEffect } from 'react';
import { Save, Building2, UserCircle, MapPin, Hash, Phone, Globe, ShieldCheck, Landmark, Activity, Sparkles, Building, Info, UserCheck, AlertOctagon } from 'lucide-react';
import ResetDatabase from '@/components/ResetDatabase';
import GlassCard from "@/components/ui/GlassCard";

interface Settings {
    supplier_name: string;
    supplier_description: string;
    supplier_address: string;
    supplier_gstin: string;
    supplier_contact: string;
    supplier_state: string;
    supplier_state_code: string;

    buyer_name: string;
    buyer_address: string;
    buyer_gstin: string;
    buyer_state: string;
    buyer_state_code: string;
    buyer_place_of_supply: string;
    buyer_designation: string;
}

const defaultSettings: Settings = {
    supplier_name: '',
    supplier_description: '',
    supplier_address: '',
    supplier_gstin: '',
    supplier_contact: '',
    supplier_state: '',
    supplier_state_code: '',
    buyer_name: '',
    buyer_address: '',
    buyer_gstin: '',
    buyer_state: '',
    buyer_state_code: '',
    buyer_place_of_supply: '',
    buyer_designation: '',
};

export default function MyDetailsPage() {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/settings/');
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            const batch = Object.entries(settings).map(([key, value]) => ({ key, value }));
            const response = await fetch('http://localhost:8000/api/settings/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batch),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Global parameters updated successfully.' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: 'Parameter synchronization failed.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Execution failure in ledger sync.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-32 text-center animate-pulse text-blue-600 font-bold uppercase tracking-widest text-xs">Accessing System Configuration...</div>;

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6 space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="heading-xl uppercase tracking-tighter">Global Parameters</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Master configuration for financial documentation</p>
                </div>
                <div className="flex items-center gap-4">
                    {message && (
                        <div className={`px-4 py-2 rounded-xl border-2 flex items-center gap-2 animate-in slide-in-from-right-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
                        </div>
                    )}
                    <button
                        onClick={() => handleUpdate()}
                        disabled={isSaving}
                        className="btn-premium btn-primary bg-slate-800 shadow-xl h-12 px-8"
                    >
                        <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                        {isSaving ? 'SYNCING...' : 'COMMIT CHANGES'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Supplier Details */}
                <GlassCard className="p-0 overflow-hidden border-blue-100/50">
                    <div className="px-8 py-6 border-b border-white/20 bg-blue-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                                <Building className="w-5 h-5" />
                            </div>
                            <h3 className="heading-md uppercase text-xs tracking-widest">Supplier Identity</h3>
                        </div>
                        <Sparkles className="w-4 h-4 text-blue-300" />
                    </div>
                    <div className="p-10 space-y-8">
                        <div className="space-y-2">
                            <label className="text-label">Organization Name</label>
                            <input
                                value={settings.supplier_name}
                                onChange={e => setSettings({ ...settings, supplier_name: e.target.value })}
                                className="input-premium font-black text-lg"
                                placeholder="ENTER COMPANY LEGAL NAME"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-label">Fiscal Activity Description</label>
                            <input
                                value={settings.supplier_description}
                                onChange={e => setSettings({ ...settings, supplier_description: e.target.value })}
                                className="input-premium font-bold italic text-slate-600"
                                placeholder="e.g. MANUFACTURERS OF INDUSTRIAL COMPONENTS"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-label">Registered Headquarters</label>
                            <textarea
                                value={settings.supplier_address}
                                onChange={e => setSettings({ ...settings, supplier_address: e.target.value })}
                                rows={3}
                                className="input-premium font-medium resize-none shadow-inner"
                                placeholder="FULL REGISTERED ADDRESS"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-label">GST Compliance ID</label>
                                <input
                                    value={settings.supplier_gstin}
                                    onChange={e => setSettings({ ...settings, supplier_gstin: e.target.value.toUpperCase() })}
                                    className="input-premium font-black tracking-widest text-blue-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-label">Contact Node</label>
                                <input
                                    value={settings.supplier_contact}
                                    onChange={e => setSettings({ ...settings, supplier_contact: e.target.value })}
                                    className="input-premium font-bold"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-label">Regional State</label>
                                <input
                                    value={settings.supplier_state}
                                    onChange={e => setSettings({ ...settings, supplier_state: e.target.value })}
                                    className="input-premium font-black uppercase"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-label">State Identifier (Code)</label>
                                <input
                                    value={settings.supplier_state_code}
                                    onChange={e => setSettings({ ...settings, supplier_state_code: e.target.value })}
                                    className="input-premium font-black text-center"
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Buyer Details */}
                <GlassCard className="p-0 overflow-hidden border-indigo-100/50">
                    <div className="px-8 py-6 border-b border-white/20 bg-indigo-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                                <UserCheck className="w-5 h-5" />
                            </div>
                            <h3 className="heading-md uppercase text-xs tracking-widest">Client Authority</h3>
                        </div>
                        <Activity className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div className="p-10 space-y-8">
                        <div className="space-y-2">
                            <label className="text-label">Customer Legal Entity</label>
                            <input
                                value={settings.buyer_name}
                                onChange={e => setSettings({ ...settings, buyer_name: e.target.value })}
                                className="input-premium font-black text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-label">Authorized Designation</label>
                            <input
                                value={settings.buyer_designation}
                                onChange={e => setSettings({ ...settings, buyer_designation: e.target.value })}
                                className="input-premium font-bold text-indigo-600"
                                placeholder="e.g. SENIOR ACCOUNTS OFFICER"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-label">Billing Hub Address</label>
                            <textarea
                                value={settings.buyer_address}
                                onChange={e => setSettings({ ...settings, buyer_address: e.target.value })}
                                rows={3}
                                className="input-premium font-medium resize-none shadow-inner"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-label">Buyer GSTIN</label>
                                <input
                                    value={settings.buyer_gstin}
                                    onChange={e => setSettings({ ...settings, buyer_gstin: e.target.value.toUpperCase() })}
                                    className="input-premium font-black tracking-widest text-indigo-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-label">Point of Supply</label>
                                <input
                                    value={settings.buyer_place_of_supply}
                                    onChange={e => setSettings({ ...settings, buyer_place_of_supply: e.target.value })}
                                    className="input-premium font-bold"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-label">Customer Region</label>
                                <input
                                    value={settings.buyer_state}
                                    onChange={e => setSettings({ ...settings, buyer_state: e.target.value })}
                                    className="input-premium font-black uppercase"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-label">Region Code</label>
                                <input
                                    value={settings.buyer_state_code}
                                    onChange={e => setSettings({ ...settings, buyer_state_code: e.target.value })}
                                    className="input-premium font-black text-center"
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="pt-10 border-t border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                    <AlertOctagon className="w-6 h-6 text-rose-500" />
                    <h2 className="heading-md uppercase tracking-widest text-rose-600">Critical Operations Vault (Danger Zone)</h2>
                </div>
                <GlassCard className="p-8 border-rose-100 bg-rose-50/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="max-w-2xl">
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-1">System Hard Reset</h3>
                            <p className="text-xs text-slate-400 font-bold leading-relaxed">THIS ACTION WILL PERMANENTLY ERASE ALL LEDGERS, PROCUREMENT CONTRACTS, AND LOGISTIC RECORDS. DATA RECOVERY IS IMPOSSIBLE ONCE INITIATED.</p>
                        </div>
                        <ResetDatabase />
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
