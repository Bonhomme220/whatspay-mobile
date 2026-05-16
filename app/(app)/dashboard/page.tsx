"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DashboardData {
  user: { firstname: string; lastname: string; name: string };
  stats: {
    in_progress: number; completed: number; expired: number;
    rejected: number; completion: number; total: number;
  };
  earnings: { total_gain: number; balance: number };
  recent_assignments: Array<{
    id: string; status: string; gain: number;
    task_name: string; task?: { type: string }; created_at: string;
  }>;
  monthly: { months: string[]; completed: number[]; gains: number[] };
  faqs: Array<{ id: string; question: string; answer: string }>;
}

// ── Status helpers ─────────────────────────────────────────────────────────────
function statusLabel(s: string) {
  const map: Record<string, string> = {
    SUBMISSION_ACCEPTED: "Terminée", SUBMITED: "Soumise",
    EXPIRED: "Expirée",             SUBMISSION_REJECTED: "Rejetée",
    ASSIGNED: "Disponible",         PENDING: "En cours",
  };
  return map[s] ?? s;
}
function statusColor(s: string) {
  if (s === "SUBMISSION_ACCEPTED") return "bg-green-100 text-green-700";
  if (s === "SUBMITED")            return "bg-blue-100 text-blue-700";
  if (s === "EXPIRED")             return "bg-orange-100 text-orange-700";
  if (s === "SUBMISSION_REJECTED") return "bg-red-100 text-red-700";
  if (s === "ASSIGNED")            return "bg-purple-100 text-purple-700";
  if (s === "PENDING")             return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-600";
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [faqIndex, setFaqIndex]  = useState(0);
  const [loading, setLoading]    = useState(true);
  const [showWaBanner, setShowWaBanner] = useState(() =>
    typeof localStorage !== "undefined" ? localStorage.getItem("wp_wa_channel_joined") !== "1" : false
  );

  function dismissWaBanner() {
    localStorage.setItem("wp_wa_channel_joined", "1");
    setShowWaBanner(false);
  }

  useEffect(() => {
    api.get<DashboardData>("/dashboard")
      .then(setData)
      .catch((err) => {
        if (err?.status === 401) router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!data) return null;

  const { user, stats, earnings, recent_assignments, monthly, faqs } = data;

  // Donut data
  const pieData = [
    { name: "En cours",   value: stats.in_progress, color: "#3b82f6" },
    { name: "Complétées", value: stats.completed,   color: "#16a34a" },
    { name: "Expirées",   value: stats.expired,     color: "#f59e0b" },
    { name: "Rejetées",   value: stats.rejected,    color: "#ef4444" },
  ];
  const totalMissions = stats.total;

  // Line chart data
  const lineData = monthly.months.map((m, i) => ({
    month: m,
    Complétées: monthly.completed[i],
    Gains: monthly.gains[i],
  }));

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Bannière chaîne WhatsApp ── */}
      {showWaBanner && (
        <div className="mx-4 mt-4 rounded-2xl p-4 text-white" style={{ background: "linear-gradient(135deg,#25d366,#128c7e)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.112 1.522 5.843L.044 23.428a.75.75 0 00.919.953l5.82-1.527A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.713 9.713 0 01-4.953-1.355l-.355-.211-3.684.967.982-3.594-.232-.371A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Rejoignez notre chaîne WhatsApp officielle !</p>
              <p className="text-xs mt-0.5" style={{ opacity: 0.9 }}>Actualités, campagnes et annonces en temps réel.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="https://whatsapp.com/channel/0029VbDB5VyISTkL0OHcht2n"
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismissWaBanner}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs"
              style={{ background: "#fff", color: "#128c7e" }}
            >
              Rejoindre
            </a>
            <button
              onClick={dismissWaBanner}
              className="flex-1 py-2 rounded-xl text-xs font-semibold border"
              style={{ background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.4)", color: "#fff" }}
            >
              J'y suis déjà
            </button>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="bg-green-600 px-5 pt-5 pb-14">
        <p className="text-green-100 text-sm">Bienvenue 🔥</p>
        <h1 className="text-white text-2xl font-bold mt-0.5">Dashboard Diffuseur</h1>
        <p className="text-green-100 text-sm mt-1">
          {user.firstname} {user.lastname} · Suivez vos performances
        </p>
        <div className="mt-4">
          <div className="flex justify-between text-green-100 text-xs mb-1.5">
            <span>Taux de complétion</span>
            <span className="font-semibold text-white">{stats.completion}%</span>
          </div>
          <div className="bg-green-500 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${stats.completion}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Stats card overlapping hero ── */}
      <div className="mx-4 -mt-4 bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-gray-700 font-semibold text-sm mb-3">Vos statistiques</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<IcoSync />}   value={stats.in_progress} label="EN COURS"   color="text-blue-500" />
          <StatCard icon={<IcoCheck />}  value={stats.completed}   label="COMPLÉTÉES" color="text-green-600" />
          <StatCard icon={<IcoClock />}  value={stats.expired}     label="EXPIRÉES"   color="text-orange-500" />
          <StatCard icon={<IcoX />}      value={stats.rejected}    label="REJETÉES"   color="text-red-500" />
          <StatCard icon={<IcoCoin />}   value={`${(earnings.total_gain ?? 0).toLocaleString("fr-FR")} F`} label="GAINS" color="text-orange-400" />
          <StatCard icon={<IcoBar />}    value={`${stats.completion}%`} label="COMPLÉTION" color="text-green-600" />
        </div>
      </div>

      {/* ── Actions Rapides ── */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-gray-700 font-semibold text-sm mb-3">Actions Rapides</h2>
        <div className="grid grid-cols-2 gap-3">
          <ActionBtn href="/campagnes"   label="CAMPAGNES" bg="bg-green-600"  icon={<IcoMega />} />
          <ActionBtn href="/gains"       label="GAINS"     bg="bg-teal-500"   icon={<IcoCard />} />
          <ActionBtn href="/tickets"     label="TICKETS"   bg="bg-blue-500"   icon={<IcoTicket />} />
          <ActionBtn href="/ambassadeur" label="PARRAINAGE" bg="bg-yellow-500" icon={<IcoShare />} />
        </div>
      </div>

      {/* ── Tutoriel vidéo ── */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm">
        <a
          href="https://youtube.com/shorts/NWTxbAtdOPg?feature=share"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="bg-gray-900 h-36 flex flex-col items-center justify-center relative">
            <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="text-white text-xs mt-3 text-center px-4">
              Tutoriel : Participer à une campagne sur WhatsPAY
            </p>
          </div>
        </a>
        <div className="bg-white px-4 py-3">
          <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Tutoriel
          </span>
          <h3 className="text-gray-800 font-semibold text-sm mt-2">Comment utiliser WhatsPAY ?</h3>
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">
            Regardez ce guide complet pour apprendre à accepter des campagnes, publier sur WhatsApp et soumettre vos preuves correctement.
          </p>
          <a
            href="https://youtube.com/shorts/NWTxbAtdOPg?feature=share"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-lg"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ouvrir sur YouTube
          </a>
        </div>
      </div>

      {/* ── FAQ ── */}
      {faqs.length > 0 && (
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
                onClick={() => setFaqIndex((i) => Math.min(faqs.length - 1, i + 1))}
                className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 text-xs"
              >›</button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">Q</span>
              <p className="text-gray-700 text-sm font-medium leading-snug">{faqs[faqIndex].question}</p>
            </div>
            <div className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center font-bold flex-shrink-0">R</span>
              <p className="text-gray-500 text-xs leading-relaxed line-clamp-4">{faqs[faqIndex].answer}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <a href="/faq" className="text-green-600 text-xs flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Voir la FAQ complète
            </a>
            <span className="text-gray-400 text-xs">{faqIndex + 1} / {faqs.length}</span>
          </div>
        </div>
      )}

      {/* ── Le saviez-vous ── */}
      <div className="mx-4 mt-4 bg-green-50 border border-green-100 rounded-2xl p-4">
        <div className="flex items-start gap-2">
          <span className="text-green-600 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </span>
          <div>
            <p className="text-green-800 text-xs font-bold uppercase tracking-wide">Le saviez-vous ?</p>
            <p className="text-green-700 text-xs mt-1 leading-relaxed">
              Chaque campagne a une date limite — ne soumettez pas au dernier moment pour éviter les incidents de réseau.
            </p>
          </div>
        </div>
      </div>

      {/* ── Missions récentes ── */}
      {recent_assignments.length > 0 && (
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-gray-700 font-semibold text-sm">Missions Récentes</h2>
            <Link href="/campagnes" className="text-green-600 text-xs font-medium">Voir tout &rsaquo;</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recent_assignments.map((a) => (
              <div key={a.id} className="py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm font-medium truncate">{a.task_name ?? "—"}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {a.task?.type ?? "image_link"} · {fmtDate(a.created_at)}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${statusColor(a.status)}`}>
                  {statusLabel(a.status)}
                </span>
                <span className="text-gray-700 text-xs font-semibold whitespace-nowrap">{a.gain} F</span>
                <Link href={`/campagnes/${a.id}`} className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Donut chart ── */}
      {totalMissions > 0 && (
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-gray-700 font-semibold text-sm mb-4">Répartition Des Missions</h2>
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <PieTooltip formatter={(v, n) => [`${v}`, n]} />
              </PieChart>
            </ResponsiveContainer>
            {/* Centre label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-800">{totalMissions}</span>
              <span className="text-xs text-gray-500">missions</span>
            </div>
          </div>
          {/* Légende */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-gray-600">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Line chart mensuel ── */}
      <div className="mx-4 mt-4 mb-4 bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-700 font-semibold text-sm">Activité Mensuelle</h2>
          <span className="text-gray-400 text-xs">6 derniers mois</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={lineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="Complétées" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Gains"      stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-1">
      <span className={color}>{icon}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-gray-500 font-medium tracking-wide">{label}</span>
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
function IcoClock()  { return <svg className={w5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function IcoX()      { return <svg className={w5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>; }
function IcoCoin()   { return <svg className={w5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function IcoBar()    { return <svg className={w5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
function IcoMega()   { return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>; }
function IcoCard()   { return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>; }
function IcoTicket() { return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>; }
function IcoShare()  { return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>; }
