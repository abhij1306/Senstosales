"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/design-system/atoms/Button";
import { Badge } from "@/components/design-system/atoms/Badge";
import { Dialog } from "@/components/design-system/molecules/Dialog";
import { FormField } from "@/components/design-system/molecules/FormField";
import { SpotlightCard } from "@/components/design-system/atoms/SpotlightCard";
import { DetailField } from "@/components/design-system/molecules/DetailField";
import {
  H3,
  Body,
  SmallText,
  Label,
} from "@/components/design-system/atoms/Typography";
import { api, Buyer } from "@/lib/api";
import { Plus, Edit2, Trash2, Star, CheckCircle, Building } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function BuyersSettingsPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const { success, error: toastError } = useToast();

  // Form State
  const [formData, setFormData] = useState<Partial<Buyer>>({
    name: "",
    gstin: "",
    billing_address: "",
    shipping_address: "",
    place_of_supply: "",
    designation: "",
    state: "",
    state_code: "",
  });

  useEffect(() => {
    loadBuyers();
  }, []);

  const loadBuyers = async () => {
    try {
      setLoading(true);
      const data = await api.getBuyers();
      setBuyers(data);
    } catch (err) {
      toastError("Error", "Failed to load buyers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingBuyer) {
        await api.updateBuyer(editingBuyer.id, formData);
        success("Success", "Buyer updated successfully");
      } else {
        await api.createBuyer(formData);
        success("Success", "Buyer created successfully");
      }
      setIsDialogOpen(false);
      loadBuyers();
    } catch (err: any) {
      toastError("Error", err.message || "Operation failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this buyer?")) return;
    try {
      await api.deleteBuyer(id);
      success("Success", "Buyer deleted");
      loadBuyers();
    } catch (err: any) {
      toastError("Error", err.message);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.setBuyerDefault(id);
      success("Success", "Default buyer updated");
      loadBuyers();
    } catch (err: any) {
      toastError("Error", err.message);
    }
  };

  const openCreate = () => {
    setEditingBuyer(null);
    setFormData({
      name: "",
      gstin: "",
      billing_address: "",
      shipping_address: "",
      place_of_supply: "",
      designation: "",
      state: "",
      state_code: "",
    });
    setIsDialogOpen(true);
  };

  const openEdit = (buyer: Buyer) => {
    setEditingBuyer(buyer);
    setFormData({
      name: buyer.name,
      gstin: buyer.gstin,
      billing_address: buyer.billing_address,
      shipping_address: buyer.shipping_address || "",
      place_of_supply: buyer.place_of_supply,
      designation: buyer.designation || "",
      state: buyer.state || "",
      state_code: buyer.state_code || "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-600">
            <Building size={22} />
          </div>
          <div>
            <H3 className="text-[18px]">Billing Entities</H3>
            <SmallText className="text-slate-500 font-medium">
              Manage your registered buyer profiles and tax identities
            </SmallText>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} /> Add Buyer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {buyers.map((buyer) => (
          <SpotlightCard
            key={buyer.id}
            active={buyer.is_default}
            className={cn(
              "flex flex-col h-full border-none shadow-premium bg-white/45 backdrop-blur-xl transition-all",
              buyer.is_default
                ? "ring-2 ring-emerald-500/40"
                : "hover:bg-white/55",
            )}
          >
            <div className="p-8 flex flex-col h-full gap-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div
                    className={cn(
                      "p-3 rounded-2xl",
                      buyer.is_default
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    <Building size={24} />
                  </div>
                  <div className="space-y-1">
                    <H3
                      className="text-slate-900 leading-tight line-clamp-1"
                      title={buyer.name}
                    >
                      {buyer.name}
                    </H3>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0 h-5 font-mono text-slate-500 border-slate-200 bg-white/50"
                      >
                        {buyer.gstin}
                      </Badge>
                      {buyer.is_default && (
                        <Badge
                          variant="success"
                          className="text-[10px] px-2 py-0 h-5 gap-1 uppercase transition-all animate-in fade-in zoom-in duration-300"
                        >
                          <CheckCircle size={10} /> Primary
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 -mt-2 -mr-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(buyer)}
                    className="h-9 w-9 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 size={16} className="text-slate-400" />
                  </Button>
                  {!buyer.is_default && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(buyer.id)}
                      className="h-9 w-9 p-0 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} className="text-slate-400" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-8 py-6 border-t border-white/20 mt-2 flex-grow">
                <DetailField label="State Name" value={buyer.state} />
                <DetailField label="State Code" value={buyer.state_code} />
                <div className="col-span-2 space-y-1">
                  <Label>Authorized Designation</Label>
                  <Body className="text-slate-600 truncate">
                    {buyer.designation || "---"}
                  </Body>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Place of Supply</Label>
                  <Body className="text-slate-600 line-clamp-2">
                    {buyer.place_of_supply}
                  </Body>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-6 border-t border-white/20 flex justify-end">
                {!buyer.is_default ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(buyer.id)}
                    className="text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 w-full justify-center gap-2 rounded-xl h-10 transition-all active:scale-95"
                  >
                    <Star size={14} /> Set as Primary Profile
                  </Button>
                ) : (
                  <div className="w-full py-2.5 flex justify-center items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-500/10 backdrop-blur-sm rounded-xl border border-emerald-500/20 tracking-wide uppercase">
                    <Star size={12} fill="currentColor" /> Active Billing
                    Profile
                  </div>
                )}
              </div>
            </div>
          </SpotlightCard>
        ))}

        {/* Empty State Card */}
        {buyers.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200/60 rounded-3xl bg-white/20 backdrop-blur-sm">
            <SmallText className="text-slate-400 text-[14px] block mb-4">
              No billing entities configured yet.
            </SmallText>
            <Button onClick={openCreate} className="gap-2">
              <Plus size={16} /> Add your first entity
            </Button>
          </div>
        )}
      </div>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingBuyer ? "Edit Buyer" : "Add New Buyer"}
        maxWidth="max-w-2xl"
        footer={
          <Button onClick={handleSubmit} className="w-full">
            {editingBuyer ? "Update Buyer" : "Create Buyer"}
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 py-4">
          <div className="col-span-2">
            <FormField
              id="buyer_name"
              name="buyer_name"
              label="Buyer Entity Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. BHEL Haridwar"
              required
            />
          </div>

          <FormField
            id="buyer_gstin"
            name="buyer_gstin"
            label="GSTIN"
            value={formData.gstin}
            onChange={(e) =>
              setFormData({ ...formData, gstin: e.target.value })
            }
            placeholder="22XXXXX..."
            required
            className="font-mono"
          />

          <FormField
            id="buyer_designation"
            name="buyer_designation"
            label="Authorized Designation"
            value={formData.designation || ""}
            onChange={(e) =>
              setFormData({ ...formData, designation: e.target.value })
            }
            placeholder="e.g. Manager (Purchase)"
          />

          <div className="col-span-2">
            <div className="space-y-1.5">
              <Label htmlFor="buyer_billing_address">
                Detailed Address (Billing)
              </Label>
              <textarea
                id="buyer_billing_address"
                name="buyer_billing_address"
                className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-slate-200 bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                value={formData.billing_address}
                onChange={(e) =>
                  setFormData({ ...formData, billing_address: e.target.value })
                }
                placeholder="Full address..."
              />
            </div>
          </div>

          <div className="col-span-2">
            <div className="space-y-1.5">
              <Label htmlFor="buyer_shipping_address">
                Detailed Address (Shipping) - Optional
              </Label>
              <textarea
                id="buyer_shipping_address"
                name="buyer_shipping_address"
                className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-slate-200 bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                value={formData.shipping_address}
                onChange={(e) =>
                  setFormData({ ...formData, shipping_address: e.target.value })
                }
                placeholder="If different from billing..."
              />
            </div>
          </div>

          <FormField
            id="buyer_place_of_supply"
            name="buyer_place_of_supply"
            label="Place of Supply"
            value={formData.place_of_supply}
            onChange={(e) =>
              setFormData({ ...formData, place_of_supply: e.target.value })
            }
            placeholder="e.g. Madhya Pradesh"
            required
          />

          <div className="grid grid-cols-2 gap-4 w-full col-span-1">
            <FormField
              id="buyer_state"
              name="buyer_state"
              label="State Name"
              value={formData.state || ""}
              onChange={(e) =>
                setFormData({ ...formData, state: e.target.value })
              }
              placeholder="e.g. MP"
            />
            <FormField
              id="buyer_state_code"
              name="buyer_state_code"
              label="State Code"
              value={formData.state_code || ""}
              onChange={(e) =>
                setFormData({ ...formData, state_code: e.target.value })
              }
              placeholder="e.g. 23"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
