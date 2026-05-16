"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Ref { id: string; name: string; }

interface FormData {
  firstname: string; lastname: string; email: string; birthdate: string;
  country_id: string; locality_id: string; phone: string; phonecountry_id: string;
  vuesmoyen: string; lang_id: string; study_id: string;
  categories: string[]; contentTypes: string[];
  password: string; password_confirmation: string;
  ambassador_code: string;
}

const EMPTY: FormData = {
  firstname: "", lastname: "", email: "", birthdate: "",
  country_id: "", locality_id: "", phone: "", phonecountry_id: "",
  vuesmoyen: "", lang_id: "", study_id: "",
  categories: [], contentTypes: [],
  password: "", password_confirmation: "",
  ambassador_code: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState<FormData>(EMPTY);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Référentiels
  const [countries,     setCountries]     = useState<Ref[]>([]);
  const [localities,    setLocalities]    = useState<Ref[]>([]);
  const [categories,    setCategories]    = useState<Ref[]>([]);
  const [langs,         setLangs]         = useState<Ref[]>([]);
  const [studies,       setStudies]       = useState<Ref[]>([]);
  const [contenttypes,  setContenttypes]  = useState<Ref[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<Ref[]>("/countries"),
      api.get<Ref[]>("/categories"),
      api.get<Ref[]>("/langs"),
      api.get<Ref[]>("/studies"),
      api.get<Ref[]>("/contenttypes"),
    ]).then(([c, cat, l, st, ct]) => {
      setCountries(c);
      setCategories(cat);
      setLangs(l);
      setStudies(st);
      setContenttypes(ct);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.country_id) { setLocalities([]); return; }
    api.get<{ data: Ref[] } | Ref[]>(`/localities/by-country/${form.country_id}`)
      .then((res) => setLocalities(Array.isArray(res) ? res : (res as any).data ?? []))
      .catch(() => setLocalities([]));
    set("locality_id", "");
    set("phonecountry_id", form.country_id);
  }, [form.country_id]);

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleArr(arr: string[], val: string, max?: number): string[] {
    if (arr.includes(val)) return arr.filter((x) => x !== val);
    if (max && arr.length >= max) return arr;
    return [...arr, val];
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
      if (!form.birthdate) {
        errs.birthdate = "Date de naissance requise.";
      } else {
        const age = (Date.now() - new Date(form.birthdate).getTime()) / (365.25 * 86400000);
        if (age < 16) errs.birthdate = "Vous devez avoir au moins 16 ans.";
      }
    }
    if (s === 1) {
      if (!form.country_id)   errs.country_id  = "Pays requis.";
      if (!form.locality_id)  errs.locality_id = "Ville requise.";
      if (!form.phone.trim()) errs.phone       = "Téléphone requis.";
    }
    if (s === 2) {
      if (!form.vuesmoyen || Number(form.vuesmoyen) < 1) errs.vuesmoyen = "Nombre de vues requis (min. 1).";
      if (!form.lang_id)  errs.lang_id  = "Langue requise.";
      if (!form.study_id) errs.study_id = "Niveau d'études requis.";
      if (form.categories.length < 1)   errs.categories   = "Sélectionnez au moins 1 catégorie.";
      if (form.categories.length > 4)   errs.categories   = "Maximum 4 catégories.";
      if (form.contentTypes.length < 1) errs.contentTypes = "Sélectionnez au moins 1 type de contenu.";
    }
    if (s === 3) {
      if (!form.password)             errs.password = "Mot de passe requis.";
      else if (form.password.length < 8) errs.password = "Minimum 8 caractères.";
      if (!form.password_confirmation)       errs.password_confirmation = "Confirmez le mot de passe.";
      else if (form.password !== form.password_confirmation) errs.password_confirmation = "Les mots de passe ne correspondent pas.";
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
      await api.post("/auth/register", {
        firstname:            form.firstname,
        lastname:             form.lastname,
        email:                form.email,
        birthdate:            form.birthdate,
        country_id:           form.country_id,
        locality_id:          form.locality_id,
        phone:                form.phone,
        phonecountry_id:      form.phonecountry_id || form.country_id,
        vuesmoyen:            Number(form.vuesmoyen),
        lang_id:              form.lang_id,
        study_id:             form.study_id,
        categories:           form.categories,
        contentTypes:         form.contentTypes,
        password:             form.password,
        password_confirmation: form.password_confirmation,
        ambassador_code:      form.ambassador_code || null,
      });
      router.push(`/verify-account?email=${encodeURIComponent(form.email)}`);
    } catch (err: any) {
      setError(err?.message ?? "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  const STEPS = ["Identité", "Localisation", "Profil", "Sécurité"];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "url('/login-bg.jpg') center/cover no-repeat fixed" }}
    >
      <div className="w-full max-w-sm rounded-xl bg-white px-7 py-8 shadow-[0_0_37px_rgba(8,21,66,0.05)]">
        <div className="flex justify-center mb-5">
          <Image src="/logo.png" alt="WhatsPAY" width={140} height={44} className="object-contain" />
        </div>

        {step === 0 && (
          <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-5">
            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-700 text-sm font-semibold">L'inscription est 100% gratuite</p>
          </div>
        )}

        <StepDots step={step} total={STEPS.length} />

        <h3 className="text-gray-800 text-lg font-semibold mb-0.5">
          Étape {step + 1} — {STEPS[step]}
        </h3>
        <p className="text-gray-500 text-sm mb-5">Inscription diffuseur</p>

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
              <Input label="Date de naissance" type="date" value={form.birthdate} onChange={(e) => { set("birthdate", e.target.value); setFe((f) => ({ ...f, birthdate: "" })); }} max={new Date(Date.now() - 16 * 365.25 * 86400000).toISOString().split("T")[0]} error={fe.birthdate} />
            </>
          )}

          {/* ── Étape 1 : Localisation ── */}
          {step === 1 && (
            <>
              <Select label="Pays" value={form.country_id} onChange={(e) => { set("country_id", e.target.value); setFe((f) => ({ ...f, country_id: "" })); }} error={fe.country_id}>
                <option value="">Sélectionnez votre pays</option>
                {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Select label="Ville / Localité" value={form.locality_id} onChange={(e) => { set("locality_id", e.target.value); setFe((f) => ({ ...f, locality_id: "" })); }} disabled={!localities.length} error={fe.locality_id}>
                <option value="">{localities.length ? "Sélectionnez votre ville" : "Choisissez d'abord un pays"}</option>
                {localities.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
              <Input label="Numéro de téléphone" type="tel" value={form.phone} onChange={(e) => { set("phone", e.target.value); setFe((f) => ({ ...f, phone: "" })); }} placeholder="97000000" error={fe.phone} />
            </>
          )}

          {/* ── Étape 2 : Profil ── */}
          {step === 2 && (
            <>
              <Input
                label="Vues moyennes par statut WhatsApp"
                type="number" min={1}
                value={form.vuesmoyen}
                onChange={(e) => { set("vuesmoyen", e.target.value); setFe((f) => ({ ...f, vuesmoyen: "" })); }}
                placeholder="Ex : 500"
                error={fe.vuesmoyen}
              />
              <Select label="Langue de diffusion" value={form.lang_id} onChange={(e) => { set("lang_id", e.target.value); setFe((f) => ({ ...f, lang_id: "" })); }} error={fe.lang_id}>
                <option value="">Sélectionnez une langue</option>
                {langs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
              <Select label="Niveau d'études" value={form.study_id} onChange={(e) => { set("study_id", e.target.value); setFe((f) => ({ ...f, study_id: "" })); }} error={fe.study_id}>
                <option value="">Sélectionnez votre niveau</option>
                {studies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>

              {/* Catégories */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${fe.categories ? "text-red-500" : "text-gray-700"}`}>
                  Catégories WhatsApp <span className="text-gray-400 font-normal">(1 à 4)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((c) => {
                    const checked = form.categories.includes(c.id);
                    return (
                      <button
                        key={c.id} type="button"
                        onClick={() => { set("categories", toggleArr(form.categories, c.id, 4)); setFe((f) => ({ ...f, categories: "" })); }}
                        className={`text-xs px-3 py-2 rounded-lg border text-left transition-colors ${
                          checked ? "border-green-500 bg-green-50 text-green-700 font-semibold" : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {checked && <span className="mr-1">✓</span>}{c.name}
                      </button>
                    );
                  })}
                </div>
                <FieldError msg={fe.categories} />
              </div>

              {/* Types de contenu */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${fe.contentTypes ? "text-red-500" : "text-gray-700"}`}>
                  Types de contenu <span className="text-gray-400 font-normal">(au moins 1)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {contenttypes.map((ct) => {
                    const checked = form.contentTypes.includes(ct.id);
                    return (
                      <button
                        key={ct.id} type="button"
                        onClick={() => { set("contentTypes", toggleArr(form.contentTypes, ct.id)); setFe((f) => ({ ...f, contentTypes: "" })); }}
                        className={`text-xs px-3 py-2 rounded-lg border text-left transition-colors ${
                          checked ? "border-green-500 bg-green-50 text-green-700 font-semibold" : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {checked && <span className="mr-1">✓</span>}{ct.name}
                      </button>
                    );
                  })}
                </div>
                <FieldError msg={fe.contentTypes} />
              </div>
            </>
          )}

          {/* ── Étape 3 : Sécurité ── */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Minimum 8 caractères"
                    minLength={8}
                    required
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
              <Input
                label="Code ambassadeur (optionnel)"
                value={form.ambassador_code}
                onChange={(e) => set("ambassador_code", e.target.value.toUpperCase())}
                placeholder="Ex : ABC12345"
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
            {step < 3 ? (
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
