"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface POItem {
    id: string;
    po_item_no: number;
    material_code: string;
    material_description: string;
    drawing_number: string;
    unit: string;
    ord_qty: number;
    dispatched_qty: number;
    pending_qty: number;
}

interface PONoteTemplate {
    id: string;
    title: string;
    content: string;
}

interface DCItem {
    po_item_id: string;
    dispatch_qty: number;
    hsn_code: string;
    hsn_rate: number;
}

export default function CreateDCPage() {
    const router = useRouter();
    const [poNumber, setPONumber] = useState("");
    const [poItems, setPOItems] = useState<POItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<DCItem[]>([]);
    const [poNotes, setPONotes] = useState<PONoteTemplate[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState("");
    const [customNote, setCustomNote] = useState("");

    const [formData, setFormData] = useState({
        dc_number: "",
        dc_date: new Date().toISOString().split('T')[0],
        consignee_name: "",
        consignee_gstin: "",
        consignee_address: "",
        vehicle_number: "",
        lr_number: "",
        transporter_name: "",
        mode_of_transport: "",
        eway_bill_number: "",
        inspection_company: ""
    });

    useEffect(() => {
        // Load PO notes templates
        fetch("http://localhost:8000/api/po-notes/")
            .then(res => res.json())
            .then(data => setPONotes(data))
            .catch(err => console.error("Failed to load PO notes:", err));
    }, []);

    const loadPOItems = async () => {
        if (!poNumber) return;

        try {
            const res = await fetch(`http://localhost:8000/api/reconciliation/po/${poNumber}`);
            const data = await res.json();

            if (data.items) {
                setPOItems(data.items.map((item: any) => ({
                    ...item,
                    dispatched_qty: item.dispatched_qty || 0,
                    pending_qty: item.pending_qty || item.ord_qty
                })));
            }
        } catch (err) {
            console.error("Failed to load PO items:", err);
            alert("Failed to load PO items. Please check the PO number.");
        }
    };

    const handleItemSelect = (item: POItem) => {
        const existing = selectedItems.find(si => si.po_item_id === item.id);
        if (existing) {
            setSelectedItems(selectedItems.filter(si => si.po_item_id !== item.id));
        } else {
            setSelectedItems([...selectedItems, {
                po_item_id: item.id,
                dispatch_qty: Math.min(item.pending_qty, 1),
                hsn_code: "",
                hsn_rate: 18
            }]);
        }
    };

    const updateDispatchQty = (po_item_id: string, qty: number) => {
        setSelectedItems(selectedItems.map(item =>
            item.po_item_id === po_item_id ? { ...item, dispatch_qty: qty } : item
        ));
    };

    const handleNoteSelect = (noteId: string) => {
        setSelectedNoteId(noteId);
        const note = poNotes.find(n => n.id === noteId);
        if (note) {
            setCustomNote(note.content);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedItems.length === 0) {
            alert("Please select at least one item to dispatch");
            return;
        }

        try {
            const payload = {
                dc: {
                    ...formData,
                    po_number: parseInt(poNumber),
                    po_notes: customNote || undefined
                },
                items: selectedItems
            };

            const res = await fetch("http://localhost:8000/api/dc/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Delivery Challan created successfully!");
                router.push("/dc");
            } else {
                const error = await res.json();
                alert(`Failed to create DC: ${error.detail || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Failed to create DC:", err);
            alert("Failed to create DC. Please try again.");
        }
    };

    return (
        <div className="p-8">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Create Delivery Challan</h1>
                <p className="text-sm text-gray-500 mt-1">Generate DC from Purchase Order</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* PO Selection */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Purchase Order</h2>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={poNumber}
                            onChange={(e) => setPONumber(e.target.value)}
                            placeholder="Enter PO Number"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={loadPOItems}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Load Items
                        </button>
                    </div>
                </div>

                {/* Item Selection */}
                {poItems.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Items to Dispatch</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drawing No</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispatch Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {poItems.map((item) => {
                                        const selected = selectedItems.find(si => si.po_item_id === item.id);
                                        return (
                                            <tr key={item.id} className={selected ? "bg-blue-50" : "hover:bg-gray-50"}>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selected}
                                                        onChange={() => handleItemSelect(item)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.po_item_no}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    <div className="font-medium">{item.material_code}</div>
                                                    <div className="text-xs text-gray-500">{item.material_description}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.drawing_number || "-"}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{item.ord_qty}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-orange-600">{item.pending_qty}</td>
                                                <td className="px-4 py-3">
                                                    {selected && (
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.pending_qty}
                                                            value={selected.dispatch_qty}
                                                            onChange={(e) => updateDispatchQty(item.id, parseInt(e.target.value))}
                                                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* DC Details */}
                {selectedItems.length > 0 && (
                    <>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">DC Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">DC Number</label>
                                    <input
                                        type="text"
                                        value={formData.dc_number}
                                        onChange={(e) => setFormData({ ...formData, dc_number: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">DC Date</label>
                                    <input
                                        type="date"
                                        value={formData.dc_date}
                                        onChange={(e) => setFormData({ ...formData, dc_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Consignee Name</label>
                                    <input
                                        type="text"
                                        value={formData.consignee_name}
                                        onChange={(e) => setFormData({ ...formData, consignee_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Consignee GSTIN</label>
                                    <input
                                        type="text"
                                        value={formData.consignee_gstin}
                                        onChange={(e) => setFormData({ ...formData, consignee_gstin: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Consignee Address</label>
                                    <textarea
                                        value={formData.consignee_address}
                                        onChange={(e) => setFormData({ ...formData, consignee_address: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
                                    <input
                                        type="text"
                                        value={formData.vehicle_number}
                                        onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">LR Number</label>
                                    <input
                                        type="text"
                                        value={formData.lr_number}
                                        onChange={(e) => setFormData({ ...formData, lr_number: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Transporter Name</label>
                                    <input
                                        type="text"
                                        value={formData.transporter_name}
                                        onChange={(e) => setFormData({ ...formData, transporter_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">E-Way Bill Number</label>
                                    <input
                                        type="text"
                                        value={formData.eway_bill_number}
                                        onChange={(e) => setFormData({ ...formData, eway_bill_number: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PO Notes */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">PO Notes (Optional)</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                                    <select
                                        value={selectedNoteId}
                                        onChange={(e) => handleNoteSelect(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">-- Select a template --</option>
                                        {poNotes.map(note => (
                                            <option key={note.id} value={note.id}>{note.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Note</label>
                                    <textarea
                                        value={customNote}
                                        onChange={(e) => setCustomNote(e.target.value)}
                                        rows={4}
                                        placeholder="Add custom notes or edit template content..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Create Delivery Challan
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}
