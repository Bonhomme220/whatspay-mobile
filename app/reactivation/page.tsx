"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const BASE = process.env.NEXT_PUBLIC_API_URL;

interface AccountStatus {
  disable_type: string | null;
  disable_until: string | null;
  disabled_at: string | null;
  disabled_reason: string | null;
  can_request: boolean;
  cant_request_reason: string | null;
  pending_request: {
    id: string;
    reason: string;
    status: string;
    created_at: string;
  } | null;
  history: Array<{
    id: string;
    status: string;
    reason: string;
    admin_comment: string | null;
    created_at: string;
    processed_at: string | null;
  }>;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:  { label: "En attente", cls: "bg-yellow-100 text-yellow-700" },
    APPROVED: { label: "Approuvée",  cls: "bg-green-100 text-green-700" },
    REJECTED: { label: "Refusée",    cls: "bg-red-100 text-red-700" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw data;
  return data as T;
}

function ReactivationContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [status, setStatus]         = useState<AccountStatus | null>(null);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState("");
  const [reason, setReason]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState("");
  const [error, setError]           = useState("");

  useEffect(() => {
    if (!email) {
      router.push("/login");
      return;
    }
    apiFetch<AccountStatus>(`/account/reactivation/status?email=${encodeURIComponent(email)}`)
      .then(setStatus)
      .catch(() => setLoadError("Impossible de charger les informations du compte."))
      .finally(() => setLoading(false));
  }, [email, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(
        "/account/reactivation/submit",
        { method: "POST", body: JSON.stringify({ email, reason }) }
      );
      if (res.success) {
        setSuccess(res.message);
        setReason("");
        const updated = await apiFetch<AccountStatus>(`/account/reactivation/status?email=${encodeURIComponent(email)}`);
        setStatus(updated);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message ?? "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  const isDefinitive = status?.disable_type === "définitive";
  const isTemporary  = status?.disable_type === "temporaire";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Image src="/logo.png" alt="WhatsPAY" width={120} height={36} className="object-contain h-8 w-auto" />
        <button onClick={() => router.push("/login")} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour
        </button>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-5">

        {loadError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{loadError}</p>
            <button onClick={() => router.push("/login")} className="text-sm text-green-600 font-medium mt-2">
              Retourner à la connexion
            </button>
          </div>
        )}

        {status && (
          <>
            {/* Bannière statut */}
            <div className={`rounded-xl p-4 border ${isDefinitive ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDefinitive ? "bg-red-100" : "bg-orange-100"}`}>
                  <svg className={`w-5 h-5 ${isDefinitive ? "text-red-500" : "text-orange-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <p className={`font-semibold text-sm ${isDefinitive ? "text-red-700" : "text-orange-700"}`}>
                    {isDefinitive ? "Compte désactivé définitivement" : isTemporary ? "Compte suspendu temporairement" : "Compte désactivé"}
                  </p>
                  {status.disabled_at && <p className="text-xs text-gray-500 mt-0.5">Depuis le {fmtDate(status.disabled_at)}</p>}
                  {isTemporary && status.disable_until && <p className="text-xs text-gray-500 mt-0.5">Jusqu'au {fmtDate(status.disable_until)}</p>}
                </div>
              </div>
              {status.disabled_reason && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Motif</p>
                  <p className="text-sm text-gray-700">{status.disabled_reason}</p>
                </div>
              )}
            </div>

            {/* Demande en attente */}
            {status.pending_request && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-yellow-700">Demande en cours d'examen</p>
                </div>
                <p className="text-xs text-gray-500">Soumise le {fmtDate(status.pending_request.created_at)}</p>
                <p className="text-sm text-gray-600 mt-2 line-clamp-3">{status.pending_request.reason}</p>
              </div>
            )}

            {/* Formulaire */}
            {status.can_request && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-base font-semibold text-gray-800 mb-1">Demander la réactivation</h2>
                <p className="text-sm text-gray-500 mb-4">Expliquez pourquoi vous souhaitez réactiver votre compte.</p>

                {success && (
                  <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                    <p className="text-green-700 text-sm">{success}</p>
                  </div>
                )}
                {error && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Votre message <span className="text-gray-400 font-normal">(20–1000 caractères)</span>
                    </label>
                    <textarea
                      required
                      minLength={20}
                      maxLength={1000}
                      rows={5}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Expliquez les raisons pour lesquelles vous souhaitez réactiver votre compte..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition resize-none"
                      style={{ backgroundColor: "rgba(43,94,94,0.05)" }}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{reason.length}/1000</p>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || reason.length < 20}
                    className="w-full text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-60 transition-opacity"
                    style={{ backgroundColor: "#1ba24b" }}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Envoi en cours…
                      </span>
                    ) : "Soumettre la demande"}
                  </button>
                </form>
              </div>
            )}

            {/* Message si pas autorisé */}
            {!status.can_request && !status.pending_request && status.cant_request_reason && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm text-gray-600">{status.cant_request_reason}</p>
              </div>
            )}

            {/* Historique */}
            {status.history.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Historique des demandes</h3>
                <div className="space-y-3">
                  {status.history.map((req) => (
                    <div key={req.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">{fmtDate(req.created_at)}</span>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{req.reason}</p>
                      {req.admin_comment && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-400 font-medium mb-0.5">Réponse de l'équipe</p>
                          <p className="text-sm text-gray-600">{req.admin_comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isDefinitive && (
              <p className="text-center text-xs text-gray-400 pb-4">
                Pour toute question : <a href="mailto:support@whatspay.africa" className="text-green-600">support@whatspay.africa</a>
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function ReactivationPage() {
  return (
    <Suspense>
      <ReactivationContent />
    </Suspense>
  );
}
