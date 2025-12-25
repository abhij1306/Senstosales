"use client";

import React, { useState, useEffect } from 'react';
import { Save, Building, UserCheck, AlertOctagon } from 'lucide-react';
import ResetDatabase from '@/components/ResetDatabase';
import { H1, H3, Body, SmallText, Label } from "@/components/design-system/atoms/Typography";
import { Button } from "@/components/design-system/atoms/Button";
import { Card } from "@/components/design-system/atoms/Card";
import { Input } from "@/components/design-system/atoms/Input";

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
                setMessage({ type: 'success', text: 'Settings updated successfully.' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: 'Failed to update settings.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error occurred.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Body className="text-[#6B7280] animate-pulse">Loading settings...</Body>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <H1>Global Settings</H1>
                    <Body className="text-[#6B7280] mt-1">
                        Master configuration for financial documentation
                    </Body>
                </div>
                <div className="flex items-center gap-4">
                    {message && (
                        <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${message.type === 'success' ? 'bg-[#16A34A]/10 border-[#16A34A]/20 text-[#16A34A]' : 'bg-[#DC2626]/10 border-[#DC2626]/20 text-[#DC2626]'}`}>
                            <SmallText className="font-semibold">{message.text}</SmallText>
                        </div>
                    )}
                    <Button onClick={() => handleUpdate()} variant="default" disabled={isSaving}>
                        <Save size={16} className={isSaving ? 'animate-spin' : ''} />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Section: Identity & Location */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Supplier Identity */}
                <Card className="overflow-hidden border-none shadow-premium bg-white/80 backdrop-blur-md">
                    <div className="px-6 py-5 bg-gradient-to-r from-[#1A3D7C] to-[#2E5B9E] flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Building className="w-5 h-5 text-white" />
                        </div>
                        <H3 className="text-white">Supplier Profile</H3>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500">Business Name</Label>
                                <Input
                                    value={settings.supplier_name}
                                    onChange={e => setSettings({ ...settings, supplier_name: e.target.value })}
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500">Tagline / Description</Label>
                                <Input
                                    value={settings.supplier_description}
                                    onChange={e => setSettings({ ...settings, supplier_description: e.target.value })}
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-slate-500">Registered Address</Label>
                            <textarea
                                value={settings.supplier_address}
                                onChange={e => setSettings({ ...settings, supplier_address: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1A3D7C]/20 focus:border-[#1A3D7C] bg-slate-50/50 transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500">Tax Identity (GSTIN)</Label>
                                <Input
                                    value={settings.supplier_gstin}
                                    onChange={e => setSettings({ ...settings, supplier_gstin: e.target.value.toUpperCase() })}
                                    className="bg-slate-50/50 border-slate-200 font-mono tracking-wider"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500">Support Contact</Label>
                                <Input
                                    value={settings.supplier_contact}
                                    onChange={e => setSettings({ ...settings, supplier_contact: e.target.value })}
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500">Jurisdiction (State)</Label>
                                <Input
                                    value={settings.supplier_state}
                                    onChange={e => setSettings({ ...settings, supplier_state: e.target.value })}
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500">State Code</Label>
                                <Input
                                    value={settings.supplier_state_code}
                                    onChange={e => setSettings({ ...settings, supplier_state_code: e.target.value })}
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Buyer Details */}
                <Card className="overflow-hidden border-none shadow-premium bg-white/80 backdrop-blur-md">
                    <div className="px-6 py-5 bg-gradient-to-r from-[#2BB7A0] to-[#269E8A] flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <UserCheck className="w-5 h-5 text-white" />
                        </div>
                        <H3 className="text-white">Buyer Information</H3>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500">Customer Legal Name</Label>
                                <Input
                                    value={settings.buyer_name}
                                    onChange={e => setSettings({ ...settings, buyer_name: e.target.value })}
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500">Authorized Designation</Label>
                                <Input
                                    value={settings.buyer_designation}
                                    onChange={e => setSettings({ ...settings, buyer_designation: e.target.value })}
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-slate-500">Ship-to Address</Label>
                            <textarea
                                value={settings.buyer_address}
                                onChange={e => setSettings({ ...settings, buyer_address: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2BB7A0]/20 focus:border-[#2BB7A0] bg-slate-50/50 transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500">Customer GSTIN</Label>
                                <Input
                                    value={settings.buyer_gstin}
                                    onChange={e => setSettings({ ...settings, buyer_gstin: e.target.value.toUpperCase() })}
                                    className="bg-slate-50/50 border-slate-200 font-mono tracking-wider"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500">Place of Supply</Label>
                                <Input
                                    value={settings.buyer_place_of_supply}
                                    onChange={e => setSettings({ ...settings, buyer_place_of_supply: e.target.value })}
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500">Customer State</Label>
                                <Input
                                    value={settings.buyer_state}
                                    onChange={e => setSettings({ ...settings, buyer_state: e.target.value })}
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-slate-500">State Code</Label>
                                <Input
                                    value={settings.buyer_state_code}
                                    onChange={e => setSettings({ ...settings, buyer_state_code: e.target.value })}
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Danger Zone */}
            <div className="pt-8 border-t border-[#E5E7EB]">
                <div className="flex items-center gap-3 mb-4">
                    <AlertOctagon className="w-5 h-5 text-[#DC2626]" />
                    <H3 className="text-[#DC2626]">Danger Zone</H3>
                </div>
                <Card className="p-6 border-[#DC2626]/20 bg-[#DC2626]/5">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <H3 className="text-[14px] mb-1">System Hard Reset</H3>
                            <SmallText className="text-[#6B7280] leading-relaxed">
                                This action will permanently erase all ledgers, procurement contracts, and logistic records. Data recovery is impossible once initiated.
                            </SmallText>
                        </div>
                        <ResetDatabase />
                    </div>
                </Card>
            </div>
        </div>
    );
}
