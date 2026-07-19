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

export default function KycBanner() {
  const [state, setState] = useState<KycState | null>(null);

  useEffect(() => {
    api.get<KycState>("/kyc/state").then(setState).catch(() => {});
  }, []);

  if (!state || !state.required) return null;

  const open = () => { if (state.verify_url) window.location.href = state.verify_url; };

  // Vérification en cours (soumis, en attente de verdict / revue)
  if (state.kyc_status === "submitted") {
    return (
      <div className="mx-4 mt-3 mb-3 rounded-2xl bg-amber-50 border border-amber-200 p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-lg">⏳</div>
        <div className="min-w-0">
          <p className="font-bold text-amber-800 text-sm">Vérification d'identité en cours</p>
          <p className="text-amber-700 text-xs mt-0.5">Nous examinons ta pièce. Aucune action nécessaire.</p>
        </div>
      </div>
    );
  }

  const d = daysLeft(state.deadline);
  const rejected = state.kyc_status === "rejected";

  return (
    <button
      onClick={open}
      className={`mx-4 mt-3 mb-3 w-[calc(100%-2rem)] rounded-2xl p-3.5 flex items-center gap-3 text-left border ${
        rejected ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
        rejected ? "bg-red-100" : "bg-green-100"
      }`}>🛡️</div>
      <div className="min-w-0 flex-1">
        <p className={`font-bold text-sm ${rejected ? "text-red-700" : "text-green-800"}`}>
          {rejected ? "Vérification refusée — réessaie" : "Vérifie ton identité"}
        </p>
        <p className={`text-xs mt-0.5 ${rejected ? "text-red-600" : "text-green-700"}`}>
          {rejected
            ? "Ta dernière tentative a échoué. Reprends la vérification pour garder l'accès."
            : d !== null
              ? `Il te reste ${d} jour${d > 1 ? "s" : ""} pour vérifier ton identité.`
              : "Vérification requise pour continuer à recevoir des campagnes."}
        </p>
      </div>
      <span className={`text-xs font-bold flex-shrink-0 ${rejected ? "text-red-600" : "text-green-600"}`}>Vérifier ›</span>
    </button>
  );
}
