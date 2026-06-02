"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Task {
  id: string; name: string; description: string;
  startdate: string; enddate: string; type: string; campaign_type: string;
  files: string | null; legend: string | null; url: string | null;
  client_name: string; categories: { id: string; name: string }[];
  media_type: string | null; is_onboarding: boolean;
}
interface TrackingStats {
  total_clicks: number; unique_clicks: number;
  conversions: number; conversion_rate: number;
}
interface Mission {
  id: string; status: string; expected_gain: number; gain: number;
  assignment_date: string; response_date: string | null;
  submission_date: string | null; tracking_url: string | null;
  reason_title: string | null; reason_description: string | null;
  tracking_stats: TrackingStats | null;
  task: Task | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d: string | null, withTime = false) {
  if (!d) return "—";
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };
  if (withTime) { opts.hour = "2-digit"; opts.minute = "2-digit"; }
  return new Date(d).toLocaleDateString("fr-FR", opts);
}

const STEPS = ["Assignée", "En cours", "Soumise", "Validée"];
const STEP_STATUS: Record<string, number> = {
  ASSIGNED: 0, PENDING: 1, SUBMITED: 2,
  SUBMISSION_ACCEPTED: 3, SUBMISSION_REJECTED: 2, EXPIRED: 1,
};
const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  ASSIGNED:            { label: "Disponible", cls: "bg-blue-100 text-blue-700" },
  PENDING:             { label: "En cours",   cls: "bg-blue-100 text-blue-700" },
  SUBMITED:            { label: "Soumise",    cls: "bg-orange-100 text-orange-700" },
  SUBMISSION_ACCEPTED: { label: "Validée",    cls: "bg-green-100 text-green-700" },
  SUBMISSION_REJECTED: { label: "Rejetée",    cls: "bg-red-100 text-red-700" },
  EXPIRED:             { label: "Expirée",    cls: "bg-red-100 text-red-700" },
};
const STEP_MSG: Record<string, string> = {
  SUBMISSION_ACCEPTED: "Mission validée. Votre gain a été crédité sur votre compte.",
  SUBMITED:            "Vos résultats sont en cours de vérification par l'équipe. Ce processus prend généralement entre 2 et 7 jours ouvrés.",
  PENDING:             "Soumettez votre preuve avant la date limite pour être payé.",
  ASSIGNED:            "Acceptez cette mission pour commencer.",
  SUBMISSION_REJECTED: "Votre soumission a été rejetée.",
  EXPIRED:             "Cette mission a expiré sans soumission.",
};
const STEP_MSG_COLOR: Record<string, string> = {
  SUBMISSION_ACCEPTED: "bg-green-50 border-green-200 text-green-800",
  SUBMITED:            "bg-blue-50 border-blue-200 text-blue-800",
  PENDING:             "bg-yellow-50 border-yellow-200 text-yellow-800",
  ASSIGNED:            "bg-blue-50 border-blue-200 text-blue-800",
  SUBMISSION_REJECTED: "bg-red-50 border-red-200 text-red-800",
  EXPIRED:             "bg-red-50 border-red-200 text-red-800",
};

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MissionDetailPage() {
  const router  = useRouter();
  const { id }  = useParams<{ id: string }>();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]             = useState(false);
  const [legendCopied, setLegendCopied] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(() => {
    api.get<Mission>(`/missions/${id}`)
      .then(setMission)
      .catch((e) => { if (e?.status === 401) router.push("/login"); })
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  async function handleAccept() {
    setAccepting(true);
    try {
      await api.post(`/missions/${id}/accept`, {});
    } catch {
      alert("Impossible d'accepter la mission. Elle a peut-être déjà expiré. Veuillez rafraîchir.");
    } finally {
      load();
      setAccepting(false);
    }
  }

  async function handleDownload(url: string, filename: string) {
    setDownloading(true);
    try {
      const res  = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: blob.type });

      // iOS Safari : Share API avec fichier → "Enregistrer l'image"
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return;
      }

      // Android / autres : téléchargement direct via blob URL
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch {
      // Fallback : ouvre dans un nouvel onglet
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  function copyLink() {
    const legend = mission?.task?.legend ?? "";
    const url    = mission?.tracking_url ?? mission?.task?.url ?? "";
    const text   = [legend, url].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!mission) return null;

  const t       = mission.task;
  const pill    = STATUS_PILL[mission.status] ?? { label: mission.status, cls: "bg-gray-100 text-gray-600" };
  const stepIdx = STEP_STATUS[mission.status] ?? 0;
  const isAssigned   = mission.status === "ASSIGNED";
  const isPending    = mission.status === "PENDING";
  const isSubmited   = mission.status === "SUBMITED";
  const isDone       = mission.status === "SUBMISSION_ACCEPTED";
  const isRejected   = mission.status === "SUBMISSION_REJECTED";
  const isOnboarding = t?.is_onboarding ?? false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero header ── */}
      <div className="bg-green-600 px-5 pt-4 pb-8">
        {/* Nav row */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-white text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${pill.cls}`}>{pill.label}</span>
        </div>

        <h1 className="text-white text-xl font-bold leading-tight">{t?.name ?? "—"}</h1>
        <p className="text-green-100 text-xs mt-0.5">Détails de la mission</p>

        {/* Quick stats */}
        <div className="flex gap-3 mt-4">
          {[
            { label: "Début", value: fmtDate(t?.startdate ?? null) },
            { label: "Fin",   value: fmtDate(t?.enddate ?? null) },
            { label: "Gain",  value: `${mission.expected_gain} F` },
          ].map((s) => (
            <div key={s.label} className="flex-1 text-center py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
              <p className="text-white font-bold text-sm">{s.value}</p>
              <p className="text-green-100 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={`px-4 -mt-2 space-y-4 ${isAssigned || isPending || isSubmited ? 'pb-28' : 'pb-8'}`}>

        {/* ── Stepper ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4">Progression</p>
          <div className="flex items-start">
            {STEPS.map((step, i) => {
              const done    = i < stepIdx;
              const current = i === stepIdx;
              const rejected = isRejected && i === 2;
              return (
                <div key={step} className="flex-1 flex flex-col items-center relative">
                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div className={`absolute top-4 left-1/2 right-0 h-0.5 ${done || (current && i < stepIdx) ? "bg-green-500" : "bg-gray-200"}`} style={{ width: "100%", transform: "translateX(50%)" }} />
                  )}
                  {/* Circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                    rejected && i === 2 ? "border-red-500 bg-red-500" :
                    done    ? "border-green-500 bg-green-500" :
                    current ? "border-orange-500 bg-orange-500" :
                              "border-gray-200 bg-white"
                  }`}>
                    {done ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : current ? (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    ) : (
                      <div className="w-2.5 h-2.5 bg-gray-200 rounded-full" />
                    )}
                  </div>
                  <p className={`text-[9px] mt-1.5 font-medium text-center leading-tight ${
                    done || current ? "text-gray-700" : "text-gray-400"
                  }`}>{step}</p>
                </div>
              );
            })}
          </div>

          {/* Status message */}
          <div className={`mt-4 rounded-xl px-3 py-2.5 border flex items-start gap-2 ${STEP_MSG_COLOR[mission.status] ?? "bg-gray-50 border-gray-100 text-gray-700"}`}>
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs leading-relaxed">{STEP_MSG[mission.status]}</p>
          </div>

          {/* Rejection reason */}
          {isRejected && mission.reason_title && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <p className="text-red-700 text-xs font-semibold">{mission.reason_title}</p>
              {mission.reason_description && (
                <p className="text-red-600 text-xs mt-1 leading-relaxed">{mission.reason_description}</p>
              )}
            </div>
          )}

          {/* Lien voir soumission */}
          {(isSubmited || isDone || isRejected) && (
            <Link
              href={`/campagnes/${mission.id}/soumission`}
              className="flex items-center justify-between mt-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5"
            >
              <span className="text-gray-600 text-xs font-semibold">Voir ma soumission</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {/* ── Bannière onboarding ── */}
        {isOnboarding && isAssigned && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-4 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⭐</span>
            <div>
              <p className="text-yellow-800 text-sm font-bold mb-1">Mission de bienvenue — lis bien avant d'accepter</p>
              <ol className="space-y-1">
                {["Accepte la mission ci-dessous", "Télécharge l'image et copie la légende fournie", "Poste sur ton statut WhatsApp", "Reviens dans 24h pour soumettre avec le nombre de vues"].map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-yellow-700 text-xs">
                    <span className="w-4 h-4 rounded-full bg-yellow-300 text-yellow-900 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {isOnboarding && isPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-4 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📱</span>
            <div>
              <p className="text-yellow-800 text-sm font-bold mb-1">C'est parti ! Voici ce que tu dois faire</p>
              <ol className="space-y-1">
                {["Ouvre WhatsApp", "Poste l'image avec la légende sur ton statut", "Attends que tes contacts voient le statut", "Reviens ici dans 24h et soumet le screenshot avec le nombre de vues"].map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-yellow-700 text-xs">
                    <span className="w-4 h-4 rounded-full bg-yellow-300 text-yellow-900 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* ── Stats conversion (campagnes conversion uniquement, après acceptation) ── */}
        {t?.campaign_type === "conversion" && !isAssigned && mission.tracking_stats && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Vos statistiques de conversion
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Clics totaux",  value: mission.tracking_stats.total_clicks,    color: "text-blue-700",  bg: "bg-blue-50" },
                { label: "Clics uniques", value: mission.tracking_stats.unique_clicks,   color: "text-indigo-700", bg: "bg-indigo-50" },
                { label: "Conversions",   value: mission.tracking_stats.conversions,     color: "text-green-700", bg: "bg-green-50" },
                { label: "Taux",          value: `${mission.tracking_stats.conversion_rate}%`, color: "text-orange-700", bg: "bg-orange-50" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl ${s.bg} p-2.5 text-center`}>
                  <p className={`font-bold text-base ${s.color}`}>{s.value}</p>
                  <p className="text-gray-500 text-[9px] mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Fiche campagne ── */}
        {t && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Informations de la campagne
            </p>
            <div className="space-y-2.5">
              {[
                { label: "Nom de la campagne", value: t.name },
                { label: "Annonceur",          value: t.client_name || "—" },
                { label: "Type de média",      value: t.type ?? "—" },
                { label: "Date d'assignation", value: fmtDate(mission.assignment_date, true) },
                { label: "Période",            value: `Du ${fmtDate(t.startdate)} au ${fmtDate(t.enddate)}` },
                { label: "Gain prévu",         value: `${mission.expected_gain} F CFA` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-start gap-2 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-gray-500 text-xs">{row.label}</span>
                  <span className="text-gray-800 text-xs font-medium text-right">{row.value}</span>
                </div>
              ))}
              {t.categories[0] && (
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-gray-500 text-xs">Catégorie</span>
                  <span className="bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {t.categories[0].name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Description ── */}
        {t?.description && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Description</p>
            <p className="text-gray-700 text-sm leading-relaxed">{t.description}</p>
          </div>
        )}

        {/* ── Contenu verrouillé (avant acceptation) ── */}
        {isAssigned && (
          <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-700 text-sm font-semibold">Contenu disponible après acceptation</p>
              <p className="text-gray-400 text-xs mt-0.5">Le média et la légende à diffuser seront révélés une fois la mission acceptée.</p>
            </div>
          </div>
        )}

        {/* ── Instructions (légende + lien optionnel) ── */}
        {!isAssigned && (t?.legend || mission.tracking_url || t?.url) && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Instructions</p>

            {/* Légende — toujours affichée si présente, avec ou sans lien */}
            {t?.legend && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-3">
                <p className="text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-1">Légende à copier dans votre statut</p>
                <p className="text-amber-900 text-sm leading-relaxed break-words">{t.legend}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(t.legend!).then(() => {
                      setLegendCopied(true);
                      setTimeout(() => setLegendCopied(false), 2000);
                    }).catch(() => {});
                  }}
                  className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-amber-700"
                >
                  {legendCopied ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copié ✓
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copier la légende
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Lien de partage — uniquement si présent */}
            {(mission.tracking_url || t?.url) && (
              <>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                  <p className="flex-1 text-green-700 text-xs truncate font-mono">
                    {mission.tracking_url ?? t?.url}
                  </p>
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1.5 text-xs font-semibold text-green-700 whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copié ✓
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copier
                      </>
                    )}
                  </button>
                </div>
                <p className="text-gray-400 text-[10px] mt-2">Copiez ce lien et insérez-le directement dans votre statut WhatsApp.</p>
              </>
            )}
          </div>
        )}

        {/* ── Média à diffuser ── */}
        {!isAssigned && t?.files && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
              Média à diffuser
            </p>
            <div className="bg-gray-100 rounded-xl mb-3 overflow-hidden">
              {t.media_type === "video" || t.files.match(/\.(mp4|mov|webm|avi|mkv)(\?|$)/i) ? (
                <video
                  src={t.files}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full rounded-xl max-h-72 object-contain bg-black"
                />
              ) : t.media_type === "image" || t.files.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.files} alt="Media" className="w-full h-48 object-cover rounded-xl" />
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                  <span className="text-sm font-medium">Média de la campagne</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <a
                href={t.files}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Aperçu
              </a>
              <button
                type="button"
                disabled={downloading}
                onClick={() => {
                  const ext = t.files!.split("?")[0].split(".").pop() ?? "jpg";
                  const name = `${(t.name ?? "media").replace(/\s+/g, "_")}.${ext}`;
                  handleDownload(t.files!, name);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 text-white text-xs font-semibold disabled:opacity-60"
              >
                {downloading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                {downloading ? "Chargement…" : "Télécharger"}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── CTA fixe bas de page ── */}
      {isDone ? (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-2">
          <div className="bg-green-600 rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white font-semibold text-sm">
              Gain de {mission.gain || mission.expected_gain} F CFA crédité
            </span>
          </div>
        </div>
      ) : isAssigned ? (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-2">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-green-600 text-white text-center font-semibold py-4 rounded-2xl shadow-lg text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {accepting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Accepter la mission
          </button>
        </div>
      ) : isPending ? (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-2">
          <Link
            href={`/campagnes/${mission.id}/soumettre`}
            className="block bg-green-600 text-white text-center font-semibold py-4 rounded-2xl shadow-lg text-sm"
          >
            Soumettre ma preuve
          </Link>
        </div>
      ) : isSubmited ? (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-2">
          <Link
            href={`/campagnes/${mission.id}/soumettre`}
            className="block bg-orange-500 text-white text-center font-semibold py-4 rounded-2xl shadow-lg text-sm"
          >
            Modifier ma soumission
          </Link>
        </div>
      ) : null}
    </div>
  );
}
