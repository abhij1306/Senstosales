"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

interface DC {
  dc_number: string;
  dc_date: string;
  po_number: number | null;
  consignee_name: string;
}

export default function DCListPage() {
  const router = useRouter();
  const [dcs, setDCs] = useState<DC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/dc/")
      .then(res => res.json())
      .then(data => {
        setDCs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load DCs:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Delivery Challans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage dispatch documents</p>
        </div>
        <button
          onClick={() => router.push("/dc/create")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create DC
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DC Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consignee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dcs.map((dc) => (
              <tr
                key={dc.dc_number}
                onClick={() => router.push(`/dc/${dc.dc_number}`)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4 text-sm font-medium text-blue-600">{dc.dc_number}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{dc.dc_date}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{dc.po_number || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{dc.consignee_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
