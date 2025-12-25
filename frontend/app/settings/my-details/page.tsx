"use client";

import React, { useState, useEffect } from 'react';
import { Save, Building2, UserCircle, MapPin, Hash, Phone, Globe, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import ResetDatabase from '@/components/ResetDatabase';

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

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
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
                setMessage({ type: 'success', text: 'Details updated successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to update details.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error connecting to server.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center text-slate-500">Loading details...</div>;
    }

    const inputClass = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white";
    const labelClass = "block text-xs font-semibold text-slate-500 mb-1 pointer-events-none uppercase tracking-wider";

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Details</h1>
                    <p className="text-slate-500 mt-1">Manage global default supplier and buyer information used in reports.</p>
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                    }`}>
                    <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{message.text}</span>
                </div>
            )}

            <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Supplier Details Section */}
                <Card className="border-0 shadow-sm bg-slate-50/50">
                    <CardHeader className="border-b border-slate-100 bg-white/50 backdrop-blur-sm rounded-t-xl py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Building2 size={18} />
                            </div>
                            <CardTitle className="text-sm font-bold tracking-tight">Supplier Details (Your Company)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            <div>
                                <label className={labelClass}>Company Name</label>
                                <input
                                    type="text"
                                    value={settings.supplier_name}
                                    onChange={(e) => setSettings({ ...settings, supplier_name: e.target.value })}
                                    className={inputClass}
                                    placeholder="Enter your company name"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Business Description</label>
                                <input
                                    type="text"
                                    value={settings.supplier_description}
                                    onChange={(e) => setSettings({ ...settings, supplier_description: e.target.value })}
                                    className={inputClass}
                                    placeholder="e.g. Manufacturers & Suppliers of..."
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Office Address</label>
                                <textarea
                                    rows={2}
                                    value={settings.supplier_address}
                                    onChange={(e) => setSettings({ ...settings, supplier_address: e.target.value })}
                                    className={inputClass}
                                    placeholder="Complete street address"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>GSTIN/UIN</label>
                                    <input
                                        type="text"
                                        value={settings.supplier_gstin}
                                        onChange={(e) => setSettings({ ...settings, supplier_gstin: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Contact Info</label>
                                    <input
                                        type="text"
                                        value={settings.supplier_contact}
                                        onChange={(e) => setSettings({ ...settings, supplier_contact: e.target.value })}
                                        className={inputClass}
                                        placeholder="Phone or Fax"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>State</label>
                                    <input
                                        type="text"
                                        value={settings.supplier_state}
                                        onChange={(e) => setSettings({ ...settings, supplier_state: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>State Code</label>
                                    <input
                                        type="text"
                                        value={settings.supplier_state_code}
                                        onChange={(e) => setSettings({ ...settings, supplier_state_code: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Buyer Details Section */}
                <Card className="border-0 shadow-sm bg-slate-50/50">
                    <CardHeader className="border-b border-slate-100 bg-white/50 backdrop-blur-sm rounded-t-xl py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <UserCircle size={18} />
                            </div>
                            <CardTitle className="text-sm font-bold tracking-tight">Buyer Details (Key Customer)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            <div>
                                <label className={labelClass}>Customer Name</label>
                                <input
                                    type="text"
                                    value={settings.buyer_name}
                                    onChange={(e) => setSettings({ ...settings, buyer_name: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Authority Designation</label>
                                <input
                                    type="text"
                                    value={settings.buyer_designation}
                                    onChange={(e) => setSettings({ ...settings, buyer_designation: e.target.value })}
                                    className={inputClass}
                                    placeholder="e.g. Sr. Accounts Officer"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Billing Address</label>
                                <textarea
                                    rows={2}
                                    value={settings.buyer_address}
                                    onChange={(e) => setSettings({ ...settings, buyer_address: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>GSTIN/UIN</label>
                                    <input
                                        type="text"
                                        value={settings.buyer_gstin}
                                        onChange={(e) => setSettings({ ...settings, buyer_gstin: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Place of Supply</label>
                                    <input
                                        type="text"
                                        value={settings.buyer_place_of_supply}
                                        onChange={(e) => setSettings({ ...settings, buyer_place_of_supply: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>State Name</label>
                                    <input
                                        type="text"
                                        value={settings.buyer_state}
                                        onChange={(e) => setSettings({ ...settings, buyer_state: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>State Code</label>
                                    <input
                                        type="text"
                                        value={settings.buyer_state_code}
                                        onChange={(e) => setSettings({ ...settings, buyer_state_code: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Danger Zone - Reset Database */}
            <div className="mt-12">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Danger Zone</h2>
                <ResetDatabase />
            </div>
        </div>
    );
}
