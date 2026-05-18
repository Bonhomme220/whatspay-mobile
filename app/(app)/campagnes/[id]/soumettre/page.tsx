"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { api, tokenStore } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Task {
  id: string; name: string; is_onboarding: boolean;
  startdate: string; enddate: string;
  files: string | null;
}
interface Mission {
  id: string; status: string; expected_gain: number;
  vues: number | null; files: string | null;
  task: Task | null;
}

const RULES = [
  "Image claire et non floue",
  "Le contenu diffusé entièrement visible",
  "La photo de profil WhatsApp apparaît",
  "La date et l'heure du statut sont visibles",
  "La barre de statut du téléphone est visible (confirme l'heure système)",
  "Aucune retouche, filtre, zoom ni recadrage abusif",
  "Capture faite depuis votre propre smartphone (pas un émulateur)",
  "Capture récente — prise le jour de la soumission",
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SoumettreProuvePage() {
  const router     = useRouter();
  const { id }     = useParams<{ id: string }>();

  const [mission, setMission]   = useState<Mission | null>(null);
  const [loading, setLoading]   = useState(true);

  // Formulaire
  const [vues, setVues]         = useState("");
  const [file, setFile]         = useState<File | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const fileRef                 = useRef<HTMLInputElement>(null);

  // Modal règles
  const [showRules, setShowRules] = useState(false);
  const [agreed, setAgreed]       = useState(false);

  // Soumission
  const [submitting, setSub]    = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showOnboardingSuccess, setShowOnboardingSuccess] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get<Mission>(`/missions/${id}`)
      .then(setMission)
      .catch((e) => { if (e?.status === 401) router.push("/login"); })
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  const isResubmission = mission?.status === "SUBMITED";
  const isOnboarding   = mission?.task?.is_onboarding ?? false;

  function openRulesModal(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file && !isResubmission) {
      setError("Veuillez sélectionner une capture d'écran.");
      return;
    }
    if (!vues || isNaN(Number(vues)) || Number(vues) < 0) {
      setError("Veuillez saisir un nombre de vues valide.");
      return;
    }
    setAgreed(false);
    setShowRules(true);
  }

  async function confirmSubmit() {
    if (!agreed) return;
    setSub(true);
    setError(null);

    const form = new FormData();
    form.append("vues", vues);
    if (file) form.append("files", file);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/assignments/${id}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenStore.get() ?? ""}`,
            Accept: "application/json",
            // Pas de Content-Type : le navigateur gère le boundary multipart automatiquement
          },
          body: form,
        }
      );
      const data = await res.json();
      if (data.success) {
        if (isOnboarding) {
          setShowOnboardingSuccess(true);
          return;
        }
        router.push(`/campagnes/${id}?submitted=1`);
      } else {
        setError(data.message ?? "Une erreur est survenue.");
        setShowRules(false);
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
      setShowRules(false);
    } finally {
      setSub(false);
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

  const task = mission.task;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-green-600 px-5 pt-5 pb-14">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-green-100 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <h1 className="text-white text-2xl font-bold">
          {isResubmission ? "Modifier ma soumission" : "Soumettre ma preuve"}
        </h1>
        <p className="text-green-100 text-sm mt-0.5 truncate">{task?.name ?? "Campagne"}</p>

        {/* Stats */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="text-white font-bold text-lg">{mission.expected_gain} F</div>
            <div className="text-green-100 text-[10px] mt-0.5">Gain prévu</div>
          </div>
          {isOnboarding ? (
            <div className="flex-1 py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="text-yellow-300 font-bold text-lg">⭐</div>
              <div className="text-green-100 text-[10px] mt-0.5">Mission de bienvenue</div>
            </div>
          ) : (
            <div className="flex-1 py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="text-white font-bold text-lg truncate">
                {task?.enddate ? new Date(task.enddate).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : "—"}
              </div>
              <div className="text-green-100 text-[10px] mt-0.5">Date limite</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="mx-4 -mt-6 space-y-4 pb-10">

        {/* Avertissement resoumission */}
        {isResubmission && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-start gap-3">
            <svg className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-orange-700 text-xs font-semibold">Soumission en attente de validation</p>
              <p className="text-orange-600 text-xs mt-0.5">Vous pouvez modifier votre capture ou les vues tant que l'admin n'a pas traité votre dossier.</p>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={openRulesModal} className="space-y-4">

          {/* Nombre de vues */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-2">
              Nombre de vues <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={vues}
              onChange={(e) => setVues(e.target.value)}
              placeholder={isResubmission && mission.vues ? String(mission.vues) : "Ex. 350"}
              min={0}
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <p className="text-gray-400 text-[10px] mt-1.5">
              Indiquez le nombre de vues affiché sur votre statut WhatsApp au moment de la capture.
            </p>
          </div>

          {/* Capture d'écran */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-2">
              Capture d'écran {!isResubmission && <span className="text-red-500">*</span>}
            </label>

            {/* Capture existante (resoumission) */}
            {isResubmission && mission.files && !preview && (
              <div className="mb-3 rounded-xl overflow-hidden border border-gray-100">
                <img src={mission.files} alt="Capture actuelle" className="w-full object-cover max-h-48" />
                <p className="text-center text-gray-400 text-[10px] py-1.5 bg-gray-50">Capture actuelle — conservée si vous n'en téléversez pas une nouvelle</p>
              </div>
            )}

            {/* Preview nouvelle capture */}
            {preview && (
              <div className="mb-3 rounded-xl overflow-hidden border border-green-100 relative">
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

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="proof-file"
            />
            <label
              htmlFor="proof-file"
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 text-sm cursor-pointer hover:border-green-400 hover:text-green-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {file ? file.name : "Sélectionner une capture"}
            </label>
            {file && (
              <p className="text-gray-400 text-[10px] mt-1 text-center">{Math.round(file.size / 1024)} KB</p>
            )}
            <p className="text-gray-400 text-[10px] mt-1.5">
              Capture claire de votre statut WhatsApp avec le contenu et le compteur de vues visibles.
            </p>
          </div>

          {/* Info onboarding */}
          {isOnboarding ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⭐</span>
              <div>
                <p className="text-yellow-800 text-xs font-semibold">Mission de bienvenue</p>
                <p className="text-yellow-700 text-xs mt-0.5">Votre soumission sera validée automatiquement. C'est votre première mission pour découvrir WhatsPAY !</p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-start gap-3">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-700 text-xs">En soumettant, vous confirmez que les informations sont exactes. La soumission sera vérifiée avant paiement.</p>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          {/* CTA */}
          <button
            type="submit"
            className="w-full py-4 bg-green-600 text-white font-semibold rounded-2xl text-sm shadow-lg"
          >
            {isResubmission ? "Mettre à jour ma soumission" : "Soumettre ma preuve"}
          </button>

        </form>

        {/* Règles de capture */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Règles de la capture</p>
          <div className="space-y-2">
            {RULES.map((r) => (
              <div key={r} className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 text-xs leading-relaxed">{r}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-red-500 text-[10px] font-semibold">⚠ Toute capture non conforme entraîne un rejet immédiat.</p>
            <p className="text-red-600 text-[10px] font-bold">⛔ Toute falsification entraîne la désactivation définitive du compte.</p>
          </div>
        </div>

      </div>

      {/* ── Modal succès onboarding ── */}
      {showOnboardingSuccess && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full bg-white rounded-t-3xl overflow-hidden">
            <div className="bg-green-600 px-5 py-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center mb-3">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-bold">Bravo, mission complétée !</h3>
              <p className="text-green-100 text-sm mt-1">Tu as terminé ton onboarding WhatsPAY</p>
            </div>
            <div className="px-6 py-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-4 mb-5">
                <p className="text-yellow-800 text-sm font-bold mb-1">⭐ C'était ta mission de bienvenue</p>
                <p className="text-yellow-700 text-xs leading-relaxed">
                  Cette mission n'est pas rémunérée — c'était pour que tu découvres comment ça marche.
                  Les prochaines missions seront payantes !
                </p>
              </div>
              <div className="space-y-2 mb-6">
                {[
                  "Active les notifications pour ne rater aucune mission",
                  "Reste connecté — les missions arrivent automatiquement",
                  "Plus tu partages, plus tu gagnes",
                ].map((tip) => (
                  <div key={tip} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-600 text-xs">{tip}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-4 bg-green-600 text-white font-semibold rounded-2xl text-sm shadow-lg"
              >
                Compris, j'attends mes missions !
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal règles + confirmation ── */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full bg-white rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Header vert */}
            <div style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }} className="px-5 py-4 flex items-center gap-4 flex-shrink-0">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Règles de la capture d'écran</h3>
                <p className="text-green-100 text-xs mt-0.5">Lisez et confirmez avant de soumettre</p>
              </div>
            </div>

            {/* Corps scrollable */}
            <div className="overflow-y-auto px-5 py-4 flex-1">
              <div className="space-y-0 divide-y divide-gray-50">
                {RULES.map((r) => (
                  <div key={r} className="flex items-start gap-3 py-2.5">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-700 text-sm leading-relaxed">{r}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
                <p className="text-red-600 text-xs font-semibold">⚠ Toute capture non conforme entraîne un rejet immédiat.</p>
                <p className="text-red-700 text-xs font-bold">⛔ Toute falsification ou substitution d'image entraîne la désactivation immédiate et définitive du compte.</p>
              </div>

              {/* Checkbox accord */}
              <label className="flex items-start gap-3 mt-5 cursor-pointer">
                <div
                  onClick={() => setAgreed(!agreed)}
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    agreed ? "bg-green-600 border-green-600" : "border-gray-300"
                  }`}
                >
                  {agreed && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <p className="text-gray-700 text-sm font-semibold leading-snug">
                  J'ai lu et j'accepte ces règles. Ma capture est conforme.
                </p>
              </label>
            </div>

            {/* Footer */}
            <div className="px-5 pb-8 pt-3 flex gap-3 flex-shrink-0 border-t border-gray-50">
              <button
                onClick={() => setShowRules(false)}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={confirmSubmit}
                disabled={!agreed || submitting}
                className="flex-1 py-3.5 rounded-2xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {submitting ? "Envoi…" : isResubmission ? "Confirmer la mise à jour" : "Confirmer et soumettre"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
