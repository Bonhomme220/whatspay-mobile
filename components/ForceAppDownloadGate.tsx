"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { openAppOrFallback } from "@/lib/appLink";

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
 * (app)/layout.tsx — décision founder : la PWA diffuseur n'est plus la destination finale.
 * Si l'app est déjà installée, on l'ouvre directement (whatspay:// — pas d'Universal Links
 * iOS configurés, donc pas d'autre mécanisme sur cette plateforme ; sur Android, les App
 * Links interceptent déjà la plupart des cas avant même que cette page charge) ; sinon, Play
 * Store / App Store selon l'appareil. Contrairement à pendingWhatsAppStep, il n'y a pas de
 * drapeau "fait" : il s'affiche à chaque connexion / chargement de l'espace, pas une seule fois.
 */
export default function ForceAppDownloadGate({
  title = "Passe sur l'application WhatsPAY",
  message,
  autoRedirect = true,
  children,
}: {
  title?: string;
  message?: React.ReactNode;
  /** false : pas de bascule automatique vers l'app / le store (laisse le temps de lire les liens secondaires). */
  autoRedirect?: boolean;
  /** Liens secondaires affichés sous les boutons (ex. espace annonceur). */
  children?: React.ReactNode;
} = {}) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const storeUrl = (p: Platform | null) => (p === "ios" ? APP_STORE_URL : PLAY_STORE_URL);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    if (!autoRedirect) return;
    if (p === "android") openAppOrFallback("", () => { window.location.href = PLAY_STORE_URL; });
    else if (p === "ios") openAppOrFallback("", () => { window.location.href = APP_STORE_URL; });
  }, [autoRedirect]);

  if (platform === null) return <div className="fixed inset-0 z-50 bg-white" />;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm">
        <Image src="/logo.png" alt="WhatsPAY" width={160} height={44} className="object-contain mb-10" />
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
          <span className="text-4xl">📱</span>
        </div>
        <h1 className="text-gray-800 text-xl font-bold mb-2">{title}</h1>
        <div className="text-gray-500 text-sm leading-relaxed">
          {message ?? (
            <>
              Le site web n&apos;est plus la meilleure façon d&apos;utiliser WhatsPAY. Télécharge l&apos;application
              pour continuer : notifications de nouvelles missions, paiements plus rapides, et accès à toutes
              les fonctionnalités.
            </>
          )}
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {!autoRedirect && platform !== "other" && (
          <button
            type="button"
            onClick={() => openAppOrFallback("", () => { window.location.href = storeUrl(platform); })}
            className="w-full py-4 rounded-2xl font-bold text-sm text-center border-2"
            style={{ borderColor: "#16a34a", color: "#16a34a" }}
          >
            J&apos;ai déjà l&apos;application : l&apos;ouvrir
          </button>
        )}
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
        {children && <div className="pt-2 flex flex-col items-center gap-2 text-xs text-gray-400 text-center">{children}</div>}
      </div>
    </div>
  );
}
