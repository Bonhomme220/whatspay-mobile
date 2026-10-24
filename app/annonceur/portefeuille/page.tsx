"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { fmt } from "@/lib/annonceur";

interface Tx {
  id: string; amount: number; type: string; is_credit: boolean; status: string;
  description: string | null; reference: string | null;
  receipt_url: string | null; receipt_requested: boolean; created_at: string;
}
interface WalletData {
  balance: number;
  stats: { total_credits: number; total_debits: number; this_month_credits: number; this_month_debits: number; total_transactions: number };
  transactions: Tx[];
}

export default function PortefeuillePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-400 text-sm">Chargement…</div>}>
      <PortefeuilleInner />
    </Suspense>
  );
}

function PortefeuilleInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "warn" | "error"; text: string } | null>(null);

  const load = useCallback(() => api.get<WalletData>("/announcer/wallet").then(setData).catch(() => {}), []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  // Retour PayPlus (?status=success|cancelled)
  useEffect(() => {
    const status = params.get("status");
    if (!status) return;
    if (status === "success") {
      setBanner({ type: "success", text: "Paiement reçu. Mise à jour du solde en cours…" });
      // Le crédit passe par le callback serveur : on rafraîchit quelques fois.
      let n = 0;
      const iv = setInterval(() => { load(); if (++n >= 4) clearInterval(iv); }, 2500);
    } else {
      setBanner({ type: "warn", text: "Paiement annulé ou non abouti." });
    }
    // Nettoie l'URL
    router.replace("/annonceur/portefeuille");
  }, [params, load, router]);

  return (
    <div className="pb-8">
      {/* Solde */}
      <section className="bg-gradient-to-br from-green-700 to-green-500 px-4 pt-6 pb-8 rounded-b-3xl">
        <p className="text-green-100 text-sm">Solde disponible</p>
        <p className="text-white text-3xl font-bold mt-1">{loading ? "…" : fmt(data?.balance ?? 0)} <span className="text-lg font-medium">F</span></p>
        <button onClick={() => setSheet(true)}
          className="mt-4 flex items-center justify-center gap-2 bg-white text-green-700 font-bold py-3 px-5 rounded-xl shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
          </svg>
          Recharger
        </button>
      </section>

      {banner && (
        <div className={`mx-4 mt-4 rounded-lg px-3 py-2.5 text-sm ${
          banner.type === "success" ? "bg-green-50 text-green-700 border border-green-200"
          : banner.type === "warn" ? "bg-amber-50 text-amber-700 border border-amber-200"
          : "bg-red-50 text-red-600 border border-red-200"}`}>
          {banner.text}
        </div>
      )}

      {/* Stats du mois */}
      {data && (
        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400">Rechargé ce mois</p>
            <p className="font-bold text-green-600 text-lg">{fmt(data.stats.this_month_credits)} F</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400">Dépensé ce mois</p>
            <p className="font-bold text-gray-700 text-lg">{fmt(data.stats.this_month_debits)} F</p>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="px-4 mt-5">
        <h2 className="font-bold text-gray-900 mb-2">Transactions</h2>
        <div className="space-y-2">
          {loading && <div className="bg-white rounded-xl border border-gray-100 p-4 text-sm text-gray-400">Chargement…</div>}
          {!loading && (data?.transactions.length ?? 0) === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">Aucune transaction.</div>
          )}
          {data?.transactions.map((t) => <TxRow key={t.id} t={t} onRequested={load} />)}
        </div>
      </div>

      {sheet && <RechargeSheet onClose={() => setSheet(false)} onPaid={() => { setSheet(false); load(); setBanner({ type: "success", text: "Paiement confirmé : ton portefeuille est crédité." }); }} />}
    </div>
  );
}

function TxRow({ t, onRequested }: { t: Tx; onRequested: () => void }) {
  const [busy, setBusy] = useState(false);
  const date = new Date(t.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  async function requestReceipt() {
    setBusy(true);
    try {
      await api.post(`/announcer/wallet/transactions/${t.id}/receipt`, {});
      onRequested();
    } catch { /* ignore */ } finally { setBusy(false); }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${t.is_credit ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
            {t.is_credit ? "↓" : "↑"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{t.description ?? (t.is_credit ? "Rechargement" : "Dépense")}</p>
            <p className="text-xs text-gray-400">{date}</p>
          </div>
        </div>
        <p className={`font-bold text-sm whitespace-nowrap ${t.is_credit ? "text-green-600" : "text-gray-700"}`}>
          {t.is_credit ? "+" : "−"}{fmt(t.amount)} F
        </p>
      </div>
      {t.is_credit && !t.receipt_url && (
        <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end">
          {t.receipt_requested ? (
            <span className="text-xs text-gray-400">Facture demandée</span>
          ) : (
            <button onClick={requestReceipt} disabled={busy} className="text-xs text-green-600 font-medium disabled:opacity-50">
              {busy ? "…" : "Demander une facture"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Réglage par pays (réseaux, format du numéro, mode) fourni par le serveur : le même que l'espace annonceur.
interface DepNetwork { code: string; name: string; otp: boolean }
interface DepCountry { iso: string; name: string; dial: string; digits: number; example: string; mode: "direct" | "redirect"; networks: DepNetwork[] }
interface DepOptions { default_country: string; countries: DepCountry[]; min_amount?: number }
type AddFundsRes = { mode?: "direct" | "redirect"; redirect_url?: string; transaction_id?: string; phone?: string; message?: string };

function RechargeSheet({ onClose, onPaid }: { onClose: () => void; onPaid: () => void }) {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [opts, setOpts] = useState<DepOptions | null>(null);
  const [country, setCountry] = useState("");
  const [network, setNetwork] = useState("");
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState<string | null>(null); // paiement direct : en attente de validation
  const [error, setError] = useState("");

  const PRESETS = [5000, 10000, 25000, 50000, 100000, 250000];
  const min = opts?.min_amount ?? 5000;

  const loadOptions = useCallback(() => {
    setError("");
    api.get<DepOptions>("/announcer/wallet/deposit-options").then((o) => {
      setOpts(o);
      setCountry((c) => c || o.default_country);
    }).catch(() => setError("Impossible de charger les moyens de paiement. Vérifie ta connexion."));
  }, []);
  useEffect(() => { loadOptions(); }, [loadOptions]);

  const c = opts?.countries.find((x) => x.iso === country) ?? null;
  const net = c?.networks.find((n) => n.code === network) ?? null;
  useEffect(() => { setNetwork(c?.networks[0]?.code ?? ""); setOtp(""); }, [country]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    setError("");
    const amt = parseFloat(amount) || 0;
    if (amt < min) { setError(`Le montant minimum de recharge est de ${fmt(min)} F.`); return; }
    if (!c) { setError("Choisis ton pays."); return; }
    if (phone.replace(/\D/g, "").length < c.digits) { setError(`Saisis les ${c.digits} chiffres de ton numéro ${c.name} (ex. ${c.example}).`); return; }
    if (net?.otp && !otp) { setError("Saisis le code de paiement (OTP) généré depuis ton compte Orange Money."); return; }
    setLoading(true);
    try {
      const res = await api.post<AddFundsRes>("/announcer/wallet/add-funds", { amount: amt, country, network, phone, otp: otp || undefined });
      if (res.mode === "direct" && res.transaction_id) {
        setWaiting(res.message ?? `Demande envoyée au ${res.phone} : valide-la sur ton téléphone.`);
        poll(res.transaction_id);
        return;
      }
      // Redirige vers PayPlus. Le retour ramène sur /annonceur/portefeuille?status=…
      if (res.redirect_url) { window.location.href = res.redirect_url; return; }
      setError("Redirection de paiement indisponible.");
      setLoading(false);
    } catch (e: any) {
      setError(e?.message ?? "Échec de l'initialisation du paiement.");
      setLoading(false);
    }
  }

  function poll(id: string) {
    let n = 0;
    const iv = setInterval(async () => {
      n++;
      try {
        const st = await api.get<{ status: string }>(`/announcer/wallet/deposits/${id}`);
        if (st.status === "completed") { clearInterval(iv); onPaid(); return; }
        if (st.status === "failed") { clearInterval(iv); setWaiting(null); setLoading(false); setError("Paiement refusé ou annulé sur ton téléphone."); return; }
      } catch { /* nouvel essai au prochain tour */ }
      if (n >= 36) { clearInterval(iv); setWaiting(null); setLoading(false); setError("Paiement toujours en attente. Ton solde sera crédité dès sa validation."); }
    }, 5000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full bg-white rounded-t-3xl p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recharger le portefeuille</h2>

        {error && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</div>}

        <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant (F CFA)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex. 10000"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
        <div className="flex flex-wrap gap-2 mt-2">
          {PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => setAmount(String(p))}
              className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{fmt(p)} F</button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} onFocus={() => { if (!opts) loadOptions(); }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-green-500">
              {!opts && <option value="">Chargement…</option>}
              {opts?.countries.map((x) => <option key={x.iso} value={x.iso}>{x.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Réseau</label>
            <select value={network} onChange={(e) => setNetwork(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-green-500">
              {c?.networks.map((n) => <option key={n.code} value={n.code}>{n.name}</option>)}
            </select>
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1.5 mt-4">Numéro Mobile Money{c ? ` (+${c.dial})` : ""}</label>
        <input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={c ? `Ex. ${c.example}` : ""}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />

        {net?.otp && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 mt-4">Code de paiement Orange Money (OTP)</label>
            <input type="text" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Code généré depuis ton compte Orange Money"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
          </>
        )}

        {waiting && <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 text-sm text-green-700">{waiting}</div>}

        <button onClick={submit} disabled={loading || !opts}
          className="w-full mt-5 bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
          {waiting ? "En attente de validation…" : loading ? (c?.mode === "direct" ? "Envoi de la demande…" : "Redirection…") : (c?.mode === "direct" ? "Payer" : "Payer via PayPlus")}
        </button>
        <p className="text-[11px] text-gray-400 text-center mt-2">
          {c?.mode === "direct" ? "La demande de paiement arrive sur ton téléphone : valide-la avec ton code secret Mobile Money." : "Tu seras redirigé vers la passerelle sécurisée PayPlus."}
        </p>
      </div>
    </div>
  );
}
