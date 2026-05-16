"use client";

import { useEffect, useState } from "react";

type Mode = "android" | "ios" | null;

export default function PwaInstallBanner() {
  const [mode, setMode]           = useState<Mode>(null);
  const [deferredPrompt, setDeferred] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Déjà installé → ne rien afficher
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((window.navigator as any).standalone === true) return;

    const ua = navigator.userAgent;
    const isIos     = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);

    // Ne pas re-afficher si l'utilisateur a fermé dans cette session
    if (sessionStorage.getItem("pwa-banner-dismissed")) return;

    if (isIos) {
      setMode("ios");
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
      if (isAndroid) setMode("android");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    sessionStorage.setItem("pwa-banner-dismissed", "1");
    setDismissed(true);
  }

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDismissed(true);
    setDeferred(null);
  }

  if (!mode || dismissed) return null;

  return (
    <div className="mx-3 mt-2 mb-1 rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-start gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center mt-0.5">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 text-sm font-semibold leading-tight">Installer WhatsPAY</p>
        {mode === "android" ? (
          <p className="text-gray-500 text-xs mt-0.5">Accédez rapidement depuis votre écran d'accueil.</p>
        ) : (
          <p className="text-gray-500 text-xs mt-0.5">
            Appuyez sur <strong>Partager ⬆</strong> → <strong>"Sur l'écran d'accueil"</strong>
          </p>
        )}
        {mode === "android" && (
          <button
            onClick={install}
            className="mt-2 text-xs font-semibold text-white bg-green-600 px-3 py-1.5 rounded-lg"
          >
            Installer
          </button>
        )}
      </div>
      <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
