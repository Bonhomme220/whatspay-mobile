"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import Image from "next/image";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail]           = useState(searchParams.get("email") ?? "");
  const [code, setCode]             = useState("");
  const [password, setPassword]     = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email,
        code,
        password,
        password_confirmation: confirmation,
      });
      setSuccess(true);
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

        {success ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-gray-800 text-lg font-semibold mb-2">Mot de passe mis à jour !</h3>
            <p className="text-gray-500 text-sm mb-6">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full text-white font-semibold py-3 rounded-lg text-sm"
              style={{ backgroundColor: "#1ba24b" }}
            >
              Se connecter
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <h3 className="text-gray-800 text-lg font-semibold mb-1">Nouveau mot de passe</h3>
            <p className="text-gray-500 text-sm mb-5">
              Entrez le code reçu par email et choisissez un nouveau mot de passe.
            </p>

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
                <label className="block text-gray-700 text-sm font-medium mb-1.5">Code de réinitialisation</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EX: A1B2C3D4"
                  className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition tracking-widest"
                  style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className="w-full rounded-lg border border-gray-200 px-3 py-3 pr-11 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
                    style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5">Confirmer le mot de passe</label>
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
                  style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: "#1ba24b" }}
              >
                {loading ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
              </button>
            </form>

            <p className="text-center text-sm mt-5 text-gray-500">
              <button onClick={() => router.push("/login")} className="font-medium" style={{ color: "#1ba24b" }}>
                ← Retour à la connexion
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
