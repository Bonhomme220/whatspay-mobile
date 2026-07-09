"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { api, userStore } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────
interface Kpis {
  balance: number;
  campaigns_active: number;
  campaigns_total: number;
  impressions: number;
  portee: number;
  frequence: number;
  budget_engage: number;
}
interface CampaignItem {
  id: string;
  name: string;
  status: string;
  impressions: number;
  budget_engage: number;
}
interface DashboardData {
  period_label: string;
  kpis: Kpis;
  chart: { label: string; value: number }[];
  campaigns: CampaignItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));
function fmtCompact(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + " M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + " k";
  return fmt(n);
}

const STATUS: Record<string, { label: string; cls: string }> = {
  ACCEPTED: { label: "Acceptée", cls: "bg-green-50 text-green-700" },
  PAID:     { label: "Active",   cls: "bg-green-50 text-green-700" },
  PENDING:  { label: "En attente", cls: "bg-amber-50 text-amber-700" },
  CLOSED:   { label: "Terminée", cls: "bg-gray-100 text-gray-600" },
  REJECTED: { label: "Rejetée",  cls: "bg-red-50 text-red-600" },
};

export default function AnnouncerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<"impr" | "budget">("impr");
  const firstname = userStore.get()?.firstname ?? "";

  useEffect(() => {
    api.get<DashboardData>("/announcer/dashboard")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const k = data?.kpis;

  return (
    <div className="pb-4">
      {/* ── HERO vert ── */}
      <section className="bg-gradient-to-br from-green-700 to-green-500 px-4 pt-5 pb-6 rounded-b-3xl">
        <h1 className="text-white text-xl font-bold">Bonjour, {firstname} 👋</h1>
        <p className="text-green-100 text-sm mb-4">Gérez vos campagnes publicitaires</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatPill label="Solde"   value={k ? fmtCompact(k.balance) + " F" : "—"} />
          <StatPill label="Actives" value={k ? String(k.campaigns_active) : "—"} />
          <StatPill label="Au total" value={k ? String(k.campaigns_total) : "—"} />
        </div>

        <Link href="/annonceur/campagnes/nouvelle"
          className="flex items-center justify-center gap-2 bg-white text-green-700 font-bold py-3 rounded-xl shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle campagne
        </Link>
      </section>

      {/* ── STATISTIQUES ── */}
      <section className="px-4 mt-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-bold text-gray-900 mb-3">
            Vos statistiques <span className="text-gray-400 font-normal text-sm">· {data?.period_label ?? "30 j"}</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat color="green"  icon="👁" value={k ? fmt(k.impressions) : "—"} label="Impressions" />
            <MiniStat color="indigo" icon="👥" value={k ? fmt(k.portee) : "—"} label="Diffuseurs" />
            <MiniStat color="amber"  icon="🔁" value={k ? String(k.frequence).replace(".", ",") + "×" : "—"} label="Fréquence" />
            <MiniStat color="gray"   icon="💰" value={k ? fmtCompact(k.budget_engage) + " F" : "—"} label="Budget engagé" />
          </div>
        </div>
      </section>

      {/* ── PERFORMANCE ── */}
      <section className="px-4 mt-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Performance</h2>
            <span className="text-xs text-green-600 font-medium">{data?.period_label ?? ""}</span>
          </div>

          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {k ? fmt(metric === "impr" ? k.impressions : k.budget_engage) : "—"}
              </p>
              <p className="text-xs text-gray-400">{metric === "impr" ? "vues obtenues" : "budget engagé (F)"}</p>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
              <button onClick={() => setMetric("impr")}
                className={`px-3 py-1 rounded-md font-medium ${metric === "impr" ? "bg-green-600 text-white" : "text-gray-500"}`}>
                Impr.
              </button>
              <button onClick={() => setMetric("budget")}
                className={`px-3 py-1 rounded-md font-medium ${metric === "budget" ? "bg-green-600 text-white" : "text-gray-500"}`}>
                Budget
              </button>
            </div>
          </div>

          <div className="h-40 -mx-2">
            {data && data.chart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v) => [fmt(Number(v)), metric === "impr" ? "Vues" : "Budget"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 text-sm">
                {loading ? "Chargement…" : "Aucune donnée"}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── VOS CAMPAGNES ── */}
      <section className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-900">Vos campagnes</h2>
          <Link href="/annonceur/campagnes" className="text-sm text-green-600 font-medium">Voir tout →</Link>
        </div>

        <div className="space-y-2">
          {loading && <div className="bg-white rounded-xl border border-gray-100 p-4 text-sm text-gray-400">Chargement…</div>}
          {!loading && (data?.campaigns.length ?? 0) === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-sm text-gray-400">
              Aucune campagne pour le moment.
            </div>
          )}
          {data?.campaigns.map((c) => {
            const st = STATUS[c.status] ?? { label: c.status, cls: "bg-gray-100 text-gray-600" };
            return (
              <Link key={c.id} href={`/annonceur/campagnes/${c.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
                <div className="min-w-0 pr-3">
                  <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(c.impressions)} vues · {fmtCompact(c.budget_engage)} F</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ── UI atoms ─────────────────────────────────────────────────────────────────
function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/15 rounded-xl px-2 py-2.5 text-center">
      <p className="text-white font-bold text-sm leading-tight">{value}</p>
      <p className="text-green-100 text-[11px] mt-0.5">{label}</p>
    </div>
  );
}

const MINI_COLORS: Record<string, string> = {
  green: "text-green-600", indigo: "text-indigo-600", amber: "text-amber-500", gray: "text-gray-700",
};
function MiniStat({ color, icon, value, label }: { color: string; icon: string; value: string; label: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="text-lg mb-1">{icon}</div>
      <p className={`font-bold text-base ${MINI_COLORS[color]}`}>{value}</p>
      <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
    </div>
  );
}
