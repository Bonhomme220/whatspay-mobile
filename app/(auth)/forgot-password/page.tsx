"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? "Une erreur est survenue. Vérifiez votre adresse email.");
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
            <h3 className="text-gray-800 text-lg font-semibold mb-2">Email envoyé !</h3>
            <p className="text-gray-500 text-sm mb-6">
              Un code de réinitialisation a été envoyé à <strong>{email}</strong>. Consultez votre boîte mail.
            </p>
            <button
              onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="w-full text-white font-semibold py-3 rounded-lg text-sm"
              style={{ backgroundColor: "#1ba24b" }}
            >
              Entrer le code reçu
            </button>
            <button
              onClick={() => router.push("/login")}
              className="w-full mt-2 text-sm font-medium py-2"
              style={{ color: "#1ba24b" }}
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <h3 className="text-gray-800 text-lg font-semibold mb-1">Mot de passe oublié</h3>
            <p className="text-gray-500 text-sm mb-5">
              Entrez votre adresse email pour recevoir un code de réinitialisation.
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

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-60"
                style={{ backgroundColor: "#1ba24b" }}
              >
                {loading ? "Envoi en cours…" : "Envoyer le code"}
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
