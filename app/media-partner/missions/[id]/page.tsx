"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Task {
  id: string; name: string; description: string;
  startdate: string; enddate: string;
  campaign_type: string; media_type: string;
  files: string | null; url: string | null; legend: string | null; client_name: string;
}
interface TrackingStats { unique_clicks: number; }
interface MissionDetail {
  id: string; status: string;
  expected_gain: number; gain: number; vues: number; post_link: string | null;
  click_bonus: number; click_bonus_clicks: number | null;
  assignment_date: string | null; response_date: string | null; submission_date: string | null;
  tracking_url: string | null; requires_screenshot: boolean;
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
const fmtMoney = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));

// Délai minimum entre l'acceptation de la mission et la soumission de la preuve,
// imposé par le backend (POST .../submit renvoie une erreur 422 avant ce délai).
const SUBMIT_WAIT_HOURS = 24;

function fmtCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m} min`;
  return `${h}h ${m.toString().padStart(2, "0")}min`;
}

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  ASSIGNED:            { label: "Disponible", cls: "bg-blue-100 text-blue-700" },
  PENDING:             { label: "En cours",   cls: "bg-blue-100 text-blue-700" },
  SUBMITED:            { label: "Soumise",    cls: "bg-orange-100 text-orange-700" },
  SUBMISSION_ACCEPTED: { label: "Validée",    cls: "bg-green-100 text-green-700" },
  SUBMISSION_REJECTED: { label: "Rejetée",    cls: "bg-red-100 text-red-700" },
  EXPIRED:             { label: "Expirée",    cls: "bg-red-100 text-red-700" },
};
const STEPS = ["Assignée", "En cours", "Soumise", "Validée"];
const STEP_STATUS: Record<string, number> = {
  ASSIGNED: 0, PENDING: 1, SUBMITED: 2,
  SUBMISSION_ACCEPTED: 3, SUBMISSION_REJECTED: 2, EXPIRED: 1,
};

const CAMPAIGN_TYPE_LABEL: Record<string, string> = {
  conversion: "🎯 Campagne conversion",
  notoriete:  "📢 Campagne notoriété",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MediaPartnerMissionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [mission, setMission] = useState<MissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Formulaire de soumission
  const [postLink, setPostLink] = useState("");
  const [vues, setVues] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<MissionDetail>(`/media-partner/missions/${id}`)
      .then(setMission)
      .catch(() => {}) // 401 géré globalement dans lib/api.ts
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Décompte avant que la soumission devienne possible (24h après acceptation).
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  async function handleAccept() {
    setAccepting(true);
    try {
      await api.post(`/media-partner/missions/${id}/accept`, {});
      load();
    } catch (err: any) {
      alert(err?.message ?? "Impossible d'accepter la mission. Elle a peut-être déjà été traitée.");
      load();
    } finally {
      setAccepting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mission) return;
    setError(null);
    setFieldErrors({});

    const errs: Record<string, string> = {};
    if (!postLink.trim()) errs.post_link = "Le lien de votre publication est requis.";
    else if (!/^https?:\/\/.+/i.test(postLink.trim())) errs.post_link = "Lien invalide (doit commencer par http:// ou https://).";
    if (mission.requires_screenshot) {
      if (!vues.trim() || isNaN(Number(vues)) || Number(vues) < 0) errs.vues = "Nombre de vues invalide.";
      if (!file) errs.files = "Capture d'écran requise.";
    }
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("post_link", postLink.trim());
      if (mission.requires_screenshot) {
        fd.append("vues", vues);
        if (file) fd.append("files", file);
      }
      const res = await api.postForm<{ message?: string }>(`/media-partner/missions/${id}/submit`, fd);
      setSuccessMsg(res?.message || "Preuve soumise. Votre mission est en attente de validation par notre équipe.");
      load();
    } catch (err: any) {
      const backendErrors: Record<string, string[]> | undefined = err?.errors;
      if (backendErrors) {
        const mapped: Record<string, string> = {};
        for (const key of Object.keys(backendErrors)) mapped[key] = backendErrors[key][0];
        setFieldErrors(mapped);
      }
      setError(err?.message ?? "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!mission) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">Mission introuvable.</p>
    </div>
  );

  const t = mission.task;
  const pill = STATUS_PILL[mission.status] ?? { label: mission.status, cls: "bg-gray-100 text-gray-600" };
  const stepIdx = STEP_STATUS[mission.status] ?? 0;
  const isAssigned = mission.status === "ASSIGNED";
  const isPending  = mission.status === "PENDING";
  const isRejected = mission.status === "SUBMISSION_REJECTED";
  const isReadOnly = ["SUBMITED", "SUBMISSION_ACCEPTED", "SUBMISSION_REJECTED", "EXPIRED"].includes(mission.status);

  // La soumission de preuve ne devient possible que 24h après l'acceptation.
  const acceptedAtMs     = mission.response_date ? new Date(mission.response_date).getTime() : null;
  const submitUnlockMs   = acceptedAtMs !== null ? acceptedAtMs + SUBMIT_WAIT_HOURS * 3_600_000 : null;
  const submitRemainingMs = submitUnlockMs !== null ? submitUnlockMs - now : 0;
  const canSubmit = submitUnlockMs === null || submitRemainingMs <= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <div className="bg-green-600 px-5 pt-4 pb-8">
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
        <p className="text-green-100 text-xs mt-0.5">{t?.client_name}</p>
        {t?.campaign_type && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full mt-2 bg-white/15 text-white border border-white/25">
            {CAMPAIGN_TYPE_LABEL[t.campaign_type] ?? t.campaign_type}
          </span>
        )}

        <div className="flex gap-3 mt-4">
          {[
            { label: "Début", value: fmtDate(t?.startdate ?? null) },
            { label: "Fin",   value: fmtDate(t?.enddate ?? null) },
            { label: "Gain",  value: `${fmtMoney(mission.expected_gain)} F` },
          ].map((s) => (
            <div key={s.label} className="flex-1 text-center py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
              <p className="text-white font-bold text-sm">{s.value}</p>
              <p className="text-green-100 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-4 pb-10">

        {/* ── Stepper ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4">Progression</p>
          <div className="flex items-start">
            {STEPS.map((step, i) => {
              const done = i < stepIdx;
              const current = i === stepIdx;
              const rejected = isRejected && i === 2;
              return (
                <div key={step} className="flex-1 flex flex-col items-center relative">
                  {i < STEPS.length - 1 && (
                    <div className={`absolute top-4 left-1/2 right-0 h-0.5 ${done ? "bg-green-500" : "bg-gray-200"}`} style={{ width: "100%", transform: "translateX(50%)" }} />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                    rejected ? "border-red-500 bg-red-500" :
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
                  <p className={`text-[9px] mt-1.5 font-medium text-center leading-tight ${done || current ? "text-gray-700" : "text-gray-400"}`}>{step}</p>
                </div>
              );
            })}
          </div>

          {isRejected && mission.reason_title && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <p className="text-red-700 text-xs font-semibold">{mission.reason_title}</p>
              {mission.reason_description && (
                <p className="text-red-600 text-xs mt-1 leading-relaxed">{mission.reason_description}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Stats de clics (campagnes conversion) ── */}
        {!isAssigned && mission.tracking_stats && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Statistiques de clics</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-center">
                <p className="font-bold text-base text-indigo-700">{mission.tracking_stats.unique_clicks}</p>
                <p className="text-gray-500 text-[9px] mt-0.5">Clics uniques</p>
              </div>
              {mission.click_bonus > 0 && (
                <div className="rounded-xl bg-green-50 p-2.5 text-center">
                  <p className="font-bold text-base text-green-700">+{fmtMoney(mission.click_bonus)} F</p>
                  <p className="text-gray-500 text-[9px] mt-0.5">Bonus clics{mission.click_bonus_clicks ? ` (${mission.click_bonus_clicks})` : ""}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Fiche campagne ── */}
        {t && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Informations de la campagne</p>
            <div className="space-y-2.5">
              {[
                { label: "Annonceur", value: t.client_name || "—" },
                { label: "Période",   value: `Du ${fmtDate(t.startdate)} au ${fmtDate(t.enddate)}` },
                { label: "Gain prévu", value: `${fmtMoney(mission.expected_gain)} F CFA` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-start gap-2 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-gray-500 text-xs">{row.label}</span>
                  <span className="text-gray-800 text-xs font-medium text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
              <p className="text-gray-700 text-sm font-semibold">Média disponible après acceptation</p>
              <p className="text-gray-400 text-xs mt-0.5">Le visuel et la légende à publier seront révélés une fois la mission acceptée.</p>
            </div>
          </div>
        )}

        {/* ── Légende à copier ── */}
        {!isAssigned && t?.legend && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Légende à publier</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-amber-900 text-sm leading-relaxed break-words whitespace-pre-wrap">{t.legend}</p>
            </div>
          </div>
        )}

        {/* ── Média à publier ── */}
        {!isAssigned && t?.files && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Média à publier sur votre chaîne</p>
            <div className="bg-gray-100 rounded-xl mb-3 overflow-hidden">
              {t.media_type === "video" ? (
                <video src={t.files} controls playsInline preload="metadata" className="w-full rounded-xl max-h-72 object-contain bg-black" />
              ) : t.media_type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.files} alt="Media" className="w-full h-48 object-cover rounded-xl" />
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-9 h-9 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium">Média de la campagne</span>
                </div>
              )}
            </div>
            <a
              href={t.files}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Ouvrir / télécharger le média
            </a>
          </div>
        )}

        {/* ── Bouton Accepter ── */}
        {isAssigned && (
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
        )}

        {/* ── Formulaire de soumission (statut PENDING) ── */}
        {isPending && !successMsg && (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Rappel obligation "collaboration commerciale" WhatsApp */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-amber-800 text-xs leading-relaxed">
                Rappel : WhatsApp exige que votre publication mentionne <strong>« Collaboration commerciale »</strong>. Assurez-vous que cette mention apparaît sur le post avant de soumettre le lien.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4">
              <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-2">
                Lien de votre publication <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={postLink}
                onChange={(e) => { setPostLink(e.target.value); setFieldErrors((f) => ({ ...f, post_link: "" })); }}
                placeholder="https://whatsapp.com/channel/.../123"
                required
                className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${fieldErrors.post_link ? "border-red-400" : "border-gray-200"}`}
              />
              {fieldErrors.post_link && <p className="text-red-500 text-xs mt-1">{fieldErrors.post_link}</p>}
              <p className="text-gray-400 text-[10px] mt-1.5">
                Collez le lien vers le post que vous avez publié sur votre chaîne WhatsApp.
              </p>
            </div>

            {mission.requires_screenshot && (
              <>
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-2">
                    Nombre de vues <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={vues}
                    onChange={(e) => { setVues(e.target.value); setFieldErrors((f) => ({ ...f, vues: "" })); }}
                    placeholder="Ex. 350"
                    required
                    className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${fieldErrors.vues ? "border-red-400" : "border-gray-200"}`}
                  />
                  {fieldErrors.vues && <p className="text-red-500 text-xs mt-1">{fieldErrors.vues}</p>}
                  <p className="text-gray-400 text-[10px] mt-1.5">Nombre de vues affiché sur votre publication au moment de la capture.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-2">
                    Capture d'écran <span className="text-red-500">*</span>
                  </label>
                  {preview && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-green-100 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Aperçu" className="w-full object-cover max-h-48" />
                      <button
                        type="button"
                        onClick={() => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="proof-file" />
                  <label
                    htmlFor="proof-file"
                    className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl text-sm cursor-pointer transition-colors ${
                      fieldErrors.files ? "border-red-400 text-red-500" : "border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {file ? file.name : "Sélectionner une capture"}
                  </label>
                  {fieldErrors.files && <p className="text-red-500 text-xs mt-1">{fieldErrors.files}</p>}
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-xs">{error}</p>
              </div>
            )}

            {canSubmit ? (
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-green-600 text-white font-semibold rounded-2xl text-sm shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {submitting ? "Envoi…" : "Soumettre ma preuve"}
              </button>
            ) : (
              <div>
                <div aria-disabled="true" className="block bg-green-600/40 text-white/80 text-center font-semibold py-4 rounded-2xl shadow-lg text-sm cursor-not-allowed select-none">
                  Soumettre ma preuve
                </div>
                <p className="text-center text-xs text-gray-500 mt-1.5">
                  Disponible dans {fmtCountdown(submitRemainingMs)} — WhatsPAY laisse le temps à votre post d&apos;être vu avant de soumettre.
                </p>
              </div>
            )}
          </form>
        )}

        {/* ── Confirmation de soumission ── */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 text-sm leading-relaxed">{successMsg}</p>
          </div>
        )}

        {/* ── Résumé en lecture seule (soumise / validée / rejetée / expirée) ── */}
        {isReadOnly && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              {mission.status === "SUBMITED" ? "Votre soumission — en attente de validation" : "Votre soumission"}
            </p>

            {mission.post_link && (
              <div className="flex justify-between items-start gap-2 border-b border-gray-50 pb-2.5">
                <span className="text-gray-500 text-xs flex-shrink-0">Lien publié</span>
                <a href={mission.post_link} target="_blank" rel="noopener noreferrer" className="text-green-700 text-xs font-medium text-right break-all underline">
                  {mission.post_link}
                </a>
              </div>
            )}

            {mission.requires_screenshot && (
              <div className="flex justify-between items-center gap-2 border-b border-gray-50 pb-2.5">
                <span className="text-gray-500 text-xs">Vues déclarées</span>
                <span className="text-gray-800 text-xs font-medium">{mission.vues}</span>
              </div>
            )}

            {mission.submission_date && (
              <div className="flex justify-between items-center gap-2 border-b border-gray-50 pb-2.5">
                <span className="text-gray-500 text-xs">Soumise le</span>
                <span className="text-gray-800 text-xs font-medium">{fmtDate(mission.submission_date, true)}</span>
              </div>
            )}

            {mission.status === "SUBMISSION_ACCEPTED" ? (
              <div className="flex justify-between items-center gap-2 pt-1">
                <span className="text-gray-700 text-sm font-semibold">Gain crédité</span>
                <span className="text-green-600 text-base font-bold">
                  +{fmtMoney((mission.gain || mission.expected_gain) + (mission.click_bonus || 0))} F
                </span>
              </div>
            ) : mission.status === "SUBMISSION_REJECTED" ? (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <p className="text-red-700 text-xs font-semibold">{mission.reason_title ?? "Soumission rejetée"}</p>
                {mission.reason_description && (
                  <p className="text-red-600 text-xs mt-1 leading-relaxed">{mission.reason_description}</p>
                )}
              </div>
            ) : mission.status === "EXPIRED" ? (
              <p className="text-gray-500 text-xs">Cette mission a expiré sans soumission dans les temps.</p>
            ) : (
              <p className="text-gray-500 text-xs">Votre dossier est en cours de vérification par notre équipe (généralement 2 à 7 jours ouvrés).</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
