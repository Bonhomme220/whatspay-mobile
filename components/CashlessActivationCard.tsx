"use client";

import { useState } from "react";

export interface CashlessDownload { web: string; android: string; ios: string }

/** Lien de téléchargement adapté au téléphone (Play Store / App Store, sinon le site Cashless). */
export function cashlessStoreUrl(d?: CashlessDownload | null, fallback?: string): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (d) {
    if (/android/i.test(ua)) return d.android || d.web;
    if (/iphone|ipad|ipod/i.test(ua)) return d.ios || d.web;
    return d.web;
  }
  return fallback || "https://cashless.africa";
}

/**
 * Guide d'activation du portefeuille Cashless (déjà créé par WhatsPAY) : étapes illustrées avec
 * l'email et le numéro du diffuseur, qui sont ses identifiants Cashless (connexion par code).
 */
export default function CashlessActivationCard({
  email, phone, download, downloadUrl, compact = false,
}: {
  email?: string | null;
  phone?: string | null;
  download?: CashlessDownload | null;
  downloadUrl?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact);
  const url = cashlessStoreUrl(download, downloadUrl);

  const steps: { title: string; text: React.ReactNode }[] = [
    { title: "Installe l'application Cashless", text: "Sur le Play Store, l'App Store ou cashless.africa (bouton ci-dessous)." },
    { title: "Ouvre-la et appuie sur « Se connecter »", text: "Pas besoin de créer de compte : WhatsPAY l'a déjà créé pour toi." },
    {
      title: "Saisis ton email ou ton numéro WhatsPAY",
      text: (
        <>
          {email && <span className="block">Email : <strong className="text-gray-800 break-all">{email}</strong></span>}
          {phone && <span className="block">ou numéro : <strong className="text-gray-800">{phone}</strong></span>}
        </>
      ),
    },
    { title: "Entre le code reçu", text: "Par email ou par SMS. Aucun mot de passe à retenir : un code t'est envoyé à chaque connexion." },
    { title: "C'est activé ✅", text: "Tu reçois une notification, et tu peux choisir Cashless à ton prochain retrait." },
  ];

  return (
    <div className="rounded-2xl border border-green-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-green-50 px-4 py-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-green-800 font-bold text-sm">Active ton portefeuille Cashless 💸</p>
          <p className="text-green-700 text-xs mt-0.5">Tes retraits arrivent en quelques secondes, au lieu de plusieurs jours.</p>
        </div>
        {compact && (
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-green-700 text-xs font-semibold shrink-0">
            {open ? "Masquer" : "Comment faire ?"}
          </button>
        )}
      </div>
      {open && (
        <div className="px-4 py-3 space-y-3">
          <ol className="space-y-2.5">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-gray-800 text-sm font-semibold leading-snug">{s.title}</p>
                  <div className="text-gray-500 text-xs leading-relaxed mt-0.5">{s.text}</div>
                </div>
              </li>
            ))}
          </ol>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="block w-full py-3 text-center bg-green-600 text-white font-semibold rounded-xl text-sm">
            Télécharger l&apos;application Cashless
          </a>
          <p className="text-gray-400 text-[11px] text-center">Un souci ? Écris-nous depuis « Support », on t&apos;aide.</p>
        </div>
      )}
    </div>
  );
}
