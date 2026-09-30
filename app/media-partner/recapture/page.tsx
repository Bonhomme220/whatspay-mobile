"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Ref { id: string; name: string; }
interface CoverageRow { country_id: string; percentage: string; }
interface CountryCoverageItem { country_id: string; country: string; percentage: number; }
interface CurrentTier { label: string; flat_price: number; }
interface CurrentMonthRecapture {
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  rejection_reason: string | null;
}
interface Profile {
  channel_name: string;
  status: "actif" | "inactif" | "off";
  onboarding_status: string;
  followers_count: number;
  reached_accounts_30d: number;
  current_tier: CurrentTier | null;
  last_recapture_at: string | null;
  consecutive_missed_recaptures: number;
  country_coverage: CountryCoverageItem[];
  current_month_recapture: CurrentMonthRecapture | null;
  recapture_window_open: boolean;
  recapture_needed: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtMoney = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_LABEL: Record<Profile["status"], string> = {
  actif: "Actif", inactif: "Inactif", off: "Off",
};
const STATUS_COLOR: Record<Profile["status"], string> = {
  actif: "bg-green-100 text-green-700",
  inactif: "bg-orange-100 text-orange-600",
  off: "bg-red-100 text-red-600",
};

function StatusBadge({ status }: { status: Profile["status"] }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "actif" ? "bg-green-500" : status === "inactif" ? "bg-orange-500" : "bg-red-500"}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

// ── Champs (mêmes composants/styles que app/(auth)/register-media-partner/page.tsx) ──
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-500 text-xs mt-1">{msg}</p>;
}

function Input({ label, error, ...props }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-gray-700 text-sm font-medium mb-1.5">{label}</label>
      <input
        {...props}
        className={`w-full rounded-lg border px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition ${error ? "border-red-400" : "border-gray-200"}`}
        style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
      />
      <FieldError msg={error} />
    </div>
  );
}

function FileField({ label, file, error, onChange }: { label: string; file: File | null; error?: string; onChange: (f: File | null) => void }) {
  return (
    <div>
      <label className="block text-gray-700 text-sm font-medium mb-1.5">{label}</label>
      <label
        className={`flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed px-3 py-4 text-sm cursor-pointer transition ${
          error ? "border-red-400" : file ? "border-green-400" : "border-gray-300"
        }`}
        style={{ backgroundColor: "rgba(43,94,94,0.06)" }}
      >
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span className={file ? "text-green-700 font-medium truncate" : "text-gray-500"}>
          {file ? file.name : "Choisir une image"}
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
      <FieldError msg={error} />
    </div>
  );
}

const EMPTY_ROW: CoverageRow = { country_id: "", percentage: "" };

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MediaPartnerRecapturePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Ref[]>([]);

  const [followers, setFollowers] = useState("");
  const [reached, setReached] = useState("");
  const [coverage, setCoverage] = useState<CoverageRow[]>([EMPTY_ROW]);
  const [files, setFiles] = useState<{ screenshot_channel_page: File | null; screenshot_couverture: File | null; screenshot_followers: File | null }>({
    screenshot_channel_page: null, screenshot_couverture: null, screenshot_followers: null,
  });

  type FieldErrors = Partial<Record<string, string>>;
  const [fe, setFe] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<Profile>("/media-partner/profile"),
      api.get<Ref[]>("/countries"),
    ])
      .then(([p, c]) => {
        setProfile(p);
        setCountries(c);
        setFollowers(String(p.followers_count ?? ""));
        setReached(String(p.reached_accounts_30d ?? ""));
        if (p.country_coverage?.length) {
          setCoverage(p.country_coverage.map((row) => ({ country_id: row.country_id, percentage: String(row.percentage) })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function addCoverageRow() {
    setCoverage((rows) => [...rows, { ...EMPTY_ROW }]);
  }
  function removeCoverageRow(idx: number) {
    setCoverage((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows));
  }
  function updateCoverageRow(idx: number, field: keyof CoverageRow, value: string) {
    setCoverage((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
    setFe((f) => ({ ...f, country_coverage: "" }));
  }

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!followers || Number(followers) < 0) errs.followers = "Nombre d'abonnés requis.";
    if (!reached || Number(reached) < 0) errs.reached_accounts_30d = "Ce champ est requis.";
    const invalidCoverage = coverage.some((r) => {
      if (!r.country_id) return true;
      const pct = Number(r.percentage);
      return r.percentage === "" || Number.isNaN(pct) || pct < 0 || pct > 100;
    });
    if (coverage.length < 1 || invalidCoverage) errs.country_coverage = "Renseignez un pays et un pourcentage (0-100) pour chaque ligne.";
    if (!files.screenshot_channel_page) errs.screenshot_channel_page = "Capture requise.";
    if (!files.screenshot_couverture) errs.screenshot_couverture = "Capture requise.";
    if (!files.screenshot_followers) errs.screenshot_followers = "Capture requise.";
    return errs;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFe(errs); return; }
    setFe({});
    setError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("followers", followers);
      fd.append("reached_accounts_30d", reached);
      coverage.forEach((row, i) => {
        fd.append(`country_coverage[${i}][country_id]`, row.country_id);
        fd.append(`country_coverage[${i}][percentage]`, row.percentage);
      });
      if (files.screenshot_channel_page) fd.append("screenshot_channel_page", files.screenshot_channel_page);
      if (files.screenshot_couverture) fd.append("screenshot_couverture", files.screenshot_couverture);
      if (files.screenshot_followers) fd.append("screenshot_followers", files.screenshot_followers);

      const res = await api.postForm<{ message?: string }>("/media-partner/recapture", fd);
      setSuccessMsg(res?.message || "Recapture soumise. Elle sera examinée par notre équipe.");
    } catch (err: any) {
      const backendErrors: Record<string, string[]> | undefined = err?.errors;
      if (backendErrors) {
        const mapped: FieldErrors = {};
        for (const key of Object.keys(backendErrors)) {
          const rootKey = key.split(".")[0] === "country_coverage" ? "country_coverage" : key.split(".")[0];
          mapped[rootKey] = backendErrors[key][0];
        }
        setFe(mapped);
      }
      setError(err?.message ?? "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-4 py-10 text-center text-gray-500 text-sm">
        Impossible de charger votre profil pour le moment.
      </div>
    );
  }

  const cmr = profile.current_month_recapture;
  const showReadOnly = cmr?.status === "pending" || cmr?.status === "approved";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header (calqué sur missions/page.tsx) */}
      <div className="bg-green-600 px-5 pt-5 pb-6">
        <h1 className="text-white text-2xl font-bold">Mes chiffres</h1>
        <p className="text-green-100 text-sm mt-0.5">Recapture mensuelle de {profile.channel_name}</p>

        <div className="mt-4 rounded-2xl px-4 py-3.5 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.15)" }}>
          <div>
            <p className="text-green-100 text-[10px] uppercase tracking-wider font-semibold">Statut du compte</p>
            <div className="mt-1"><StatusBadge status={profile.status} /></div>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-[10px] uppercase tracking-wider font-semibold">Dernière recapture</p>
            <p className="text-white text-sm font-semibold mt-1">{fmtDate(profile.last_recapture_at)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-8 max-w-md mx-auto">
        {(profile.status === "inactif" || profile.status === "off") && (
          <div className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 mb-4">
            <svg className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-orange-700 text-xs leading-relaxed">
              Votre compte est actuellement <strong>{STATUS_LABEL[profile.status].toLowerCase()}</strong> faute de recapture
              {profile.consecutive_missed_recaptures > 0 ? ` (${profile.consecutive_missed_recaptures} mois manqué${profile.consecutive_missed_recaptures > 1 ? "s" : ""})` : ""}.
              Soumettez vos chiffres ci-dessous : votre compte sera réactivé automatiquement dès validation.
            </p>
          </div>
        )}

        {successMsg ? (
          <SuccessCard message={successMsg} />
        ) : showReadOnly && cmr ? (
          <ReadOnlyCard cmr={cmr} profile={profile} />
        ) : (
          <>
            {cmr?.status === "rejected" && cmr.rejection_reason && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-4">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <p className="text-red-700 text-xs font-semibold">Recapture rejetée</p>
                  <p className="text-red-600 text-xs leading-relaxed mt-0.5">{cmr.rejection_reason}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-4">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-700 text-xs">
                {profile.recapture_window_open
                  ? "La fenêtre de recapture est ouverte (du 5 au 10 du mois)."
                  : "La fenêtre officielle est ouverte du 5 au 10 du mois, mais vous pouvez déjà mettre à jour vos chiffres par anticipation."}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={submit} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 space-y-4">
              <Input
                label="Nombre d'abonnés"
                type="number" min={0}
                value={followers}
                onChange={(e) => { setFollowers(e.target.value); setFe((f) => ({ ...f, followers: "" })); }}
                placeholder="Ex : 5000"
                error={fe.followers}
              />
              <Input
                label="Comptes touchés sur les 30 derniers jours (onglet Couverture)"
                type="number" min={0}
                value={reached}
                onChange={(e) => { setReached(e.target.value); setFe((f) => ({ ...f, reached_accounts_30d: "" })); }}
                placeholder="Ex : 1500"
                error={fe.reached_accounts_30d}
              />

              <div>
                <p className="text-gray-500 text-xs mb-1">
                  Indiquez les pays où se trouve votre audience et leur poids approximatif (en %).
                </p>
                <div className="space-y-3">
                  {coverage.map((row, i) => (
                    <div key={i} className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-gray-700 text-sm font-medium mb-1.5">{i === 0 ? "Pays" : ""}</label>
                        <select
                          value={row.country_id}
                          onChange={(e) => updateCoverageRow(i, "country_id", e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-700 focus:outline-none focus:border-green-500 transition"
                          style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
                        >
                          <option value="">Pays</option>
                          {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-gray-700 text-sm font-medium mb-1.5">{i === 0 ? "%" : ""}</label>
                        <input
                          type="number" min={0} max={100}
                          value={row.percentage}
                          onChange={(e) => updateCoverageRow(i, "percentage", e.target.value)}
                          placeholder="%"
                          className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
                          style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCoverageRow(i)}
                        disabled={coverage.length <= 1}
                        className="mb-0.5 w-9 h-11 flex-shrink-0 rounded-lg border border-gray-200 text-gray-400 disabled:opacity-40"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <FieldError msg={fe.country_coverage} />
                <button
                  type="button"
                  onClick={addCoverageRow}
                  className="text-sm font-medium mt-1"
                  style={{ color: "#1ba24b" }}
                >
                  + Ajouter un pays
                </button>
              </div>

              <FileField
                label="Capture de la page de votre chaîne"
                file={files.screenshot_channel_page}
                error={fe.screenshot_channel_page}
                onChange={(f) => { setFiles((s) => ({ ...s, screenshot_channel_page: f })); setFe((fe0) => ({ ...fe0, screenshot_channel_page: "" })); }}
              />
              <FileField
                label="Capture de l'onglet Couverture"
                file={files.screenshot_couverture}
                error={fe.screenshot_couverture}
                onChange={(f) => { setFiles((s) => ({ ...s, screenshot_couverture: f })); setFe((fe0) => ({ ...fe0, screenshot_couverture: "" })); }}
              />
              <FileField
                label="Capture de l'onglet Followers"
                file={files.screenshot_followers}
                error={fe.screenshot_followers}
                onChange={(f) => { setFiles((s) => ({ ...s, screenshot_followers: f })); setFe((fe0) => ({ ...fe0, screenshot_followers: "" })); }}
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-60"
                style={{ backgroundColor: "#1ba24b" }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Envoi…
                  </span>
                ) : "Soumettre ma recapture"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── États en lecture seule ─────────────────────────────────────────────────────
function ReadOnlyCard({ cmr, profile }: { cmr: CurrentMonthRecapture; profile: Profile }) {
  const isApproved = cmr.status === "approved";
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 text-center">
      <div className="flex justify-center mb-3">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isApproved ? "bg-green-100" : "bg-orange-100"}`}>
          {isApproved ? (
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      </div>
      <h3 className="text-gray-800 text-base font-semibold mb-1">
        {isApproved ? "Déjà validée ce mois-ci" : "En attente de validation"}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-4">
        {isApproved
          ? "Votre recapture a été validée par notre équipe. Vos chiffres sont à jour."
          : `Soumise le ${fmtDate(cmr.submitted_at)}. Notre équipe va l'examiner sous peu.`}
      </p>
      <div className="grid grid-cols-2 gap-3 text-left">
        <div className="rounded-xl bg-gray-50 px-3 py-2.5">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">Abonnés</p>
          <p className="text-gray-800 font-bold text-sm mt-0.5">{fmtMoney(profile.followers_count)}</p>
        </div>
        <div className="rounded-xl bg-gray-50 px-3 py-2.5">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">Comptes touchés (30j)</p>
          <p className="text-gray-800 font-bold text-sm mt-0.5">{fmtMoney(profile.reached_accounts_30d)}</p>
        </div>
        {isApproved && profile.current_tier && (
          <div className="rounded-xl bg-gray-50 px-3 py-2.5 col-span-2">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">Palier actuel</p>
            <p className="text-gray-800 font-bold text-sm mt-0.5">
              {profile.current_tier.label} — {fmtMoney(profile.current_tier.flat_price)} F / mission
            </p>
          </div>
        )}
      </div>
      <Link
        href="/media-partner/missions"
        className="inline-block mt-5 text-sm font-medium"
        style={{ color: "#1ba24b" }}
      >
        Retour aux missions
      </Link>
    </div>
  );
}

function SuccessCard({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <h3 className="text-gray-800 text-lg font-semibold mb-2">Recapture envoyée</h3>
      <p className="text-gray-600 text-sm leading-relaxed mb-6">{message}</p>
      <Link
        href="/media-partner/missions"
        className="block w-full text-white font-semibold py-3 rounded-lg text-sm text-center"
        style={{ backgroundColor: "#1ba24b" }}
      >
        Retour aux missions
      </Link>
    </div>
  );
}
