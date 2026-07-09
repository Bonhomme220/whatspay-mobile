"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { fmtDate, fmt, briefStatusMeta, type Brief } from "@/lib/annonceur";

export default function BriefDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"publish" | "delete" | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    api.get<{ brief: Brief }>(`/briefs/${id}`)
      .then((r) => setBrief(r.brief))
      .catch((e) => setError(e?.message ?? "Introuvable."))
      .finally(() => setLoading(false));
  }, [id]);

  async function publish() {
    setActionError(""); setBusy("publish");
    try {
      const r = await api.post<{ brief: Brief }>(`/briefs/${id}/publish`, {});
      setBrief(r.brief);
    } catch (e: any) {
      setActionError(e?.message ?? "Publication impossible.");
    } finally { setBusy(null); }
  }

  async function remove() {
    if (!confirm("Supprimer ce brief ?")) return;
    setActionError(""); setBusy("delete");
    try {
      await api.delete(`/briefs/${id}`);
      router.replace("/annonceur/briefs");
    } catch (e: any) {
      setActionError(e?.message ?? "Suppression impossible.");
      setBusy(null);
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-400 text-sm">Chargement…</div>;
  if (error || !brief) return (
    <div className="p-6 text-center">
      <p className="text-gray-500 text-sm">{error || "Introuvable."}</p>
      <button onClick={() => router.push("/annonceur/briefs")} className="mt-4 text-green-600 font-medium text-sm">← Retour</button>
    </div>
  );

  const st = briefStatusMeta(brief.status);
  const canPublish = brief.status === "draft";
  const canDelete = brief.status === "draft" || brief.status === "rejected";

  return (
    <div className="pb-28">
      <div className="px-4 pt-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{brief.name}</h1>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
      </div>

      {brief.status === "rejected" && brief.admin_note && (
        <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-red-700 mb-0.5">Note de l&apos;équipe</p>
          <p className="text-sm text-red-600">{brief.admin_note}</p>
        </div>
      )}
      {brief.status === "campaign_created" && (
        <div className="mx-4 mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
          Une campagne a été créée à partir de ce brief. 🎉
        </div>
      )}

      {actionError && <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{actionError}</div>}

      {/* Visuels */}
      {brief.media.length > 0 && (
        <div className="px-4 mt-4">
          <div className="grid grid-cols-3 gap-2">
            {brief.media.map((m) => (
              <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                {m.is_video
                  ? <video src={m.url} className="w-full h-full object-cover" muted />
                  /* eslint-disable-next-line @next/next/no-img-element */
                  : <img src={m.url} alt={m.original_name} className="w-full h-full object-cover" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Détails */}
      <div className="px-4 mt-4 space-y-3">
        <Card><Row label="Objectif" value={brief.objective_label} /></Card>
        <Card>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Description</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{brief.description}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Audience cible</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{brief.target_audience}</p>
        </Card>
        {(brief.link || brief.preferred_start_date || brief.duration_days || brief.target_impressions) && (
          <Card>
            {brief.link && <Row label="Lien" value={brief.link} />}
            {brief.preferred_start_date && <Row label="Début souhaité" value={fmtDate(brief.preferred_start_date)} />}
            {brief.duration_days && <Row label="Durée" value={`${brief.duration_days} jours`} />}
            {brief.target_impressions && <Row label="Impressions visées" value={fmt(brief.target_impressions)} />}
            {brief.estimated_budget != null && <Row label="Budget estimé" value={`${fmt(brief.estimated_budget)} F`} />}
          </Card>
        )}
        {brief.special_instructions && (
          <Card>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Instructions</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{brief.special_instructions}</p>
          </Card>
        )}
      </div>

      {/* Actions */}
      {(canPublish || canDelete) && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
          {canDelete && (
            <button onClick={remove} disabled={busy !== null}
              className="flex-1 border border-red-200 text-red-600 font-semibold py-3 rounded-xl disabled:opacity-50">
              {busy === "delete" ? "…" : "Supprimer"}
            </button>
          )}
          {canPublish && (
            <button onClick={publish} disabled={busy !== null || brief.media.length === 0}
              className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
              {busy === "publish" ? "Envoi…" : "Publier à l'équipe"}
            </button>
          )}
        </div>
      )}
      {canPublish && brief.media.length === 0 && (
        <p className="px-4 mt-3 text-xs text-amber-600 text-center">Ajoutez au moins un visuel pour pouvoir publier ce brief.</p>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">{children}</div>;
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right break-all">{value}</span>
    </div>
  );
}
