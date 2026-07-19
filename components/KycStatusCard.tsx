"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface KycState {
  kyc_status: "pending" | "submitted" | "verified" | "rejected";
  required: boolean;
  deadline: string | null;
  attempts_left: number;
  verify_url: string | null;
}

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 86400000) : 0;
}

export default function KycStatusCard() {
  const [s, setS] = useState<KycState | null>(null);

  useEffect(() => {
    api.get<KycState>("/kyc/state").then(setS).catch(() => {});
  }, []);

  if (!s) return null;

  const open = () => { if (s.verify_url) window.location.href = s.verify_url; };

  // Palette + libellés selon le statut
  const cfg = {
    verified:  { ic: "✓",  bg: "bg-green-50 border-green-200",  ico: "bg-green-100 text-green-600", title: "text-green-800", t: "Identité vérifiée", sub: "Ton identité est confirmée." },
    submitted: { ic: "⏳", bg: "bg-amber-50 border-amber-200",  ico: "bg-amber-100 text-amber-600", title: "text-amber-800", t: "Vérification en cours", sub: "Nous examinons ta pièce." },
    pending:   { ic: "🛡️", bg: "bg-white border-gray-100",       ico: "bg-green-600/10 text-green-600", title: "text-gray-900", t: "Vérifie ton identité", sub: "" },
    rejected:  { ic: "!",  bg: "bg-red-50 border-red-200",      ico: "bg-red-100 text-red-600",    title: "text-red-700",  t: "Vérification refusée", sub: "Reprends la vérification." },
  }[s.kyc_status];

  const d = daysLeft(s.deadline);
  const actionable = s.kyc_status === "pending" || s.kyc_status === "rejected";
  const subText = s.kyc_status === "pending"
    ? (d !== null ? `Il te reste ${d} jour${d > 1 ? "s" : ""} pour vérifier ton identité.` : "Vérification requise pour recevoir des campagnes.")
    : cfg.sub;

  return (
    <button
      onClick={actionable ? open : undefined}
      disabled={!actionable}
      className={`w-full flex items-center gap-3 rounded-2xl p-4 text-left shadow-sm border ${cfg.bg} ${actionable ? "" : "cursor-default"}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${cfg.ico}`}>{cfg.ic}</div>
      <div className="min-w-0 flex-1">
        <p className={`font-bold text-sm ${cfg.title}`}>{cfg.t}</p>
        <p className="text-gray-500 text-xs mt-0.5">{subText}</p>
      </div>
      {actionable && (
        <span className="text-xs font-bold text-green-600 flex-shrink-0">Vérifier ›</span>
      )}
    </button>
  );
}
