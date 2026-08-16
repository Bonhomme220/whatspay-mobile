"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone]         = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ token: string; firstname?: string }>(
        "/auth/reset-verify-identity",
        { phone, birthdate }
      );
      // Identité vérifiée → on passe à l'écran de choix du nouveau mot de passe.
      const params = new URLSearchParams({ token: res.token });
      if (res.firstname) params.set("name", res.firstname);
      router.push(`/reset-password?${params.toString()}`);
    } catch (err: any) {
      setError(err?.message ?? "Les informations fournies ne correspondent à aucun compte.");
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

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <h3 className="text-gray-800 text-lg font-semibold mb-1">Mot de passe oublié</h3>
        <p className="text-gray-500 text-sm mb-5">
          Confirmez votre identité pour réinitialiser votre mot de passe. Renseignez votre numéro de
          téléphone et votre date de naissance, exactement comme lors de votre inscription.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Numéro de téléphone</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="97000000"
              className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
              style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Date de naissance</label>
            <input
              type="date"
              required
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
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
            {loading ? "Vérification…" : "Vérifier mon identité"}
          </button>
        </form>

        <p className="text-center text-sm mt-5 text-gray-500">
          <button onClick={() => router.push("/login")} className="font-medium" style={{ color: "#1ba24b" }}>
            ← Retour à la connexion
          </button>
        </p>
      </div>
    </div>
  );
}
