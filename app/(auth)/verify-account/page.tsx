"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, tokenStore, userStore } from "@/lib/api";
import Image from "next/image";

function VerifyAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail]     = useState(searchParams.get("email") ?? "");
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]     = useState("");
  const [resendMsg, setResendMsg] = useState("");

  async function handleResend() {
    if (!email) return;
    setResendMsg("");
    setError("");
    setResending(true);
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

      // Auto-login : on stocke le token et les infos utilisateur
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
