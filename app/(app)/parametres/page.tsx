"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, auth } from "@/lib/api";

export default function ParametresPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showLogout, setShowLogout]     = useState(false);

  async function handleLogout() {
    await auth.logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-green-600 px-5 pt-5 pb-14">
        <h1 className="text-white text-2xl font-bold">Paramètres</h1>
        <p className="text-white/70 text-sm mt-0.5">Préférences & sécurité</p>
      </div>

      <div className="mx-4 -mt-6 pb-10 space-y-4">

        {/* Compte */}
        <Section title="Mon compte">
          <SettingLink href="/profil" label="Mon profil" icon={<IcoUser />} description="Modifier mes informations personnelles" />
          <SettingBtn label="Changer le mot de passe" icon={<IcoLock />} onClick={() => setShowPassword(true)} />
        </Section>

        {/* Support */}
        <Section title="Support">
          <SettingLink href="/tickets" label="Mes tickets" icon={<IcoTicket />} description="Contacter le support WhatsPAY" />
          <SettingLink href="/faq" label="FAQ" icon={<IcoHelp />} description="Questions fréquentes" />
          <SettingLink href="/reclamations" label="Mes réclamations" icon={<IcoFlag />} description="Suivre mes réclamations de soumission" />
        </Section>

        {/* Programme */}
        <Section title="Programme">
          <SettingLink href="/ambassadeur" label="Programme ambassadeur" icon={<IcoShare />} description="Parrainez et augmentez vos gains" />
        </Section>

        {/* À propos */}
        <Section title="À propos">
          <div className="flex items-center justify-between py-3 px-4">
            <span className="text-gray-600 text-sm">Version de l'application</span>
            <span className="text-gray-400 text-xs">v2.1.0</span>
          </div>
          <div className="border-t border-gray-50" />
          <div className="flex items-center justify-between py-3 px-4">
            <span className="text-gray-600 text-sm">© 2026 WhatsPAY</span>
            <span className="text-gray-400 text-xs">Tous droits réservés</span>
          </div>
        </Section>

        {/* Déconnexion */}
        <button
          onClick={() => setShowLogout(true)}
          className="w-full bg-white rounded-2xl shadow-sm px-4 py-4 flex items-center gap-3 text-red-500"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-sm font-semibold">Se déconnecter</span>
        </button>

      </div>

      {/* ── Password sheet ── */}
      {showPassword && (
        <PasswordSheet onClose={() => setShowPassword(false)} />
      )}

      {/* ── Logout confirmation ── */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.55)" }} onClick={() => setShowLogout(false)}>
          <div className="w-full bg-white rounded-t-3xl px-5 pt-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h2 className="text-gray-800 font-bold text-base mb-1">Déconnexion</h2>
            <p className="text-gray-400 text-sm mb-6">Voulez-vous vraiment vous déconnecter ?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogout(false)} className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold">Annuler</button>
              <button onClick={handleLogout} className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white text-sm font-semibold">Déconnexion</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-4 pt-4 pb-2">{title}</p>
      {children}
    </div>
  );
}

// ── SettingLink ────────────────────────────────────────────────────────────────
function SettingLink({ href, label, icon, description }: { href: string; label: string; icon: React.ReactNode; description?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 border-t border-gray-50 hover:bg-gray-50">
      <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-700 text-sm font-medium">{label}</p>
        {description && <p className="text-gray-400 text-xs truncate">{description}</p>}
      </div>
      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

// ── SettingBtn ─────────────────────────────────────────────────────────────────
function SettingBtn({ label, icon, onClick, description }: { label: string; icon: React.ReactNode; onClick: () => void; description?: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 border-t border-gray-50 hover:bg-gray-50 text-left">
      <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-700 text-sm font-medium">{label}</p>
        {description && <p className="text-gray-400 text-xs truncate">{description}</p>}
      </div>
      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// ── PasswordSheet ──────────────────────────────────────────────────────────────
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

// ── PwField ────────────────────────────────────────────────────────────────────
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

// ── Icons ──────────────────────────────────────────────────────────────────────
const s = "w-4 h-4";
function IcoUser()   { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
function IcoLock()   { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>; }
function IcoTicket() { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>; }
function IcoHelp()   { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function IcoFlag()   { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H13l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>; }
function IcoShare()  { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>; }
