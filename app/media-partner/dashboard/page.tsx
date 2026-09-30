"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface CurrentTier { label: string; flat_price: number; }
interface RecentMission {
  id: string; task_name: string | null; status: string;
  gain: number; assignment_date: string | null;
}
interface FaqItem { id: string; question: string; answer: string; }
interface MissionsStats { total: number; in_progress: number; completed: number; }
interface DashboardData {
  channel_name: string;
  status: "actif" | "inactif" | "off";
  current_tier: CurrentTier | null;
  reached_accounts_30d: number;
  consecutive_missed_recaptures: number;
  recapture_needed: boolean;
  recapture_window_open: boolean;
  balance: number;
  missions_stats: MissionsStats;
  recent_missions: RecentMission[];
  faqs: FaqItem[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtMoney = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_LABEL: Record<string, string> = {
  actif: "Actif", inactif: "Inactif", off: "Off",
};
const STATUS_COLOR: Record<string, string> = {
  actif: "bg-white text-green-700", inactif: "bg-orange-400 text-white", off: "bg-red-500 text-white",
};

const MISSION_STATUS_LABEL: Record<string, string> = {
  ASSIGNED: "Disponible", PENDING: "En cours", SUBMITED: "Soumise",
  SUBMISSION_ACCEPTED: "Terminée", SUBMISSION_REJECTED: "Rejetée", EXPIRED: "Expirée",
};
const MISSION_STATUS_COLOR: Record<string, string> = {
  ASSIGNED: "bg-purple-100 text-purple-700",
  PENDING: "bg-blue-100 text-blue-600",
  SUBMITED: "bg-orange-100 text-orange-600",
  SUBMISSION_ACCEPTED: "bg-green-100 text-green-700",
  SUBMISSION_REJECTED: "bg-red-100 text-red-600",
  EXPIRED: "bg-red-100 text-red-600",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MediaPartnerDashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [faqIndex, setFaqIndex] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    api.get<DashboardData>("/media-partner/dashboard")
      .then(setData)
      .catch(() => {}) // 401 géré globalement par lib/api.ts
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!data) return null;

  const urgent = data.status === "inactif" || data.status === "off";

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Hero ── */}
      <div className="bg-green-600 px-5 pt-5 pb-14">
        <p className="text-green-100 text-sm">Bienvenue 🔥</p>
        <div className="flex items-center justify-between mt-0.5">
          <h1 className="text-white text-2xl font-bold truncate">{data.channel_name}</h1>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLOR[data.status]}`}>
            {STATUS_LABEL[data.status]}
          </span>
        </div>
        <p className="text-green-100 text-sm mt-1">
          {data.current_tier
            ? `Palier ${data.current_tier.label} · ${fmtMoney(data.current_tier.flat_price)} F / mission`
            : "Aucun palier attribué pour le moment"}
        </p>
      </div>

      {/* ── Stats card overlapping hero ── */}
      <div className="mx-4 -mt-4 bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-gray-700 font-semibold text-sm mb-3">Vos statistiques</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<IcoWallet />} value={`${fmtMoney(data.balance)} F`} label="SOLDE" color="text-green-600" />
          <StatCard icon={<IcoSync />}   value={data.missions_stats.in_progress} label="EN COURS" color="text-blue-500" />
          <StatCard icon={<IcoCheck />}  value={data.missions_stats.completed}   label="COMPLÉTÉES" color="text-green-600" />
          <StatCard icon={<IcoEye />}    value={fmtMoney(data.reached_accounts_30d)} label="COMPTES TOUCHÉS (30J)" color="text-orange-400" />
        </div>
      </div>

      {/* ── Bannière recapture ── */}
      {data.recapture_needed && (
        <Link
          href="/media-partner/recapture"
          className={`mx-4 mt-4 flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-sm border ${
            urgent ? "bg-orange-50 border-orange-100" : "bg-white border-gray-50"
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${urgent ? "bg-orange-100" : "bg-green-100"}`}>
            <svg className={`w-5 h-5 ${urgent ? "text-orange-600" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2a4 4 0 014-4h3m0 0l-3-3m3 3l-3 3M5 5h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${urgent ? "text-orange-700" : "text-gray-800"}`}>
              📋 {urgent
                ? `Compte ${data.status} — mettez à jour vos chiffres`
                : data.recapture_window_open
                  ? "La fenêtre de recapture est ouverte"
                  : "Mettez à jour les chiffres de votre chaîne"}
            </p>
            <p className={`text-xs mt-0.5 ${urgent ? "text-orange-600" : "text-gray-500"}`}>
              {urgent
                ? "Une recapture valide réactive votre compte automatiquement."
                : data.recapture_window_open
                  ? "Soumettez vos chiffres du mois avant la fermeture de la fenêtre (5-10 du mois)."
                  : "Vous pouvez déjà soumettre vos chiffres par anticipation."}
            </p>
          </div>
          <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      {/* ── Actions Rapides ── */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-gray-700 font-semibold text-sm mb-3">Actions Rapides</h2>
        <div className="grid grid-cols-2 gap-3">
          <ActionBtn href="/media-partner/missions"   label="MISSIONS"    bg="bg-green-600"  icon={<IcoMega />} />
          <ActionBtn href="/media-partner/wallet"     label="GAINS"       bg="bg-teal-500"   icon={<IcoCard />} />
          <ActionBtn href="/media-partner/recapture"  label="MES CHIFFRES" bg="bg-blue-500"  icon={<IcoChart />} />
          <ActionBtn href="/media-partner/profil"     label="PROFIL"      bg="bg-yellow-500" icon={<IcoUser />} />
        </div>
      </div>

      {/* ── Missions récentes ── */}
      {data.recent_missions.length > 0 && (
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-gray-700 font-semibold text-sm">Missions Récentes</h2>
            <Link href="/media-partner/missions" className="text-green-600 text-xs font-medium">Voir tout &rsaquo;</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recent_missions.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm font-medium truncate">{m.task_name ?? "—"}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{fmtDate(m.assignment_date)}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${MISSION_STATUS_COLOR[m.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {MISSION_STATUS_LABEL[m.status] ?? m.status}
                </span>
                <span className="text-gray-700 text-xs font-semibold whitespace-nowrap">{fmtMoney(m.gain)} F</span>
                <Link href={`/media-partner/missions/${m.id}`} className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FAQ ── */}
      {data.faqs.length > 0 && (
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h2 className="text-gray-700 font-semibold text-sm">Questions fréquentes</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFaqIndex((i) => Math.max(0, i - 1))}
                className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 text-xs"
              >‹</button>
              <button
                onClick={() => setFaqIndex((i) => Math.min(data.faqs.length - 1, i + 1))}
                className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 text-xs"
              >›</button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">Q</span>
              <p className="text-gray-700 text-sm font-medium leading-snug">{data.faqs[faqIndex].question}</p>
            </div>
            <div className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center font-bold flex-shrink-0">R</span>
              <p className="text-gray-500 text-xs leading-relaxed line-clamp-4">{data.faqs[faqIndex].answer}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <Link href="/media-partner/faq" className="text-green-600 text-xs flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Voir la FAQ complète
            </Link>
            <span className="text-gray-400 text-xs">{faqIndex + 1} / {data.faqs.length}</span>
          </div>
        </div>
      )}

      <div className="h-4" />

    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-1">
      <span className={color}>{icon}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-gray-500 font-medium tracking-wide text-center">{label}</span>
    </div>
  );
}

function ActionBtn({ href, label, bg, icon }: { href: string; label: string; bg: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className={`${bg} rounded-xl p-4 flex flex-col items-center justify-center gap-2 min-h-[80px]`}>
      <span className="text-white">{icon}</span>
      <span className="text-white text-xs font-bold tracking-wide">{label}</span>
    </Link>
  );
}

// ── Inline icons ───────────────────────────────────────────────────────────────
const w5 = "w-5 h-5";
function IcoSync()   { return <svg className={w5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>; }
function IcoCheck()  { return <svg className={w5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>; }
function IcoEye()    { return <svg className={w5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>; }
function IcoWallet() { return <svg className={w5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>; }
function IcoMega()   { return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>; }
function IcoCard()   { return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>; }
function IcoChart()  { return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6m4 6V9m4 10V5M5 19h14a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v12a1 1 0 001 1z" /></svg>; }
function IcoUser()   { return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
