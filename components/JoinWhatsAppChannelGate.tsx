"use client";

import Image from "next/image";

const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029VbDB5VyISTkL0OHcht2n";

/**
 * Étape obligatoire juste après l'inscription diffuseur : rendue en priorité absolue par
 * (app)/layout.tsx, remplace TOUT l'écran (pas de header, pas de nav, pas de bouton retour).
 * Le seul moyen d'avancer est de taper le bouton, qui ouvre le canal WhatsApp ET débloque le
 * reste de l'app dans le même geste — on ne peut pas vérifier techniquement l'adhésion
 * réelle (pas d'API WhatsApp pour ça), donc "forcer" ici veut dire forcer le passage par
 * l'écran, pas une preuve d'adhésion. Décision founder 2026-10-02.
 */
export default function JoinWhatsAppChannelGate({ onDone }: { onDone: () => void }) {
  function join() {
    window.open(WHATSAPP_CHANNEL_URL, "_blank", "noopener,noreferrer");
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm">
        <Image src="/logo.png" alt="WhatsPAY" width={160} height={44} className="object-contain mb-10" />
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
          <span className="text-4xl">📢</span>
        </div>
        <h1 className="text-gray-800 text-xl font-bold mb-2">Rejoins notre canal WhatsApp</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Dernière étape avant d&apos;accéder à ton compte : rejoins le canal officiel WhatsPAY pour recevoir les
          astuces, nouveautés et campagnes en avant-première.
        </p>
      </div>

      <button
        onClick={join}
        className="w-full max-w-sm py-4 rounded-2xl text-white font-bold text-sm"
        style={{ backgroundColor: "#25D366" }}
      >
        Rejoindre le canal WhatsApp
      </button>
    </div>
  );
}
