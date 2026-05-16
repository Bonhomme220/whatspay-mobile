"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [profil, setProfil]     = useState("DIFFUSEUR");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await auth.login(email, password, remember, profil);
      if (data.profil === "DIFFUSEUR") {
        router.push("/dashboard");
      } else if (data.profil === "ANNONCEUR") {
        window.location.href = "https://whatspay.africa/admin/client/dashboard";
      } else {
        window.location.href = "https://whatspay.africa/admin/dashboard";
      }
    } catch (err: any) {
      setError(err?.message ?? "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background: "url('/login-bg.jpg') center/cover no-repeat fixed",
      }}
    >
      {/* Carte blanche */}
      <div className="w-full max-w-sm rounded-xl bg-white px-7 py-8 shadow-[0_0_37px_rgba(8,21,66,0.05)]">

        {/* Logo */}
        <div className="flex justify-center mb-7">
          <Image src="/logo.png" alt="WhatsPAY" width={160} height={50} className="object-contain" />
        </div>

        {/* Alert erreur */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <h3 className="text-gray-800 text-lg font-semibold mb-1">Connectez vous</h3>
        <p className="text-gray-500 text-sm mb-5">Entrez vos identifiants pour vous connecter</p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Profil */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Profil</label>
            <select
              value={profil}
              onChange={(e) => setProfil(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-700 focus:outline-none focus:border-green-500 transition"
              style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
            >
              <option value="">Indiquez votre profil</option>
              <option value="DIFFUSEUR">DIFFUSEUR</option>
              <option value="ANNONCEUR">ANNONCEUR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Adresse mail</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@mail.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
              style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="*********"
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

          {/* Remember me + oublié */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded accent-green-600"
              />
              <span className="text-gray-500 text-sm">Souvenez-vous de moi</span>
            </label>
            <a href="https://whatspay.africa/admin/forgotten_password" className="text-sm font-medium" style={{ color: "#1ba24b" }}>
              Mot de passe oublié?
            </a>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-lg text-sm mt-1 disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: "#1ba24b" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Connexion…
              </span>
            ) : "Connexion"}
          </button>
        </form>

        {/* Inscription */}
        <p className="text-center text-sm mt-5 text-gray-500">
          Pas inscrit(e)?{" "}
          <a href="https://whatspay.africa/admin/registration/diffuseur" className="font-medium" style={{ color: "#1ba24b" }}>
            Inscrivez vous
          </a>
        </p>
      </div>
    </div>
  );
}
