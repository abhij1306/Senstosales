```
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
                                    {dc.dc_date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {dc.po_number || "-"}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {dc.consignee_name || "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {dcs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No delivery challans found.
                    </div>
                )}
            </div>
        </div>
    );
}
