"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, tokenStore, userStore } from "@/lib/api";
import Image from "next/image";

const WHATSAPP_DELAY  = 20; // secondes avant de proposer la réception du code par WhatsApp

function VerifyAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail]         = useState(searchParams.get("email") ?? "");
  const [code, setCode]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [whatsappDelay, setWhatsappDelay] = useState(WHATSAPP_DELAY);
  const [showWhatsapp, setShowWhatsapp]   = useState(false);

  // Réception du code par WhatsApp (numéro pré-rempli depuis l'inscription, éditable)
  const pcid = searchParams.get("pcid") ?? "";
  const [waPhone, setWaPhone]   = useState(searchParams.get("phone") ?? "");
  const [waSending, setWaSending] = useState(false);
  const [waMsg, setWaMsg]       = useState("");
  const [waOk, setWaOk]         = useState(false);

  // Countdown 120s → affiche lien WhatsApp
  useEffect(() => {
    if (showWhatsapp) return;
    if (whatsappDelay <= 0) {
      setShowWhatsapp(true);
      return;
    }
    const timer = setTimeout(() => setWhatsappDelay((d) => d - 1), 1000);
    return () => clearTimeout(timer);
  }, [whatsappDelay, showWhatsapp]);

  // Réinitialiser le countdown si l'email change
  useEffect(() => {
    setWhatsappDelay(WHATSAPP_DELAY);
    setShowWhatsapp(false);
  }, [email]);

  async function handleWhatsappSend() {
    if (!email)   { setWaMsg("Email manquant."); setWaOk(false); return; }
    if (!waPhone.trim()) { setWaMsg("Numéro manquant."); setWaOk(false); return; }
    setWaSending(true);
    setWaMsg("");
    try {
      await api.post("/auth/verify-whatsapp", {
        email,
        phone: waPhone.trim(),
        phonecountry_id: pcid || undefined,
      });
      setWaOk(true);
      setWaMsg("Code envoyé sur votre WhatsApp. Saisissez-le ci-dessus.");
    } catch (err: any) {
      setWaOk(false);
      setWaMsg(err?.message ?? "Envoi WhatsApp impossible. Vérifiez le numéro.");
    } finally {
      setWaSending(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResendMsg("");
    setError("");
    setResending(true);
    // Réinitialiser le countdown WhatsApp à chaque renvoi
    setWhatsappDelay(WHATSAPP_DELAY);
    setShowWhatsapp(false);
    try {
      await api.post("/auth/resend-verification", { email });
      setResendMsg("Un nouveau code a été envoyé à votre adresse mail.");
    } catch (err: any) {
      setError(err?.message ?? "Impossible de renvoyer le code.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post<{ token: string; profil: string; user: any }>("/auth/verify-account", {
        email,
        code: code.toUpperCase(),
      });

      tokenStore.set(data.token);
      userStore.set({ ...data.user, profil: data.profil });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Code invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "url('/login-bg.jpg') center/cover no-repeat fixed" }}
    >
      <div className="w-full max-w-sm rounded-xl bg-white px-7 py-8 shadow-[0_0_37px_rgba(8,21,66,0.05)]">
        <div className="flex justify-center mb-7">
          <Image src="/logo.png" alt="WhatsPAY" width={160} height={50} className="object-contain" />
        </div>

        {/* Icône email */}
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h3 className="text-gray-800 text-lg font-semibold mb-1 text-center">Vérifiez votre email</h3>
        <p className="text-gray-500 text-sm mb-6 text-center leading-relaxed">
          Un code à 8 caractères a été envoyé à<br />
          <strong className="text-gray-700">{email}</strong>
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {resendMsg && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-green-700 text-sm">{resendMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Adresse mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@mail.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
              style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Code de vérification</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex : A1B2C3D4"
              maxLength={8}
              className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition tracking-widest text-center font-mono text-lg"
              style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 8}
            className="w-full text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: "#1ba24b" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Vérification…
              </span>
            ) : "Activer mon compte"}
          </button>
        </form>

        <div className="mt-5 text-center space-y-3">
          <p className="text-gray-500 text-sm">
            Vous n&apos;avez pas reçu le code ?{" "}
            <button
              onClick={handleResend}
              disabled={resending}
              className="font-medium disabled:opacity-50"
              style={{ color: "#1ba24b" }}
            >
              {resending ? "Envoi…" : "Renvoyer le code"}
            </button>
          </p>

          {/* Réception du code par WhatsApp — apparaît après 20s */}
          {showWhatsapp ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-gray-700 text-left">
              <p className="mb-2 flex items-center gap-2 font-semibold" style={{ color: "#128C7E" }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Recevoir le code par WhatsApp
              </p>
              <p className="mb-2 text-xs text-gray-500">Vérifiez ou corrigez votre numéro WhatsApp avant l&apos;envoi.</p>
              <input
                type="tel"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="Votre numéro WhatsApp"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition mb-2 bg-white"
              />
              <button
                type="button"
                onClick={handleWhatsappSend}
                disabled={waSending}
                className="w-full text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: "#25D366" }}
              >
                {waSending ? "Envoi…" : "Envoyer le code par WhatsApp"}
              </button>
              {waMsg && (
                <p className={`mt-2 text-xs ${waOk ? "text-green-700" : "text-red-600"}`}>{waMsg}</p>
              )}
            </div>
          ) : (
            !resendMsg && (
              <p className="text-xs text-gray-400">
                Recevoir le code par WhatsApp disponible dans{" "}
                <span className="font-mono">{Math.floor(whatsappDelay / 60)}:{String(whatsappDelay % 60).padStart(2, "0")}</span>
              </p>
            )
          )}

          <p className="text-sm">
            <button onClick={() => router.push("/login")} className="font-medium" style={{ color: "#1ba24b" }}>
              ← Retour à la connexion
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyAccountPage() {
  return (
    <Suspense>
      <VerifyAccountForm />
    </Suspense>
  );
}
