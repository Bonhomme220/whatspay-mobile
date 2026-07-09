"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { fmt, fmtCompact, fmtDate, statusMeta, isVideo, isImage } from "@/lib/annonceur";

interface Campaign {
  id: string; name: string; description: string | null; status: string;
  files: string | null; media_type: string | null; legend: string | null; url: string | null;
  startdate: string | null; enddate: string | null; view_price: number; created_at: string;
}
interface Progress {
  total_days: number | null; elapsed_days: number; remaining_days: number;
  pct: number; is_active: boolean; is_ended: boolean; status: string;
}
interface Kpis {
  portee: number; vues_obtenues: number; objectif_total: number; objectif_par_jour: number;
  budget_consomme: number; cout_par_vue: number; views_cible: number; views_assigned: number;
  views_live: number; views_gap: number; coverage_pct: number | null; data_confidence: number | null;
}
interface ByStatus {
  assigned: number; pending: number; submitted: number; accepted: number; rejected: number; expired: number;
}
interface DetailResponse {
  campaign: Campaign; progress: Progress; kpis: Kpis; assignments_by_status: ByStatus;
}

export default function CampagneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<DetailResponse>(`/announcer/campaigns/${id}`)
      .then(setData)
      .catch((e) => setError(e?.message ?? "Impossible de charger la campagne."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-center text-gray-400 text-sm">Chargement…</div>;
  if (error || !data) return (
    <div className="p-6 text-center">
      <p className="text-gray-500 text-sm">{error || "Introuvable."}</p>
      <button onClick={() => router.push("/annonceur/campagnes")} className="mt-4 text-green-600 font-medium text-sm">← Retour</button>
    </div>
  );

  const { campaign: c, progress: pr, kpis: k, assignments_by_status: bs } = data;
  const st = statusMeta(c.status);
  const objPct = k.objectif_total > 0 ? Math.min(100, Math.round((k.vues_obtenues / k.objectif_total) * 100)) : 0;

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{c.name}</h1>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
      </div>

      {/* Média */}
      <div className="px-4 mt-3">
        <MediaPreview files={c.files} mediaType={c.media_type} legend={c.legend} />
      </div>

      {/* Progression temporelle */}
      {pr.total_days !== null && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-gray-500">{fmtDate(c.startdate)} → {fmtDate(c.enddate)}</span>
              <span className="font-semibold text-gray-900">
                {pr.is_ended ? "Terminée" : pr.is_active ? `${pr.remaining_days} j restants` : "À venir"}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${pr.pct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* KPIs principaux */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <Kpi color="green"  value={fmt(k.vues_obtenues)} label="Vues obtenues" sub={`objectif ${fmt(k.objectif_total)}`} />
        <Kpi color="indigo" value={fmt(k.portee)} label="Diffuseurs" sub="portée réelle" />
        <Kpi color="gray"   value={fmtCompact(k.budget_consomme) + " F"} label="Budget consommé" sub={`${k.cout_par_vue} F / vue`} />
        <Kpi color="amber"  value={k.data_confidence !== null ? k.data_confidence + " %" : "—"} label="Fiabilité données" sub="soumissions validées" />
      </div>

      {/* Barre objectif */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">Atteinte de l&apos;objectif</span>
            <span className="text-sm font-bold text-green-600">{objPct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${objPct}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
            <span>{fmt(k.vues_obtenues)} vues</span>
            <span>cible {fmt(k.objectif_total)}</span>
          </div>
          {k.views_gap > 0 && (
            <p className="text-[11px] text-amber-600 mt-2">
              {fmt(k.views_gap)} vues encore à couvrir par l&apos;assignation.
            </p>
          )}
        </div>
      </div>

      {/* Répartition diffuseurs */}
      <div className="px-4 mt-4">
        <h2 className="font-bold text-gray-900 mb-2 text-sm">Diffuseurs de la campagne</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          <StatusRow label="En cours de diffusion" value={bs.assigned + bs.pending} tone="amber" />
          <StatusRow label="Soumissions reçues" value={bs.submitted} tone="indigo" />
          <StatusRow label="Validées" value={bs.accepted} tone="green" />
          <StatusRow label="Rejetées" value={bs.rejected} tone="red" />
          {bs.expired > 0 && <StatusRow label="Expirées" value={bs.expired} tone="gray" />}
        </div>
      </div>

      {/* Détails campagne */}
      {(c.description || c.url) && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
            {c.description && <p className="text-sm text-gray-600 whitespace-pre-line">{c.description}</p>}
            {c.url && (
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 font-medium break-all">
                {c.url}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── UI atoms ─────────────────────────────────────────────────────────────────
const KPI_COLORS: Record<string, string> = {
  green: "text-green-600", indigo: "text-indigo-600", amber: "text-amber-500", gray: "text-gray-700",
};
function Kpi({ color, value, label, sub }: { color: string; value: string; label: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5">
      <p className={`font-bold text-lg ${KPI_COLORS[color]}`}>{value}</p>
      <p className="text-xs font-semibold text-gray-700">{label}</p>
      <p className="text-[11px] text-gray-400">{sub}</p>
    </div>
  );
}

const TONE: Record<string, string> = {
  amber: "bg-amber-500", indigo: "bg-indigo-500", green: "bg-green-500", red: "bg-red-500", gray: "bg-gray-400",
};
function StatusRow({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-gray-600">
        <span className={`w-2 h-2 rounded-full ${TONE[tone]}`} />
        {label}
      </span>
      <span className="font-bold text-gray-900">{fmt(value)}</span>
    </div>
  );
}

function MediaPreview({ files, mediaType, legend }: { files: string | null; mediaType: string | null; legend: string | null }) {
  if (!files) {
    return <div className="w-full h-40 rounded-2xl bg-green-50 flex items-center justify-center text-4xl">📢</div>;
  }
  return (
    <div>
      {isVideo(mediaType, files) ? (
        <video src={files} controls playsInline className="w-full max-h-72 rounded-2xl bg-black object-contain" />
      ) : isImage(mediaType, files) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={files} alt="" className="w-full max-h-72 rounded-2xl object-cover bg-gray-100" />
      ) : (
        <a href={files} target="_blank" rel="noopener noreferrer"
          className="block w-full py-4 rounded-2xl bg-gray-100 text-center text-sm text-green-600 font-medium">
          Ouvrir le média →
        </a>
      )}
      {legend && <p className="text-sm text-gray-500 mt-2 whitespace-pre-line">{legend}</p>}
    </div>
  );
}
