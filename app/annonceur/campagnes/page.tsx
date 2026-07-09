"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { fmt, fmtCompact, fmtDate, statusMeta, isVideo, isImage } from "@/lib/annonceur";

interface CampaignItem {
  id: string;
  name: string;
  status: string;
  files: string | null;
  media_type: string | null;
  startdate: string | null;
  enddate: string | null;
  impressions: number;
  portee: number;
  budget_engage: number;
  objectif: number;
}
interface Counts { total: number; accepted: number; pending: number; closed: number; rejected: number }
interface ListResponse { counts: Counts; campaigns: CampaignItem[] }

const TABS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: "all",      label: "Toutes",     match: () => true },
  { key: "active",   label: "Actives",    match: (s) => s === "ACCEPTED" || s === "PAID" },
  { key: "pending",  label: "En attente", match: (s) => s === "PENDING" },
  { key: "closed",   label: "Terminées",  match: (s) => s === "CLOSED" },
];

export default function CampagnesPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    api.get<ListResponse>("/announcer/campaigns")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeTab = TABS.find((t) => t.key === tab)!;
  const list = (data?.campaigns ?? []).filter((c) => activeTab.match(c.status));

  return (
    <div className="pb-24">
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Campagnes</h1>
        <span className="text-sm text-gray-400">{data?.counts.total ?? 0} au total</span>
      </div>

      {/* Accès aux briefs */}
      <Link href="/annonceur/briefs"
        className="mx-4 mb-1 flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-3.5 py-2.5">
        <span className="text-sm text-green-800">💡 Pas le temps ? Confiez un <b>brief</b> à l&apos;équipe</span>
        <span className="text-green-600 font-bold">→</span>
      </Link>

      {/* Onglets de filtre */}
      <div className="px-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              tab === t.key ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-500"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="px-4 mt-3 space-y-3">
        {loading && <div className="bg-white rounded-xl border border-gray-100 p-4 text-sm text-gray-400">Chargement…</div>}
        {!loading && list.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            Aucune campagne dans cette catégorie.
          </div>
        )}
        {list.map((c) => {
          const st = statusMeta(c.status);
          const progress = c.objectif > 0 ? Math.min(100, Math.round((c.impressions / c.objectif) * 100)) : 0;
          return (
            <Link key={c.id} href={`/annonceur/campagnes/${c.id}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex gap-3 p-3">
                <Thumb files={c.files} mediaType={c.media_type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {fmtDate(c.startdate)} → {fmtDate(c.enddate)}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <Metric label="vues" value={fmt(c.impressions)} />
                    <Metric label="diffuseurs" value={fmt(c.portee)} />
                    <Metric label="budget" value={fmtCompact(c.budget_engage) + " F"} />
                  </div>
                </div>
              </div>
              {c.objectif > 0 && (
                <div className="px-3 pb-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{progress}% de l&apos;objectif ({fmt(c.objectif)} vues)</p>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* FAB nouvelle campagne */}
      <Link href="/annonceur/campagnes/nouvelle"
        className="fixed bottom-20 right-4 z-30 flex items-center gap-2 bg-green-600 text-white font-bold pl-4 pr-5 py-3 rounded-full shadow-lg">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 4v16m8-8H4" />
        </svg>
        Nouvelle
      </Link>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-gray-600">
      <span className="font-bold text-gray-900">{value}</span> <span className="text-gray-400">{label}</span>
    </span>
  );
}

function Thumb({ files, mediaType }: { files: string | null; mediaType: string | null }) {
  if (files && isImage(mediaType, files)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={files} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100" />;
  }
  if (files && isVideo(mediaType, files)) {
    return (
      <div className="w-16 h-16 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
      </div>
    );
  }
  return (
    <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 text-2xl">📢</div>
  );
}
