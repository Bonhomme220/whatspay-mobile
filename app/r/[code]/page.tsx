"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { openAppOrFallback } from "@/lib/appLink";

const PLAY_STORE_BASE = "https://play.google.com/store/apps/details?id=com.whatspay.native";
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
 * Lien de parrainage court (app.whatspay.africa/r/CODE, partagé depuis la page Ambassadeur).
 *
 * Si l'app est déjà installée : ouverte directement (whatspay://r/CODE — pas d'Universal Links
 * iOS configurés, donc pas d'autre mécanisme sur cette plateforme ; sur Android, les App Links
 * interceptent déjà la plupart des cas avant même que cette page charge). Sinon : store, avec
 * le code mémorisé (presse-papiers — pas d'Install Referrer Android ni de SDK tiers type
 * Branch/AppsFlyer) pour pré-remplissage à l'inscription après installation.
 *
 * L'écriture presse-papiers doit se faire dans le geste de clic (Safari la refuse sinon) :
 * pas de redirection auto, on exige un tap.
 */
export default function ReferralPage() {
  const params = useParams();
  const router = useRouter();
  const code = String(params.code ?? "").trim().toUpperCase();
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  async function go() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Presse-papiers indisponible (permission refusée, contexte non sécurisé…) — on continue
      // quand même : le code reste pré-remplissable manuellement, l'inscription n'est jamais bloquée.
    }

    const toStoreOrWeb = () => {
      if (platform === "android") {
        window.location.href = `${PLAY_STORE_BASE}&referrer=${encodeURIComponent(`ambassador_code=${code}`)}`;
      } else if (platform === "ios") {
        window.location.href = APP_STORE_URL;
      } else {
        router.push(`/register?ref=${encodeURIComponent(code)}`);
      }
    };

    if (platform === "other") {
      toStoreOrWeb();
      return;
    }
    openAppOrFallback(`r/${encodeURIComponent(code)}`, toStoreOrWeb);
  }

  if (platform === null) {
    return <div className="fixed inset-0 bg-white" />;
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-between px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm">
        <Image src="/logo.png" alt="WhatsPAY" width={160} height={44} className="object-contain mb-10" />
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
          <span className="text-4xl">🎁</span>
        </div>
        <h1 className="text-gray-800 text-xl font-bold mb-2">Tu es invité(e) sur WhatsPAY</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Installe l&apos;application pour monétiser tes Status WhatsApp. Ton code ambassadeur{" "}
          <strong className="text-gray-700">{code}</strong> sera pré-rempli automatiquement à l&apos;inscription.
        </p>
      </div>

      <button
        onClick={go}
        className="w-full max-w-sm py-4 rounded-2xl text-white font-bold text-sm"
        style={{ backgroundColor: "#16a34a" }}
      >
        {platform === "other" ? "Continuer" : "Télécharger l'application"}
      </button>
    </div>
  );
}
