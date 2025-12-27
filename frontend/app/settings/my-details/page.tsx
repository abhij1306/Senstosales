"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  Building,
  UserCheck,
  AlertOctagon,
  Mail,
  Phone,
  MapPin,
  Fingerprint,
  FileText,
} from "lucide-react";
import ResetDatabase from "@/components/ResetDatabase";
import {
  H3,
  Body,
  SmallText,
  Label,
} from "@/components/design-system/atoms/Typography";
import { Button } from "@/components/design-system/atoms/Button";
import { Card } from "@/components/design-system/atoms/Card";
import { SpotlightCard } from "@/components/design-system/atoms/SpotlightCard";
import { Input } from "@/components/design-system/atoms/Input";
import { DetailField } from "@/components/design-system/molecules/DetailField";
import { FormField } from "@/components/design-system/molecules/FormField";
import { api, Buyer } from "@/lib/api";

interface Settings {
  supplier_name: string;
  supplier_description: string;
  supplier_address: string;
  supplier_gstin: string;
  supplier_contact: string;
  supplier_state: string;
  supplier_state_code: string;
}

const defaultSettings: Settings = {
  supplier_name: "",
  supplier_description: "",
  supplier_address: "",
  supplier_gstin: "",
  supplier_contact: "",
  supplier_state: "",
  supplier_state_code: "",
};

export default function MyDetailsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [defaultBuyer, setDefaultBuyer] = useState<Buyer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${api.baseUrl}/api/settings/`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }

      const buyers = await api.getBuyers();
      const def = buyers.find((b) => b.is_default);
      setDefaultBuyer(def || null);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const batch = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));
      await api.updateSettingsBatch(batch);
      setMessage({ type: "success", text: "Settings updated successfully." });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update settings." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Body className="text-slate-400 animate-pulse">
          Loading system settings...
        </Body>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* 1. Supplier Identity Section */}
      <SpotlightCard className="overflow-hidden border-none shadow-premium bg-white/40 backdrop-blur-xl">
        <div className="px-8 py-6 border-b border-white/20 bg-gradient-to-r from-blue-600/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-600">
              <Building size={22} />
            </div>
            <div>
              <H3 className="text-[18px]">Supplier Profile</H3>
              <SmallText className="text-slate-500">
                Your registered business identity for invoices
              </SmallText>
            </div>
          </div>
          <Button
            onClick={() => handleUpdate()}
            disabled={isSaving}
            className="shadow-lg shadow-blue-600/20"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form Fields */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                id="supplier_name"
                name="supplier_name"
                label="Entity Name"
                value={settings.supplier_name}
                onChange={(e) =>
                  setSettings({ ...settings, supplier_name: e.target.value })
                }
                icon={<Building size={14} />}
              />
              <FormField
                id="supplier_gstin"
                name="supplier_gstin"
                label="Tax Identity (GSTIN)"
                value={settings.supplier_gstin}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    supplier_gstin: e.target.value.toUpperCase(),
                  })
                }
                className="font-mono tracking-widest"
                icon={<Fingerprint size={14} />}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_description">Business Description</Label>
              <Input
                id="supplier_description"
                name="supplier_description"
                value={settings.supplier_description}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    supplier_description: e.target.value,
                  })
                }
                placeholder="e.g. Precision Engineering & Manufacturing"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_address">
                Registered Office Address
              </Label>
              <textarea
                id="supplier_address"
                name="supplier_address"
                value={settings.supplier_address}
                onChange={(e) =>
                  setSettings({ ...settings, supplier_address: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 text-[13px] font-medium border border-white/40 rounded-xl bg-white/20 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all resize-none backdrop-blur-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                id="supplier_state"
                name="supplier_state"
                label="State Name"
                value={settings.supplier_state}
                onChange={(e) =>
                  setSettings({ ...settings, supplier_state: e.target.value })
                }
              />
              <FormField
                id="supplier_state_code"
                name="supplier_state_code"
                label="State Code"
                value={settings.supplier_state_code}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    supplier_state_code: e.target.value,
                  })
                }
              />
              <FormField
                id="supplier_contact"
                name="supplier_contact"
                label="Contact Info"
                value={settings.supplier_contact}
                onChange={(e) =>
                  setSettings({ ...settings, supplier_contact: e.target.value })
                }
                icon={<Phone size={14} />}
              />
            </div>
          </div>

          {/* Visual Sidebar Preview */}
          <div className="lg:col-span-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-6">
            <Label className="text-blue-600">Document Header Preview</Label>
            <Card className="p-5 border-dashed border-slate-300 bg-white/80 shadow-inner space-y-2 relative overflow-hidden group/doc">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/doc:opacity-30 transition-opacity">
                <FileText size={40} />
              </div>
              <div className="text-[12px] font-black text-slate-900 uppercase leading-tight">
                {settings.supplier_name || "BUSINESS NAME"}
              </div>
              <div className="text-[9px] text-slate-500 leading-tight line-clamp-2 max-w-[180px]">
                {settings.supplier_address || "Registered Address Street, City, State"}
              </div>
              <div className="pt-1 flex items-center gap-1.5 grayscale opacity-60">
                <div className="h-1 w-12 bg-blue-600 rounded-full" />
                <div className="h-1 w-4 bg-slate-300 rounded-full" />
              </div>
            </Card>
            <div className="space-y-4 pt-4">
              <DetailField
                label="State Presence"
                value={settings.supplier_state || "---"}
                icon={<MapPin size={14} />}
              />
              <DetailField
                label="Direct Link"
                value={settings.supplier_contact || "---"}
                icon={<Mail size={14} />}
              />
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* 2. Default Buyer Section */}
      <Card className="overflow-hidden border-none shadow-premium bg-white/40 backdrop-blur-xl">
        <div className="px-8 py-5 bg-gradient-to-r from-emerald-600/10 to-transparent border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/10 rounded-xl text-emerald-600">
              <UserCheck size={20} />
            </div>
            <div>
              <H3>Primary Invoice Entity</H3>
              <SmallText className="text-slate-500">
                The buyer profile applied to new invoices by default
              </SmallText>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            onClick={() => (window.location.href = "/settings/buyers")}
          >
            Entity Manager
          </Button>
        </div>

        <div className="p-8">
          {defaultBuyer ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <DetailField label="Organization" value={defaultBuyer.name} />
              <DetailField
                label="Tax Code (GST)"
                value={defaultBuyer.gstin}
                className="font-mono"
              />
              <DetailField
                label="Auth Person"
                value={defaultBuyer.designation}
              />

              <div className="md:col-span-3 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                <DetailField
                  label="Invoicing Address"
                  value={defaultBuyer.billing_address}
                />
                <DetailField
                  label="Place of Supply"
                  value={defaultBuyer.place_of_supply}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-white/10 backdrop-blur-sm rounded-2xl border border-dashed border-white/30">
              <Body className="text-slate-400 mb-4">
                No default billing entity selected.
              </Body>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/settings/buyers")}
              >
                Assign Primary Entity
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 3. Danger Zone */}
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-4 px-2">
          <AlertOctagon className="w-5 h-5 text-red-500" />
          <H3 className="text-red-500 uppercase tracking-wider text-[11px] font-bold">
            System Governance
          </H3>
        </div>
        <Card className="p-8 border-red-500/20 bg-red-50/30 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="max-w-2xl">
              <H3 className="text-[14px] text-red-900 mb-2">
                Nuclear Hard Reset
              </H3>
              <SmallText className="text-red-700/70 leading-relaxed font-medium">
                This operation will purge all databases including historic POs,
                Challans, and Invoices. This action is cryptographic and
                non-reversible. Proceed with absolute caution.
              </SmallText>
            </div>
            <ResetDatabase />
          </div>
        </Card>
      </div>
    </div>
  );
}
