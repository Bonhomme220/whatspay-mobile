"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import KycStatusCard from "@/components/KycStatusCard";

// ── Types ──────────────────────────────────────────────────────────────────────
interface CurrentTier { label: string; flat_price: number; }
interface CountryCoverageItem { country_id: string; country: string; percentage: number; }
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
  current_month_recapture: { status: string; submitted_at: string; rejection_reason: string | null } | null;
  recapture_window_open: boolean;
  recapture_needed: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("fr-FR");
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
function initials(channelName: string) {
  return channelName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
}

const STATUS_LABEL: Record<Profile["status"], string> = { actif: "Actif", inactif: "Inactif", off: "Off" };
const STATUS_COLOR: Record<Profile["status"], string> = {
  actif: "bg-white/15 text-white border-white/25",
  inactif: "bg-yellow-400/20 text-yellow-200 border-yellow-400/30",
  off: "bg-red-400/20 text-red-200 border-red-400/30",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MediaPartnerProfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showDelete, setShowDelete]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get<Profile>("/media-partner/profile")
      .then(setProfile)
      .catch(() => {}) // 401 géré globalement par lib/api.ts
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-green-600 px-5 pt-5 pb-14">
        <h1 className="text-white text-2xl font-bold">Mon profil</h1>

        <div className="flex items-center gap-4 mt-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">{initials(profile.channel_name)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-lg leading-tight truncate">{profile.channel_name}</p>
            <p className="text-white/70 text-xs">Partenaire Média</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[profile.status]}`}>
                {STATUS_LABEL[profile.status]}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="text-white font-bold text-lg leading-tight">{fmt(profile.followers_count)}</div>
            <div className="text-green-100 text-[10px] mt-0.5">Abonnés</div>
          </div>
          <div className="py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="text-white font-bold text-lg leading-tight">{fmt(profile.reached_accounts_30d)}</div>
            <div className="text-green-100 text-[10px] mt-0.5">Comptes touchés (30j)</div>
          </div>
        </div>
      </div>

      <div className="mx-4 -mt-6 space-y-4 pb-10">

        {/* ── Vérification d'identité (KYC) ── */}
        <KycStatusCard />

        {/* ── Informations de la chaîne ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Informations de la chaîne</p>
          <InfoRow label="Nom de la chaîne" value={profile.channel_name} />
          <InfoRow label="Abonnés" value={fmt(profile.followers_count)} />
          <InfoRow label="Comptes touchés (30j)" value={fmt(profile.reached_accounts_30d)} />
          <InfoRow
            label="Palier actuel"
            value={profile.current_tier ? `${profile.current_tier.label} · ${fmt(profile.current_tier.flat_price)} F/mission` : "—"}
          />
          <InfoRow label="Dernière recapture" value={fmtDate(profile.last_recapture_at)} />
          {profile.country_coverage.length > 0 && (
            <div className="pt-1">
              <p className="text-gray-400 text-xs mb-1.5">Couverture géographique</p>
              <div className="flex flex-wrap gap-2">
                {profile.country_coverage.map((c) => (
                  <span key={c.country_id} className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">
                    {c.country} · {c.percentage}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sécurité ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Sécurité</p>
          <button
            onClick={() => setShowPassword(true)}
            className="w-full flex items-center gap-3 -mx-1 px-1 py-1 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
              <IcoLock />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-700 text-sm font-medium">Changer le mot de passe</p>
            </div>
            <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* ── Zone de danger ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Zone de danger</p>
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 text-red-500 text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Demander la suppression du compte
          </button>
        </div>

      </div>

      {/* ── Password sheet ── */}
      {showPassword && (
        <PasswordSheet onClose={() => setShowPassword(false)} />
      )}

      {/* ── Delete confirmation ── */}
      {showDelete && (
        <DeleteSheet
          onClose={() => setShowDelete(false)}
          onSuccess={() => setShowDelete(false)}
        />
      )}

    </div>
  );
}

// ── InfoRow ────────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="text-gray-700 text-xs font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

// ── PasswordSheet (copie de app/(app)/parametres/page.tsx) ────────────────────
function PasswordSheet({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ current_password: "", new_password: "", new_password_confirmation: "" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.new_password !== form.new_password_confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post("/profile/change-password", form);
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="mt-auto w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-6 pb-3 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-gray-800 font-bold text-base">Changer le mot de passe</h2>
            <button onClick={onClose} className="text-gray-400 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 pb-10 flex-1">
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center mt-2">
              <p className="text-green-700 font-semibold text-sm">Mot de passe modifié avec succès.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 mt-2">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}
              <PwField label="Mot de passe actuel" value={form.current_password} onChange={(v) => setForm({ ...form, current_password: v })} />
              <PwField label="Nouveau mot de passe" value={form.new_password} onChange={(v) => setForm({ ...form, new_password: v })} />
              <PwField label="Confirmer le nouveau mot de passe" value={form.new_password_confirmation} onChange={(v) => setForm({ ...form, new_password_confirmation: v })} />
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold">Annuler</button>
                <button
                  type="submit"
                  disabled={saving || !form.current_password || form.new_password.length < 8}
                  className="flex-1 py-3.5 rounded-2xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving ? "Modification…" : "Modifier"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function PwField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {show
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
            }
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── DeleteSheet (copie de app/(app)/profil/page.tsx) ──────────────────────────
function DeleteSheet({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason]   = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [done, setDone]       = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.length < 10) { setError("Minimum 10 caractères."); return; }
    setSending(true);
    setError(null);
    try {
      await api.post("/profile/delete-account", { reason });
      setDone(true);
      setTimeout(onSuccess, 1800);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Une erreur est survenue.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl px-5 pt-6 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-green-700 font-semibold text-sm">Demande envoyée. L&apos;équipe vous contactera.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h2 className="text-gray-800 font-bold text-base">Demande de suppression</h2>
                <p className="text-gray-400 text-xs">L&apos;équipe traitera votre demande et vous contactera.</p>
              </div>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1.5">
                  Motif <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  minLength={10}
                  maxLength={1000}
                  required
                  placeholder="Expliquez pourquoi vous souhaitez supprimer votre compte… (10 caractères minimum)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                />
                <p className="text-gray-400 text-[10px] mt-1 text-right">{reason.length}/1000</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold">Annuler</button>
                <button
                  type="submit"
                  disabled={sending || reason.length < 10}
                  className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {sending ? "Envoi…" : "Envoyer la demande"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function IcoLock() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>; }
