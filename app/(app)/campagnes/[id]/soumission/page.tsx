"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Complaint {
  id: string;
  status: "pending" | "accepted" | "rejected";
  message: string;
  admin_note: string | null;
}
interface Task {
  id: string; name: string; is_onboarding: boolean;
  startdate: string; enddate: string;
}
interface Mission {
  id: string; status: string;
  expected_gain: number; gain: number; vues: number;
  files: string | null;
  submission_date: string | null;
  reason_title: string | null;
  reason_description: string | null;
  complaint: Complaint | null;
  task: Task | null;
}

const STATUS_LABEL: Record<string, string> = {
  SUBMITED:            "En cours de vérification",
  SUBMISSION_ACCEPTED: "Validée",
  SUBMISSION_REJECTED: "Rejetée",
};
const STATUS_COLOR: Record<string, string> = {
  SUBMITED:            "bg-blue-100 text-blue-700",
  SUBMISSION_ACCEPTED: "bg-green-100 text-green-700",
  SUBMISSION_REJECTED: "bg-red-100 text-red-700",
};
const COMPLAINT_LABEL: Record<string, string> = {
  pending:  "En attente",
  accepted: "Acceptée",
  rejected: "Rejetée",
};
const COMPLAINT_COLOR: Record<string, string> = {
  pending:  "bg-orange-50 border-orange-200 text-orange-700",
  accepted: "bg-green-50 border-green-200 text-green-700",
  rejected: "bg-gray-50 border-gray-200 text-gray-600",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SoumissionPage() {
  const router     = useRouter();
  const { id }     = useParams<{ id: string }>();

  const [mission, setMission]   = useState<Mission | null>(null);
  const [loading, setLoading]   = useState(true);
  const [showComplaint, setShowComplaint] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get<Mission>(`/missions/${id}`)
      .then(setMission)
      .catch(() => {}) // 401 géré globalement par wp:unauthorized dans le layout
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

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

  const task        = mission.task;
  const isAccepted  = mission.status === "SUBMISSION_ACCEPTED";
  const isRejected  = mission.status === "SUBMISSION_REJECTED";
  const isOnboarding = task?.is_onboarding ?? false;
  const canComplain = (isAccepted || isRejected) && !isOnboarding && !mission.complaint;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className={`px-5 pt-5 pb-14 ${isAccepted ? "bg-green-600" : isRejected ? "bg-red-500" : "bg-blue-500"}`}>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/80 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>

        <h1 className="text-white text-2xl font-bold">Ma soumission</h1>
        <p className="text-white/80 text-sm mt-0.5 truncate">{task?.name ?? "Campagne"}</p>

        <div className="flex gap-3 mt-4">
          <div className="flex-1 py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="text-white font-bold text-lg">{mission.vues > 0 ? mission.vues.toLocaleString("fr-FR") : "—"}</div>
            <div className="text-white/70 text-[10px] mt-0.5">Vues soumises</div>
          </div>
          <div className="flex-1 py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="text-white font-bold text-lg">{(mission.gain || mission.expected_gain).toLocaleString("fr-FR")} F</div>
            <div className="text-white/70 text-[10px] mt-0.5">{isAccepted ? "Gain crédité" : "Gain prévu"}</div>
          </div>
        </div>
      </div>

      <div className="mx-4 -mt-6 space-y-4 pb-10">

        {/* ── Statut ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Statut</p>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[mission.status] ?? "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABEL[mission.status] ?? mission.status}
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-2">Soumis le {fmtDate(mission.submission_date)}</p>

          {/* Motif de rejet */}
          {isRejected && (mission.reason_title || mission.reason_description) && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-3">
              {mission.reason_title && (
                <p className="text-red-700 text-xs font-semibold">{mission.reason_title}</p>
              )}
              {mission.reason_description && (
                <p className="text-red-600 text-xs mt-1 leading-relaxed">{mission.reason_description}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Capture d'écran ── */}
        {mission.files ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-4 pt-4 mb-3">Preuve fournie</p>
            <img
              src={mission.files}
              alt="Capture soumise"
              className="w-full object-contain max-h-80"
            />
            <div className="px-4 py-3">
              <a
                href={mission.files}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 rounded-xl text-gray-600 text-xs font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Voir en plein écran
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-gray-400 text-sm">Aucune capture disponible.</p>
          </div>
        )}

        {/* ── Réclamation existante ── */}
        {mission.complaint && (
          <div className={`rounded-2xl border px-4 py-4 ${COMPLAINT_COLOR[mission.complaint.status]}`}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H13l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              <p className="text-xs font-bold">Réclamation {COMPLAINT_LABEL[mission.complaint.status]}</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">{mission.complaint.message}</p>
            {mission.complaint.admin_note && (
              <div className="mt-2 pt-2 border-t border-current/20">
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60 mb-1">Réponse de l'équipe</p>
                <p className="text-xs leading-relaxed">{mission.complaint.admin_note}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Bouton réclamation ── */}
        {canComplain && (
          <button
            onClick={() => setShowComplaint(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-orange-400 text-orange-500 font-semibold text-sm rounded-2xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H13l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            Déposer une réclamation
          </button>
        )}

        {/* ── Lien vers la campagne ── */}
        <Link
          href={`/campagnes/${id}`}
          className="flex items-center justify-center gap-2 py-3 text-gray-500 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la campagne
        </Link>

      </div>

      {/* ── Modal réclamation ── */}
      {showComplaint && (
        <ComplaintModal
          assignmentId={id}
          onClose={() => setShowComplaint(false)}
          onSuccess={() => { setShowComplaint(false); load(); }}
        />
      )}

    </div>
  );
}

// ── ComplaintModal ─────────────────────────────────────────────────────────────
function ComplaintModal({ assignmentId, onClose, onSuccess }: {
  assignmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [message, setMessage]   = useState("");
  const [submitting, setSub]    = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.length < 20) { setError("Minimum 20 caractères."); return; }
    setSub(true);
    setError(null);
    try {
      await api.post(`/missions/${assignmentId}/complaint`, { message });
      setSuccess(true);
      setTimeout(onSuccess, 1800);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Une erreur est survenue.");
    } finally {
      setSub(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl px-5 pt-6 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H13l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </div>
          <div>
            <h2 className="text-gray-800 font-bold text-base">Déposer une réclamation</h2>
            <p className="text-gray-400 text-xs">L'équipe examinera votre demande et vous répondra.</p>
          </div>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-green-700 font-semibold text-sm">Réclamation envoyée avec succès.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-xs">{error}</p>
              </div>
            )}

            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1.5">
                Votre message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                minLength={20}
                maxLength={500}
                required
                placeholder="Expliquez pourquoi vous contestez cette décision… (20 caractères minimum)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              />
              <p className="text-gray-400 text-[10px] mt-1 text-right">{message.length}/500</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || message.length < 20}
                className="flex-1 py-3.5 rounded-2xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {submitting ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
