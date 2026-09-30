"use client";

import Link from "next/link";
import Image from "next/image";

// ── Page ──────────────────────────────────────────────────────────────────────
// Écran d'aiguillage avant inscription : diffuseur individuel (parcours existant,
// inchangé) vs partenaire média (gestionnaire de chaîne WhatsApp, nouveau parcours).
export default function RegisterChoicePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "url('/login-bg.jpg') center/cover no-repeat fixed" }}
    >
      <div className="w-full max-w-sm rounded-xl bg-white px-7 py-8 shadow-[0_0_37px_rgba(8,21,66,0.05)]">
        <div className="flex justify-center mb-5">
          <Image src="/logo.png" alt="WhatsPAY" width={140} height={44} className="object-contain" />
        </div>

        <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-6">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-700 text-sm font-semibold">L'inscription est 100% gratuite</p>
        </div>

        <h3 className="text-gray-800 text-lg font-semibold mb-0.5 text-center">Comment souhaitez-vous vous inscrire ?</h3>
        <p className="text-gray-500 text-sm mb-6 text-center">Choisissez le profil qui vous correspond</p>

        <div className="space-y-3">
          <Link
            href="/register"
            className="block w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-left transition hover:border-green-400"
            style={{ backgroundColor: "rgba(43,94,94,0.06)" }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-800 text-sm font-semibold">Je suis un diffuseur individuel</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                  Je publie des statuts WhatsApp sur mon compte personnel et je gagne de l&apos;argent à chaque vue.
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/register-media-partner"
            className="block w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-left transition hover:border-green-400"
            style={{ backgroundColor: "rgba(43,94,94,0.06)" }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-800 text-sm font-semibold">Je gère une chaîne WhatsApp</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                  Je gère une chaîne (média, marque, communauté...) et je souhaite diffuser du contenu sponsorisé.
                </p>
              </div>
            </div>
          </Link>
        </div>

        <p className="text-center text-sm mt-6 text-gray-500">
          Déjà inscrit ?{" "}
          <a href="/login" className="font-medium" style={{ color: "#1ba24b" }}>
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}
