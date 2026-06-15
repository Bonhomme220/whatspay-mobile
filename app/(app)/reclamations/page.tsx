"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Complaint {
  id: string;
  status: "pending" | "accepted" | "rejected";
  message: string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  task_name: string;
  assignment_id: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending:  "En attente",
  accepted: "Acceptée",
  rejected: "Rejetée",
};
const STATUS_COLOR: Record<string, string> = {
  pending:  "bg-orange-100 text-orange-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-gray-100 text-gray-500",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ReclamationsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.get<Complaint[]>("/complaints")
      .then(setComplaints)
      .catch(() => {}) // 401 géré globalement par wp:unauthorized dans le layout
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-green-600 px-5 pt-5 pb-14">
        <h1 className="text-white text-2xl font-bold">Mes Réclamations</h1>
        <p className="text-white/70 text-sm mt-0.5">{complaints.length} réclamation{complaints.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="mx-4 -mt-6 pb-10 space-y-3">

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">Aucune réclamation pour l'instant.</p>
            <p className="text-gray-300 text-xs mt-1">Les réclamations se déposent depuis une soumission rejetée ou validée.</p>
          </div>
        ) : complaints.map((c) => (
          <Link
            key={c.id}
            href={`/campagnes/${c.assignment_id}/soumission`}
            className="block bg-white rounded-2xl shadow-sm p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-gray-800 text-sm font-semibold leading-snug flex-1 truncate">{c.task_name}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[c.status] ?? "bg-gray-100 text-gray-500"}`}>
                {STATUS_LABEL[c.status] ?? c.status}
              </span>
            </div>
            <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">{c.message}</p>
            {c.admin_note && (
              <div className="mt-2 pt-2 border-t border-gray-50">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Réponse équipe</p>
                <p className="text-gray-600 text-xs line-clamp-2">{c.admin_note}</p>
              </div>
            )}
            <p className="text-gray-300 text-[10px] mt-2">{fmtDate(c.created_at)}</p>
          </Link>
        ))}

      </div>
    </div>
  );
}
