"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.whatspay.native";
const APP_STORE_URL = "https://apps.apple.com/us/app/whatspay/id6810247452";

type Platform = "android" | "ios" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "other";
}

/**
 * Gate bloquant, sans échappatoire, rendu en priorité absolue sur TOUT l'espace diffuseur
 * (app)/layout.tsx — décision founder : la PWA diffuseur n'est plus la destination finale,
 * on renvoie systématiquement vers l'app native (Play Store / App Store selon l'appareil).
 * Contrairement à pendingWhatsAppStep, il n'y a pas de drapeau "fait" : il s'affiche à chaque
 * connexion / chargement de l'espace, pas une seule fois.
 */
export default function ForceAppDownloadGate() {
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    if (p === "android") window.location.href = PLAY_STORE_URL;
    else if (p === "ios") window.location.href = APP_STORE_URL;
  }, []);

  if (platform === null) return <div className="fixed inset-0 z-50 bg-white" />;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm">
        <Image src="/logo.png" alt="WhatsPAY" width={160} height={44} className="object-contain mb-10" />
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
          <span className="text-4xl">📱</span>
        </div>
        <h1 className="text-gray-800 text-xl font-bold mb-2">Passe sur l&apos;application WhatsPAY</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Le site web n&apos;est plus la meilleure façon d&apos;utiliser WhatsPAY. Télécharge l&apos;application
          pour continuer : notifications de nouvelles missions, paiements plus rapides, et accès à toutes
          les fonctionnalités.
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {platform !== "ios" && (
          <a
            href={PLAY_STORE_URL}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm text-center"
            style={{ backgroundColor: "#16a34a" }}
          >
            Télécharger sur Google Play
          </a>
        )}
        {platform !== "android" && (
          <a
            href={APP_STORE_URL}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm text-center"
            style={{ backgroundColor: platform === "ios" ? "#16a34a" : "#111827" }}
          >
            Télécharger sur l&apos;App Store
          </a>
        )}
      </div>
    </div>
  );
}
