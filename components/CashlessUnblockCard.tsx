"use client";

/**
 * Déblocage du compte Cashless par le diffuseur lui-même : cause exacte (servie par le serveur) et
 * actions possibles — « J'ai activé, vérifier », « Relier mon compte (cashtag) »,
 * « Réessayer l'ouverture » (jamais de changement d'email : il ne change pas après la création du compte). Le conflit (portefeuille relié à un autre compte) n'a pas d'action.
 */
import { useState } from "react";
import { api } from "@/lib/api";

type Action = "refresh" | "link" | "retry";
export interface CashlessUnblock { problem: string; actions: Action[]; conflict?: boolean }

export default function CashlessUnblockCard<T extends { unblock?: CashlessUnblock | null }>({ option, onChange }: { option: T; onChange: (o: T) => void }) {
  const u = option.unblock;
  const [cashtag, setCashtag] = useState("");
  const [busy, setBusy] = useState<Action | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!u) return null;

  const run = async (action: Action, extra: { cashtag?: string } = {}) => {
    setBusy(action); setMsg(null);
    try {
      const res = await api.post<{ success: boolean; message: string; cashless: T }>("/cashless/unblock", { action, ...extra });
      setMsg({ ok: res.success, text: res.message });
      if (res.cashless) onChange(res.cashless);
    } catch (e: unknown) {
      const err = e as { message?: string; cashless?: T };
      if (err?.cashless) onChange(err.cashless);
      setMsg({ ok: false, text: err?.message ?? "Une erreur est survenue. Réessaie." });
    } finally {
      setBusy(null);
    }
  };

  const btn = "w-full rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50";
  return (
    <div className={`rounded-2xl border p-4 ${u.conflict ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}>
      <p className={`text-sm font-bold ${u.conflict ? "text-red-700" : "text-gray-900"}`}>{u.conflict ? "Compte Cashless bloqué" : "Débloquer mon compte Cashless"}</p>
      <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{u.problem}</p>
      <div className="space-y-3 mt-3">
        {u.actions.includes("refresh") && (
          <button type="button" className={`${btn} bg-green-50 text-green-800`} disabled={!!busy} onClick={() => run("refresh")}>
            {busy === "refresh" ? "Vérification…" : "J'ai activé, vérifier"}
          </button>
        )}
        {u.actions.includes("retry") && (
          <button type="button" className={`${btn} bg-green-50 text-green-800`} disabled={!!busy} onClick={() => run("retry")}>
            {busy === "retry" ? "Ouverture…" : "Réessayer l'ouverture"}
          </button>
        )}
        {u.actions.includes("link") && (
          <div>
            <label className="text-xs font-semibold text-gray-500">Ton cashtag Cashless</label>
            <input value={cashtag} onChange={(e) => setCashtag(e.target.value)} autoCapitalize="none" autoCorrect="off" placeholder="$prenom12"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            <p className="text-xs text-gray-500 mt-1">Il est affiché dans ton app Cashless, sous ton nom (ex. $prenom12).</p>
            <button type="button" className={`${btn} mt-2 bg-green-700 text-white`} disabled={!!busy || !cashtag.trim()} onClick={() => run("link", { cashtag: cashtag.trim() })}>
              {busy === "link" ? "Liaison…" : "Relier mon compte Cashless"}
            </button>
          </div>
        )}
      </div>
      {msg && <p className={`text-sm mt-3 rounded-xl p-3 ${msg.ok ? "bg-green-50 text-green-800" : "bg-gray-100 text-gray-800"}`}>{msg.text}</p>}
    </div>
  );
}
