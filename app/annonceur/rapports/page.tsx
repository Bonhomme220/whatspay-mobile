"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";
import { fmt, fmtCompact, statusMeta } from "@/lib/annonceur";

interface Kpis {
  impressions: number; portee: number; frequence: number; budget_engage: number;
  clics: number; clics_uniques: number; ctr: number; conversions: number; campaigns: number;
}
interface Row { id: string; name: string; status: string; impressions: number; portee: number; budget_engage: number; clics: number; ctr: number; conversions: number }
interface Break { label: string; impressions: number; portee: number }
interface ReportData {
  period: string; period_label: string; kpis: Kpis;
  chart: { label: string; impressions: number; portee: number }[];
  top_campaigns: Row[]; by_locality: Break[]; by_category: Break[];
}

const PERIODS: [string, string][] = [["7d", "7 j"], ["30d", "30 j"], ["90d", "90 j"], ["all", "Tout"]];

export default function RapportsPage() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<ReportData>(`/announcer/reports?period=${period}`)
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [period]);

  const k = data?.kpis;

  return (
    <div className="pb-8">
      <div className="px-4 pt-5">
        <h1 className="text-xl font-bold text-gray-900">Rapports & analyses</h1>
        {/* Sélecteur de période */}
        <div className="flex gap-2 mt-3">
          {PERIODS.map(([key, label]) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${
                period === key ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="px-4 mt-6 text-center text-gray-400 text-sm">Chargement…</div>}

      {!loading && k && (
        <>
          {/* KPIs */}
          <div className="px-4 mt-4 grid grid-cols-2 gap-3">
            <Kpi value={fmt(k.impressions)} label="Impressions" color="green" />
            <Kpi value={fmt(k.portee)} label="Diffuseurs" color="indigo" />
            <Kpi value={fmtCompact(k.budget_engage) + " F"} label="Budget engagé" color="gray" />
            <Kpi value={fmt(k.clics)} label="Clics" color="amber" sub={`CTR ${k.ctr}%`} />
          </div>

          {/* Chart impressions + portée */}
          <div className="px-4 mt-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900 text-sm">Évolution</h2>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />Impressions</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />Diffuseurs</span>
                </div>
              </div>
              <div className="h-44 -mx-2">
                {data && data.chart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.chart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                      <Line type="monotone" dataKey="impressions" stroke="#16a34a" strokeWidth={2} dot={false} name="Impressions" />
                      <Line type="monotone" dataKey="portee" stroke="#818cf8" strokeWidth={2} dot={false} name="Diffuseurs" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-gray-300 text-sm">Aucune donnée</div>}
              </div>
            </div>
          </div>

          {/* Répartitions */}
          {data!.by_locality.length > 0 && (
            <Breakdown title="Top localités" rows={data!.by_locality} />
          )}
          {data!.by_category.length > 0 && (
            <Breakdown title="Top catégories" rows={data!.by_category} />
          )}

          {/* Top campagnes */}
          <div className="px-4 mt-5">
            <h2 className="font-bold text-gray-900 mb-2 text-sm">Performance par campagne</h2>
            <div className="space-y-2">
              {data!.top_campaigns.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-400">Aucune campagne.</div>
              )}
              {data!.top_campaigns.map((r) => {
                const st = statusMeta(r.status);
                return (
                  <Link key={r.id} href={`/annonceur/campagnes/${r.id}`}
                    className="block bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm truncate">{r.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-2 text-center">
                      <Mini label="Vues" value={fmtCompact(r.impressions)} />
                      <Mini label="Diff." value={fmtCompact(r.portee)} />
                      <Mini label="Clics" value={fmtCompact(r.clics)} />
                      <Mini label="CTR" value={r.ctr + "%"} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const KPI_COLORS: Record<string, string> = { green: "text-green-600", indigo: "text-indigo-600", amber: "text-amber-500", gray: "text-gray-700" };
function Kpi({ value, label, color, sub }: { value: string; label: string; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5">
      <p className={`font-bold text-lg ${KPI_COLORS[color]}`}>{value}</p>
      <p className="text-xs font-semibold text-gray-700">{label}</p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-bold text-gray-900 text-sm">{value}</p>
      <p className="text-[10px] text-gray-400 uppercase">{label}</p>
    </div>
  );
}
function Breakdown({ title, rows }: { title: string; rows: Break[] }) {
  const max = Math.max(...rows.map((r) => r.impressions), 1);
  return (
    <div className="px-4 mt-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="font-bold text-gray-900 text-sm mb-3">{title}</h2>
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 truncate pr-2">{r.label}</span>
                <span className="font-semibold text-gray-900 whitespace-nowrap">{fmt(r.impressions)} vues</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${(r.impressions / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
