"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, auth } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Category { id: string; name: string; }
interface Country  { id: string; name: string; }
interface Locality { id: string; name: string; country_id: string; }
interface AmbassadorStat { active_referrals: number; total_referrals: number; }
interface DeletionRequest { id: string; status: string; reason: string; }

interface Profile {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  birthdate: string | null;
  vuesmoyen: number;
  country: Country | null;
  locality: Locality | null;
  categories: Category[];
  wallet_balance: number;
  completed_campaigns: number;
  is_ambassador: boolean;
  ambassador_code: string | null;
  ambassador_stat: AmbassadorStat | null;
  created_at: string;
  deletion_request: DeletionRequest | null;
}

function fmt(n: number) { return n.toLocaleString("fr-FR"); }
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
function initials(p: Profile) {
  return ((p.firstname?.[0] ?? "") + (p.lastname?.[0] ?? "")).toUpperCase();
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProfilPage() {
  const router = useRouter();

  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get<Profile>("/profile")
      .then(setProfile)
      .catch((e) => { if (e?.status === 401) router.push("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function handleLogout() {
    await auth.logout();
    router.push("/login");
  }

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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-2xl font-bold">Mon profil</h1>
          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center gap-1.5 text-white/70 text-xs py-1.5 px-3 rounded-full border border-white/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">{initials(profile)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-lg leading-tight truncate">{profile.firstname} {profile.lastname}</p>
            <p className="text-white/70 text-xs truncate">{profile.email}</p>
            {profile.is_ambassador && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold bg-yellow-400/20 text-yellow-200 px-2 py-0.5 rounded-full border border-yellow-400/30">
                ★ Ambassadeur
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="text-white font-bold text-lg leading-tight">{fmt(profile.wallet_balance)} F</div>
            <div className="text-green-100 text-[10px] mt-0.5">Solde disponible</div>
          </div>
          <div className="py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="text-white font-bold text-lg leading-tight">{fmt(profile.completed_campaigns)}</div>
            <div className="text-green-100 text-[10px] mt-0.5">Campagnes validées</div>
          </div>
          <div className="py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="text-white font-bold text-lg leading-tight">{fmt(profile.vuesmoyen)}</div>
            <div className="text-green-100 text-[10px] mt-0.5">Vues moyennes</div>
          </div>
          <div className="py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="text-white font-bold text-lg leading-tight">{fmtDate(profile.created_at).split(" ").slice(1).join(" ")}</div>
            <div className="text-green-100 text-[10px] mt-0.5">Membre depuis</div>
          </div>
        </div>
      </div>

      <div className="mx-4 -mt-6 space-y-4 pb-10">

        {/* ── Infos personnelles ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Informations</p>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-green-600 font-semibold flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </button>
          </div>
          <InfoRow label="Téléphone" value={profile.phone ?? "—"} />
          <InfoRow label="Date de naissance" value={fmtDate(profile.birthdate)} />
          <InfoRow label="Pays" value={profile.country?.name ?? "—"} />
          <InfoRow label="Localité" value={profile.locality?.name ?? "—"} />
        </div>

        {/* ── Catégories ── */}
        {profile.categories.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Centres d'intérêt</p>
            <div className="flex flex-wrap gap-2">
              {profile.categories.map((c) => (
                <span key={c.id} className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Ambassador ── */}
        {profile.is_ambassador && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-yellow-200 flex items-center justify-center flex-shrink-0">
                <span className="text-yellow-700 text-sm">★</span>
              </div>
              <p className="text-yellow-800 font-bold text-sm">Programme Ambassadeur</p>
            </div>
            {profile.ambassador_code && (
              <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-between mb-3">
                <div>
                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide">Mon code de parrainage</p>
                  <p className="text-gray-800 font-bold text-base tracking-widest mt-0.5">{profile.ambassador_code}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard?.writeText(profile.ambassador_code!)}
                  className="text-green-600 p-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}
            {profile.ambassador_stat && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl px-3 py-2.5 text-center">
                  <div className="text-yellow-700 font-bold text-lg">{profile.ambassador_stat.active_referrals}</div>
                  <div className="text-gray-400 text-[10px]">Filleuls actifs</div>
                </div>
                <div className="bg-white rounded-xl px-3 py-2.5 text-center">
                  <div className="text-yellow-700 font-bold text-lg">{profile.ambassador_stat.total_referrals}</div>
                  <div className="text-gray-400 text-[10px]">Total filleuls</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Zone de danger ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Zone de danger</p>
          {profile.deletion_request?.status === "PENDING" ? (
            <div className="rounded-xl px-4 py-3 text-xs bg-orange-50 border border-orange-200 text-orange-700">
              Votre demande de suppression de compte est en cours de traitement.
            </div>
          ) : (
            <>
              {profile.deletion_request?.status === "REJECTED" && (
                <div className="rounded-xl px-4 py-3 text-xs bg-gray-50 border border-gray-200 text-gray-500 mb-3">
                  Votre demande précédente a été rejetée. Vous pouvez en soumettre une nouvelle.
                </div>
              )}
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 text-red-500 text-sm font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Demander la suppression du compte
              </button>
            </>
          )}
        </div>

      </div>

      {/* ── Edit bottom sheet ── */}
      {editing && (
        <EditSheet
          profile={profile}
          onClose={() => setEditing(false)}
          onSuccess={() => { setEditing(false); load(); }}
        />
      )}

      {/* ── Delete confirmation ── */}
      {showDelete && (
        <DeleteSheet
          onClose={() => setShowDelete(false)}
          onSuccess={() => { setShowDelete(false); load(); }}
        />
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

// ── InfoRow ────────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="text-gray-700 text-xs font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

// ── EditSheet ──────────────────────────────────────────────────────────────────
function EditSheet({ profile, onClose, onSuccess }: {
  profile: Profile;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    firstname:   profile.firstname  ?? "",
    lastname:    profile.lastname   ?? "",
    phone:       profile.phone      ?? "",
    birthdate:   profile.birthdate  ?? "",
    vuesmoyen:   String(profile.vuesmoyen ?? ""),
    country_id:  profile.country?.id  ?? "",
    locality_id: profile.locality?.id ?? "",
  });
  const [selectedCats, setSelectedCats] = useState<string[]>(profile.categories.map((c) => c.id));

  const [countries,   setCountries]   = useState<Country[]>([]);
  const [localities,  setLocalities]  = useState<Locality[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    api.get<Country[]>("/countries").then(setCountries).catch(() => {});
    api.get<Category[]>("/categories").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.country_id) return;
    api.get<{ data: Locality[] }>(`/localities/by-country/${form.country_id}`)
      .then((r) => setLocalities(r.data))
      .catch(() => {});
  }, [form.country_id]);

  function toggleCat(id: string) {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.put("/profile", { ...form, categories: selectedCats });
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="mt-auto w-full bg-white rounded-t-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-6 pb-3 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-gray-800 font-bold text-base">Modifier le profil</h2>
            <button onClick={onClose} className="text-gray-400 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={save} className="overflow-y-auto px-5 pb-10 space-y-4 flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *" value={form.firstname} onChange={(v) => setForm({ ...form, firstname: v })} required />
            <Field label="Nom *" value={form.lastname} onChange={(v) => setForm({ ...form, lastname: v })} required />
          </div>
          <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
          <Field label="Date de naissance" value={form.birthdate} onChange={(v) => setForm({ ...form, birthdate: v })} type="date" />
          <Field label="Vues moyennes WhatsApp" value={form.vuesmoyen} onChange={(v) => setForm({ ...form, vuesmoyen: v })} type="number" />

          {/* Pays */}
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1.5">Pays</label>
            <select
              value={form.country_id}
              onChange={(e) => setForm({ ...form, country_id: e.target.value, locality_id: "" })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="">-- Sélectionner --</option>
              {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Localité */}
          {localities.length > 0 && (
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1.5">Localité</label>
              <select
                value={form.locality_id}
                onChange={(e) => setForm({ ...form, locality_id: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <option value="">-- Sélectionner --</option>
                {localities.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}

          {/* Catégories */}
          {categories.length > 0 && (
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1.5">
                Centres d'intérêt <span className="font-normal text-gray-400">(max 4)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const active = selectedCats.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCat(c.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                        active
                          ? "bg-green-600 border-green-600 text-white"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Field helper ───────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", required, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
      />
    </div>
  );
}

// ── DeleteSheet ────────────────────────────────────────────────────────────────
function DeleteSheet({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason]   = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.length < 10) { setError("Minimum 10 caractères."); return; }
    setSending(true);
    setError(null);
    try {
      await api.post("/profile/delete-account", { reason });
      onSuccess();
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
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h2 className="text-gray-800 font-bold text-base">Demande de suppression</h2>
            <p className="text-gray-400 text-xs">L'équipe traitera votre demande et vous contactera.</p>
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
      </div>
    </div>
  );
}
