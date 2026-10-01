"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, auth, StoredUser } from "@/lib/api";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Ref { id: string; name: string; }
interface PaymentMethod { id: string; name: string; code: string; }
interface CoverageRow { country_id: string; percentage: string; }

interface FormData {
  firstname: string; lastname: string; email: string;
  phone: string; phonecountry_id: string; country_id: string;
  password: string; password_confirmation: string;
  channel_name: string; channel_link: string; account_type: string;
  channel_category_id: string;
  lang_id: string; publish_frequency: string;
  followers_count: string; reached_accounts_30d: string; payment_method_id: string;
}

const MAX_SECONDARY_CATEGORIES = 3;

const EMPTY: FormData = {
  firstname: "", lastname: "", email: "",
  phone: "", phonecountry_id: "", country_id: "",
  password: "", password_confirmation: "",
  channel_name: "", channel_link: "", account_type: "",
  channel_category_id: "",
  lang_id: "", publish_frequency: "",
  followers_count: "", reached_accounts_30d: "", payment_method_id: "",
};

const ACCOUNT_TYPES: { value: string; label: string }[] = [
  { value: "personne", label: "Personne / Influenceur" },
  { value: "media", label: "Média" },
  { value: "marque", label: "Marque / Entreprise" },
  { value: "communaute", label: "Communauté / Association" },
  { value: "institution_religieuse", label: "Institution religieuse" },
];

const PUBLISH_FREQUENCIES: { value: string; label: string }[] = [
  { value: "1x", label: "1 fois/jour" },
  { value: "2x", label: "2 fois/jour" },
  { value: "3x", label: "3 fois/jour" },
  { value: "5x_plus", label: "5 fois ou plus/jour" },
];

// Champs formulaire regroupés par étape (sert à ré-ouvrir la bonne étape quand le
// backend renvoie une erreur 422 sur un champ d'une étape déjà passée).
const STEP_FIELDS: string[][] = [
  ["firstname", "lastname", "email", "phone", "country_id", "phonecountry_id"],
  ["password", "password_confirmation"],
  ["channel_name", "channel_link", "account_type"],
  ["channel_category_id", "channel_category_secondary_ids", "lang_id", "publish_frequency"],
  ["followers_count", "reached_accounts_30d", "payment_method_id"],
  ["country_coverage"],
  ["screenshot_channel_page", "screenshot_couverture", "screenshot_followers", "screenshot_admin_page"],
];

const STEPS = ["Identité", "Sécurité", "Chaîne", "Catégories", "Audience", "Couverture", "Documents"];

// ── Helpers (mêmes composants/styles que app/(auth)/register/page.tsx) ──────────
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

function Select({ label, error, children, ...props }: { label: string; error?: string } & React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-gray-700 text-sm font-medium mb-1.5">{label}</label>
      <select
        {...props}
        className={`w-full rounded-lg border px-3 py-3 text-sm text-gray-700 focus:outline-none focus:border-green-500 transition ${error ? "border-red-400" : "border-gray-200"}`}
        style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
      >
        {children}
      </select>
      <FieldError msg={error} />
    </div>
  );
}

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all ${i < step ? "w-6 bg-green-600" : i === step ? "w-6 bg-green-400" : "w-3 bg-gray-200"}`} />
      ))}
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RegisterMediaPartnerPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [secondaryCategoryIds, setSecondaryCategoryIds] = useState<string[]>([]);
  const [coverage, setCoverage] = useState<CoverageRow[]>([{ country_id: "", percentage: "" }]);
  const [files, setFiles] = useState<{ screenshot_channel_page: File | null; screenshot_couverture: File | null; screenshot_followers: File | null; screenshot_admin_page: File | null }>({
    screenshot_channel_page: null, screenshot_couverture: null, screenshot_followers: null, screenshot_admin_page: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Référentiels
  const [countries, setCountries] = useState<Ref[]>([]);
  const [channelCategories, setChannelCategories] = useState<Ref[]>([]);
  const [langs, setLangs] = useState<Ref[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<Ref[]>("/countries"),
      api.get<Ref[]>("/channel-categories"),
      api.get<Ref[]>("/langs"),
      api.get<PaymentMethod[]>("/payment-methods"),
    ]).then(([c, cat, l, pm]) => {
      setCountries(c);
      setChannelCategories(cat);
      setLangs(l);
      setPaymentMethods(pm);
    }).catch(() => {});
  }, []);

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onPrincipalCategoryChange(v: string) {
    set("channel_category_id", v);
    setSecondaryCategoryIds((ids) => ids.filter((id) => id !== v));
  }

  function toggleSecondaryCategory(id: string) {
    setSecondaryCategoryIds((ids) => {
      if (ids.includes(id)) return ids.filter((x) => x !== id);
      if (ids.length >= MAX_SECONDARY_CATEGORIES) return ids;
      return [...ids, id];
    });
  }

  // Pays de résidence → indicatif téléphonique par défaut (même comportement que le
  // formulaire diffuseur : l'utilisateur peut toujours changer le pays de résidence,
  // l'indicatif suit automatiquement tant qu'il n'a pas été modifié à la main).
  function onCountryChange(v: string) {
    set("country_id", v);
    setForm((f) => ({ ...f, country_id: v, phonecountry_id: v }));
  }

  // Couverture pays
  function addCoverageRow() {
    setCoverage((rows) => [...rows, { country_id: "", percentage: "" }]);
  }
  function removeCoverageRow(idx: number) {
    setCoverage((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows));
  }
  function updateCoverageRow(idx: number, field: keyof CoverageRow, value: string) {
    setCoverage((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
    setFe((f) => ({ ...f, country_coverage: "" }));
  }

  // ── Validation champ par champ ────────────────────────────────────────────
  type FieldErrors = Partial<Record<string, string>>;
  const [fe, setFe] = useState<FieldErrors>({});

  function getStepErrors(s: number): FieldErrors {
    const errs: FieldErrors = {};
    if (s === 0) {
      if (!form.firstname.trim()) errs.firstname = "Prénom requis.";
      if (!form.lastname.trim())  errs.lastname  = "Nom requis.";
      if (!form.email.trim())     errs.email     = "Email requis.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email invalide.";
      if (!form.country_id)       errs.country_id = "Pays de résidence requis.";
      if (!form.phone.trim())     errs.phone      = "Téléphone requis.";
    }
    if (s === 1) {
      if (!form.password)                errs.password = "Mot de passe requis.";
      else if (form.password.length < 8) errs.password = "Minimum 8 caractères.";
      if (!form.password_confirmation)   errs.password_confirmation = "Confirmez le mot de passe.";
      else if (form.password !== form.password_confirmation) errs.password_confirmation = "Les mots de passe ne correspondent pas.";
    }
    if (s === 2) {
      if (!form.channel_name.trim()) errs.channel_name = "Nom de la chaîne requis.";
      if (!form.channel_link.trim()) errs.channel_link = "Lien de la chaîne requis.";
      else if (!/^https?:\/\/.+/i.test(form.channel_link.trim())) errs.channel_link = "Lien invalide (doit commencer par http:// ou https://).";
      if (!form.account_type) errs.account_type = "Type de compte requis.";
    }
    if (s === 3) {
      if (!form.channel_category_id) errs.channel_category_id = "Catégorie requise.";
      if (!form.lang_id)             errs.lang_id             = "Langue requise.";
      if (!form.publish_frequency)   errs.publish_frequency   = "Fréquence de publication requise.";
    }
    if (s === 4) {
      if (!form.followers_count || Number(form.followers_count) < 0) errs.followers_count = "Nombre d'abonnés requis.";
      if (!form.reached_accounts_30d) {
        errs.reached_accounts_30d = "Ce champ est requis.";
      } else if (Number(form.reached_accounts_30d) < 100) {
        errs.reached_accounts_30d = "Il faut au moins 100 comptes touchés sur 30 jours pour être éligible.";
      }
      if (!form.payment_method_id) errs.payment_method_id = "Moyen de paiement requis.";
    }
    if (s === 5) {
      const invalid = coverage.some((r) => {
        if (!r.country_id) return true;
        const pct = Number(r.percentage);
        return r.percentage === "" || Number.isNaN(pct) || pct < 0 || pct > 100;
      });
      if (coverage.length < 1 || invalid) errs.country_coverage = "Renseignez un pays et un pourcentage (0-100) pour chaque ligne.";
    }
    if (s === 6) {
      if (!files.screenshot_channel_page) errs.screenshot_channel_page = "Capture requise.";
      if (!files.screenshot_couverture)   errs.screenshot_couverture   = "Capture requise.";
      if (!files.screenshot_followers)    errs.screenshot_followers    = "Capture requise.";
      if (!files.screenshot_admin_page)   errs.screenshot_admin_page   = "Capture requise.";
    }
    return errs;
  }

  function next() {
    const errs = getStepErrors(step);
    if (Object.keys(errs).length > 0) { setFe(errs); return; }
    setFe({});
    setError("");
    setStep((s) => s + 1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = getStepErrors(step);
    if (Object.keys(errs).length > 0) { setFe(errs); return; }
    setFe({});
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("firstname", form.firstname);
      fd.append("lastname", form.lastname);
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("password_confirmation", form.password_confirmation);
      fd.append("phone", form.phone);
      fd.append("phonecountry_id", form.phonecountry_id || form.country_id);
      fd.append("country_id", form.country_id);
      fd.append("channel_name", form.channel_name);
      fd.append("channel_link", form.channel_link);
      fd.append("account_type", form.account_type);
      fd.append("channel_category_id", form.channel_category_id);
      secondaryCategoryIds.forEach((id) => fd.append("channel_category_secondary_ids[]", id));
      fd.append("lang_id", form.lang_id);
      fd.append("publish_frequency", form.publish_frequency);
      fd.append("followers_count", form.followers_count);
      fd.append("reached_accounts_30d", form.reached_accounts_30d);
      fd.append("payment_method_id", form.payment_method_id);
      coverage.forEach((row, i) => {
        fd.append(`country_coverage[${i}][country_id]`, row.country_id);
        fd.append(`country_coverage[${i}][percentage]`, row.percentage);
      });
      if (files.screenshot_channel_page) fd.append("screenshot_channel_page", files.screenshot_channel_page);
      if (files.screenshot_couverture)   fd.append("screenshot_couverture", files.screenshot_couverture);
      if (files.screenshot_followers)    fd.append("screenshot_followers", files.screenshot_followers);
      if (files.screenshot_admin_page)   fd.append("screenshot_admin_page", files.screenshot_admin_page);

      const res = await api.postForm<{ message?: string; token?: string; profil?: string; user?: StoredUser }>(
        "/auth/register-media-partner",
        fd
      );

      if (res?.token && res?.user) {
        auth.applySession({ token: res.token, profil: res.profil ?? "PARTENAIRE_MEDIA", user: res.user });
        router.replace("/media-partner/dashboard");
        return;
      }
      setSuccessMsg(res?.message || "Inscription réussie. Votre profil de chaîne est en attente de validation par notre équipe.");
    } catch (err: any) {
      const backendErrors: Record<string, string[]> | undefined = err?.errors;
      if (backendErrors) {
        const mapped: FieldErrors = {};
        for (const key of Object.keys(backendErrors)) {
          // "country_coverage.0.country_id" → regroupé sous "country_coverage"
          const rootKey = key.split(".")[0];
          mapped[rootKey] = backendErrors[key][0];
        }
        setFe(mapped);
        const firstStep = STEP_FIELDS.findIndex((fields) => fields.some((f) => mapped[f] !== undefined));
        if (firstStep >= 0) setStep(firstStep);
      }
      setError(err?.message ?? "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  // ── Écran de confirmation (pas de dashboard partenaire pour l'instant) ──────
  if (successMsg) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-10"
        style={{ background: "url('/login-bg.jpg') center/cover no-repeat fixed" }}
      >
        <div className="w-full max-w-sm rounded-xl bg-white px-7 py-8 shadow-[0_0_37px_rgba(8,21,66,0.05)] text-center">
          <div className="flex justify-center mb-5">
            <Image src="/logo.png" alt="WhatsPAY" width={140} height={44} className="object-contain" />
          </div>
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-gray-800 text-lg font-semibold mb-2">Inscription envoyée</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">{successMsg}</p>
          <a
            href="/login"
            className="block w-full text-white font-semibold py-3 rounded-lg text-sm text-center"
            style={{ backgroundColor: "#1ba24b" }}
          >
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "url('/login-bg.jpg') center/cover no-repeat fixed" }}
    >
      <div className="w-full max-w-sm rounded-xl bg-white px-7 py-8 shadow-[0_0_37px_rgba(8,21,66,0.05)]">
        <div className="flex justify-center mb-5">
          <Image src="/logo.png" alt="WhatsPAY" width={140} height={44} className="object-contain" />
        </div>

        <StepDots step={step} total={STEPS.length} />

        <h3 className="text-gray-800 text-lg font-semibold mb-0.5">
          Étape {step + 1} — {STEPS[step]}
        </h3>
        <p className="text-gray-500 text-sm mb-5">Inscription partenaire média</p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">

          {/* ── Étape 0 : Identité ── */}
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prénom" value={form.firstname} onChange={(e) => { set("firstname", e.target.value); setFe((f) => ({ ...f, firstname: "" })); }} placeholder="Jean" error={fe.firstname} />
                <Input label="Nom" value={form.lastname} onChange={(e) => { set("lastname", e.target.value); setFe((f) => ({ ...f, lastname: "" })); }} placeholder="Dupont" error={fe.lastname} />
              </div>
              <Input label="Adresse mail" type="email" value={form.email} onChange={(e) => { set("email", e.target.value); setFe((f) => ({ ...f, email: "" })); }} placeholder="votre@mail.com" error={fe.email} />
              <Select label="Pays de résidence" value={form.country_id} onChange={(e) => { onCountryChange(e.target.value); setFe((f) => ({ ...f, country_id: "" })); }} error={fe.country_id}>
                <option value="">Sélectionnez votre pays</option>
                {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Input label="Numéro de téléphone" type="tel" value={form.phone} onChange={(e) => { set("phone", e.target.value); setFe((f) => ({ ...f, phone: "" })); }} placeholder="97000000" error={fe.phone} />
            </>
          )}

          {/* ── Étape 1 : Sécurité ── */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => { set("password", e.target.value); setFe((f) => ({ ...f, password: "" })); }}
                    placeholder="Minimum 8 caractères"
                    minLength={8}
                    className="w-full rounded-lg border border-gray-200 px-3 py-3 pr-11 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
                    style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPwd
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                      }
                    </svg>
                  </button>
                </div>
                <p className="text-gray-400 text-xs italic mt-1.5 leading-relaxed">
                  Au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.{" "}
                  <span className="text-gray-500 not-italic font-medium">Ex : MonMot2024!</span>
                </p>
                <FieldError msg={fe.password} />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5">Confirmer le mot de passe</label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password_confirmation}
                  onChange={(e) => { set("password_confirmation", e.target.value); setFe((f) => ({ ...f, password_confirmation: "" })); }}
                  placeholder="Répétez le mot de passe"
                  className={`w-full rounded-lg border px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition ${fe.password_confirmation ? "border-red-400" : "border-gray-200"}`}
                  style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
                />
                <FieldError msg={fe.password_confirmation} />
              </div>
            </>
          )}

          {/* ── Étape 2 : Chaîne ── */}
          {step === 2 && (
            <>
              <Input label="Nom de la chaîne" value={form.channel_name} onChange={(e) => { set("channel_name", e.target.value); setFe((f) => ({ ...f, channel_name: "" })); }} placeholder="Ex : Actu Bénin 24" error={fe.channel_name} />
              <Input label="Lien de la chaîne WhatsApp" type="url" value={form.channel_link} onChange={(e) => { set("channel_link", e.target.value); setFe((f) => ({ ...f, channel_link: "" })); }} placeholder="https://whatsapp.com/channel/..." error={fe.channel_link} />
              <Select label="Type de compte" value={form.account_type} onChange={(e) => { set("account_type", e.target.value); setFe((f) => ({ ...f, account_type: "" })); }} error={fe.account_type}>
                <option value="">Sélectionnez un type</option>
                {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </>
          )}

          {/* ── Étape 3 : Catégories & langue ── */}
          {step === 3 && (
            <>
              <Select label="Catégorie principale" value={form.channel_category_id} onChange={(e) => { onPrincipalCategoryChange(e.target.value); setFe((f) => ({ ...f, channel_category_id: "" })); }} error={fe.channel_category_id}>
                <option value="">Sélectionnez une catégorie</option>
                {channelCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5">
                  Catégories secondaires (facultatif, {secondaryCategoryIds.length}/{MAX_SECONDARY_CATEGORIES})
                </label>
                <div className="rounded-lg border border-gray-200 max-h-44 overflow-y-auto divide-y divide-gray-100" style={{ backgroundColor: "rgba(43,94,94,0.1)" }}>
                  {channelCategories.filter((c) => c.id !== form.channel_category_id).map((c) => {
                    const checked = secondaryCategoryIds.includes(c.id);
                    const disabled = !checked && secondaryCategoryIds.length >= MAX_SECONDARY_CATEGORIES;
                    return (
                      <label key={c.id} className={`flex items-center gap-2 px-3 py-2.5 text-sm ${disabled ? "opacity-40" : "cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleSecondaryCategory(c.id)}
                          className="w-4 h-4 accent-green-600"
                        />
                        <span className="text-gray-700">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-gray-400 text-xs mt-1">Jusqu'à {MAX_SECONDARY_CATEGORIES} thématiques secondaires.</p>
              </div>
              <Select label="Langue de diffusion" value={form.lang_id} onChange={(e) => { set("lang_id", e.target.value); setFe((f) => ({ ...f, lang_id: "" })); }} error={fe.lang_id}>
                <option value="">Sélectionnez une langue</option>
                {langs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
              <Select label="Fréquence de publication" value={form.publish_frequency} onChange={(e) => { set("publish_frequency", e.target.value); setFe((f) => ({ ...f, publish_frequency: "" })); }} error={fe.publish_frequency}>
                <option value="">Sélectionnez une fréquence</option>
                {PUBLISH_FREQUENCIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </>
          )}

          {/* ── Étape 4 : Audience & paiement ── */}
          {step === 4 && (
            <>
              <Input
                label="Nombre d'abonnés"
                type="number" min={0}
                value={form.followers_count}
                onChange={(e) => { set("followers_count", e.target.value); setFe((f) => ({ ...f, followers_count: "" })); }}
                placeholder="Ex : 5000"
                error={fe.followers_count}
              />
              <Input
                label="Comptes touchés sur les 30 derniers jours (onglet Couverture)"
                type="number" min={0}
                value={form.reached_accounts_30d}
                onChange={(e) => { set("reached_accounts_30d", e.target.value); setFe((f) => ({ ...f, reached_accounts_30d: "" })); }}
                placeholder="Ex : 1500"
                error={fe.reached_accounts_30d}
              />
              <Select label="Moyen de paiement" value={form.payment_method_id} onChange={(e) => { set("payment_method_id", e.target.value); setFe((f) => ({ ...f, payment_method_id: "" })); }} error={fe.payment_method_id}>
                <option value="">Sélectionnez un moyen de paiement</option>
                {paymentMethods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </>
          )}

          {/* ── Étape 5 : Couverture pays ── */}
          {step === 5 && (
            <>
              <p className="text-gray-500 text-xs -mt-1 mb-1">
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
                className="text-sm font-medium"
                style={{ color: "#1ba24b" }}
              >
                + Ajouter un pays
              </button>
            </>
          )}

          {/* ── Étape 6 : Documents ── */}
          {step === 6 && (
            <>
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
              <FileField
                label="Étape 7 — Capture de la page Admin de votre chaîne"
                file={files.screenshot_admin_page}
                error={fe.screenshot_admin_page}
                onChange={(f) => { setFiles((s) => ({ ...s, screenshot_admin_page: f })); setFe((fe0) => ({ ...fe0, screenshot_admin_page: "" })); }}
              />
            </>
          )}

          {/* ── Navigation ── */}
          <div className="flex gap-3 pt-1">
            {step > 0 && (
              <button
                type="button"
                onClick={() => { setError(""); setFe({}); setStep((s) => s - 1); }}
                className="flex-1 py-3 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold"
              >
                Retour
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="flex-1 text-white font-semibold py-3 rounded-lg text-sm"
                style={{ backgroundColor: "#1ba24b" }}
              >
                Suivant
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-60"
                style={{ backgroundColor: "#1ba24b" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Inscription…
                  </span>
                ) : "S'inscrire"}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm mt-5 text-gray-500">
          Déjà inscrit ?{" "}
          <a href="/login" className="font-medium" style={{ color: "#1ba24b" }}>
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}
