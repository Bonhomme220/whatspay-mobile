"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  reference?: string | null;
  receipt_url?: string | null;
  created_at: string;
}
interface PendingWithdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}
interface GainsData {
  balance: number;
  total_gain: number;
  this_month: number;
  last_month: number;
  campagnes_terminees: number;
  total_vues: number;
  en_cours: number;
  par_vue: number;
  pending_withdrawal: PendingWithdrawal | null;
  transactions: Transaction[];
}

type Filter = "tous" | "gains" | "retraits";

function fmt(n: number) { return n.toLocaleString("fr-FR"); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GainsPage() {
  const router = useRouter();
  const [data, setData]         = useState<GainsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<Filter>("tous");
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);

  const load = useCallback((quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    api.get<GainsData>("/gains")
      .then(setData)
      .catch(() => {}) // 401 géré globalement par wp:unauthorized dans le layout
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const transactions = data?.transactions ?? [];
  const filtered =
    filter === "gains"    ? transactions.filter((t) => t.type === "Crédit") :
    filter === "retraits" ? transactions.filter((t) => t.type !== "Crédit") :
    transactions;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const hasPending = !!data.pending_withdrawal;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-green-600 px-5 pt-5 pb-14">
        <h1 className="text-white text-2xl font-bold">Mes Gains</h1>
        <p className="text-green-100 text-sm mt-0.5">Solde disponible</p>

        <p className="text-white text-4xl font-bold mt-2 font-mono tracking-tight">
          {fmt(data.balance)} <span className="text-2xl font-semibold">F</span>
        </p>

        {/* Sous-stats */}
        <div className="flex gap-4 mt-2">
          {[
            { label: "Total gains", value: `${fmt(data.total_gain)} F` },
            { label: "Ce mois",     value: `${fmt(data.this_month)} F` },
            { label: "Mois préc.",  value: `${fmt(data.last_month)} F` },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-green-100 text-[10px]">{s.label}</p>
              <p className="text-white text-xs font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Chips de stats */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[
            { label: "Campagnes terminées", value: fmt(data.campagnes_terminees) },
            { label: "Vues totales",        value: fmt(data.total_vues) },
            { label: "En cours",            value: fmt(data.en_cours) },
            { label: "Par vue",             value: `${fmt(data.par_vue)} F` },
          ].map((s) => (
            <div key={s.label} className="py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="text-white font-bold text-lg leading-tight">{s.value}</div>
              <div className="text-green-100 text-[10px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Boutons action */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setShowWithdraw(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm"
            style={{ background: "rgba(0,0,0,0.2)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
            Retrait
          </button>
          <button
            onClick={() => load(true)}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
            style={{ background: "rgba(0,0,0,0.2)" }}
          >
            <svg className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Bannière retrait en cours ── */}
      {hasPending && (
        <div className="mx-4 -mt-3 mb-3 relative z-10">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-amber-800 font-semibold text-sm">Retrait en cours de traitement</p>
              <p className="text-amber-700 text-xs mt-0.5">
                Votre retrait de <span className="font-semibold">{fmt(data.pending_withdrawal!.amount)} F</span> est en cours.
                Le retrait peut prendre plusieurs jours ouvrés.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Historique — chevauchement hero ── */}
      <div className={`mx-4 ${hasPending ? "" : "-mt-6"} bg-white rounded-2xl shadow-sm overflow-hidden mb-4`}>

        {/* Header + filtres */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 flex-wrap border-b border-gray-50">
          <h2 className="text-gray-700 font-semibold text-sm mr-auto">Historique</h2>
          {(["tous", "gains", "retraits"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                filter === f ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Liste transactions */}
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">Aucune transaction.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((t) => {
              const isCredit = t.type === "Crédit";
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDetailTx(t)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-green-50" : "bg-red-50"}`}>
                    <svg className={`w-4 h-4 ${isCredit ? "text-green-600" : "text-red-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isCredit
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7M12 3v18" />
                      }
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm font-medium truncate">{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-400 text-[10px]">{fmtDate(t.created_at)}</span>
                      <StatusBadge status={t.status} />
                    </div>
                  </div>

                  <span className={`text-sm font-bold whitespace-nowrap ${isCredit ? "text-green-600" : "text-red-500"}`}>
                    {isCredit ? "+" : "-"}{fmt(t.amount)} F
                  </span>
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Feuille de détails d'une transaction ── */}
      {detailTx && (
        <TransactionDetailSheet tx={detailTx} onClose={() => setDetailTx(null)} />
      )}

      {/* ── Modal de retrait ── */}
      {showWithdraw && (
        <WithdrawModal
          balance={data.balance}
          hasPending={hasPending}
          pendingAmount={data.pending_withdrawal?.amount}
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => { setShowWithdraw(false); load(true); }}
        />
      )}

    </div>
  );
}

// ── WithdrawModal ──────────────────────────────────────────────────────────────
function WithdrawModal({ balance, hasPending, pendingAmount, onClose, onSuccess }: {
  balance: number;
  hasPending: boolean;
  pendingAmount?: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount]   = useState("");
  const [phone, setPhone]     = useState("");
  const [submitting, setSub]  = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Si retrait déjà en cours, on affiche directement l'info sans formulaire
  if (hasPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
        <div className="w-full bg-white rounded-t-3xl px-5 pt-6 pb-10" onClick={(e) => e.stopPropagation()}>
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-gray-800 font-bold text-lg">Retrait en cours</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Un retrait de <span className="font-semibold text-gray-700">{pendingAmount ? `${pendingAmount.toLocaleString("fr-FR")} F` : ""}</span> est déjà en cours de traitement.
              {"\n"}Le retrait peut prendre <span className="font-semibold text-gray-700">plusieurs jours ouvrés</span>.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-4 bg-gray-100 text-gray-600 font-semibold rounded-2xl text-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSub(true);
    try {
      const res = await api.post<{ success: boolean; message: string; has_pending?: boolean }>("/withdraw", {
        amount: parseFloat(amount),
        withdrawal_method: "mobile_money",
        phone: phone.replace(/\D/g, ""),
      });
      if (res.success) {
        setSuccess(res.message);
        setTimeout(onSuccess, 3000);
      } else {
        setError(res.message);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Une erreur est survenue.");
    } finally {
      setSub(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl px-5 pt-6 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <h2 className="text-gray-800 font-bold text-lg mb-1">Demande de retrait</h2>
        <p className="text-gray-400 text-xs mb-5">
          Solde disponible : <span className="text-green-600 font-semibold">{fmt(balance)} F</span>
        </p>

        {success ? (
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-gray-800 font-bold text-base">Demande envoyée !</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{success}</p>
            <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-1">
              <p className="text-amber-700 text-xs font-medium">
                Vous pouvez suivre l&apos;état de votre retrait dans l&apos;historique ci-dessous.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-xs">{error}</p>
              </div>
            )}

            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1.5">
                Montant (FCFA)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex. 5000"
                min={1000}
                max={balance}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <p className="text-gray-400 text-[10px] mt-1">
                Min. 1 000 F — Max. {fmt(Math.min(balance, 500000))} F
              </p>
            </div>

            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1.5">
                Numéro Mobile Money
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex. 97000000"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-green-600 text-white font-semibold rounded-2xl text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {submitting ? "Envoi en cours…" : "Confirmer le retrait"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── TransactionDetailSheet ───────────────────────────────────────────────────────
function TransactionDetailSheet({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const isCredit = tx.type === "Crédit";
  const typeLabel = isCredit ? "Crédit (gain)" : "Débit (retrait)";

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Type", value: typeLabel },
    { label: "Statut", value: <StatusBadge status={tx.status} /> },
    { label: "Date & heure", value: fmtDateTime(tx.created_at) },
  ];
  if (tx.description) rows.push({ label: "Description", value: tx.description });
  if (tx.reference)   rows.push({ label: "Référence", value: <span className="font-mono break-all">{tx.reference}</span> });

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl px-5 pt-6 pb-10 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* En-tête : icône + montant */}
        <div className="flex flex-col items-center text-center gap-2 mb-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isCredit ? "bg-green-50" : "bg-red-50"}`}>
            <svg className={`w-7 h-7 ${isCredit ? "text-green-600" : "text-red-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCredit
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7M12 3v18" />
              }
            </svg>
          </div>
          <p className={`text-3xl font-bold font-mono tracking-tight ${isCredit ? "text-green-600" : "text-red-500"}`}>
            {isCredit ? "+" : "-"}{fmt(tx.amount)} <span className="text-xl">F</span>
          </p>
          <p className="text-gray-400 text-sm">{tx.description || typeLabel}</p>
        </div>

        {/* Détails */}
        <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-4 px-4 py-3">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide flex-shrink-0">{r.label}</span>
              <span className="text-gray-800 text-sm text-right min-w-0">{r.value}</span>
            </div>
          ))}
        </div>

        {/* Reçu éventuel */}
        {tx.receipt_url && (
          <a
            href={tx.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 bg-green-50 text-green-700 font-semibold rounded-2xl text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Voir le reçu
          </a>
        )}

        <button
          onClick={onClose}
          className="mt-3 w-full py-4 bg-gray-100 text-gray-600 font-semibold rounded-2xl text-sm"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const color =
    s === "COMPLETED"  ? "text-green-600" :
    s === "PROCESSING" ? "text-amber-500" :
    s === "PENDING"    ? "text-amber-500" :
    s === "FAILED"     ? "text-red-500"   :
    s === "CANCELLED"  ? "text-gray-400"  : "text-gray-400";
  const label =
    s === "COMPLETED"  ? "Complété"              :
    s === "PROCESSING" ? "En cours de traitement" :
    s === "PENDING"    ? "En cours de traitement" :
    s === "FAILED"     ? "Échoué"                :
    s === "CANCELLED"  ? "Annulé"                : status;

  return <span className={`text-[10px] font-semibold ${color}`}>{label}</span>;
}
