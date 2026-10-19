"use client";

import { useEffect, useState } from "react";
import ForceAppDownloadGate from "@/components/ForceAppDownloadGate";

const ANNONCEUR_WEB = "https://whatspay.africa/espace/login";

/**
 * Inscription et connexion des diffuseurs : UNIQUEMENT dans l'application (décision fondateur
 * 2026-10-19). Les pages web affichent l'écran de téléchargement ; ?web=1 garde un accès web de
 * secours (annonceurs et partenaires médias, qui ont aussi un espace sur ce site). Un diffuseur
 * qui passerait quand même est renvoyé vers l'app par (app)/layout.tsx.
 * Lien de parrainage /register?ref=CODE → /r/CODE (code copié pour l'inscription dans l'app).
 */
export default function AppOnlyAuthGate({ mode, children }: { mode: "login" | "register"; children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "gate" | "web">("loading");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ref = (p.get("ref") || p.get("ambassador_code") || "").trim();
    if (mode === "register" && ref) {
      window.location.replace(`/r/${encodeURIComponent(ref)}`);
      return;
    }
    setState(p.get("web") === "1" ? "web" : "gate");
  }, [mode]);

  if (state === "loading") return <div className="fixed inset-0 bg-white" />;
  if (state === "web") return <>{children}</>;

  return (
    <ForceAppDownloadGate
      autoRedirect={false}
      title={mode === "login" ? "Connecte-toi dans l'application" : "Inscris-toi dans l'application"}
      message={
        mode === "login" ? (
          <>La connexion à WhatsPAY se fait dans l&apos;application. Installe-la, puis connecte-toi avec ton email et ton mot de passe habituels : tu retrouves ton compte, tes missions et tes gains.</>
        ) : (
          <>L&apos;inscription à WhatsPAY se fait dans l&apos;application : c&apos;est gratuit et ça prend 2 minutes. Tu y recevras tes missions, tes notifications et tes paiements.</>
        )
      }
    >
      <a href={ANNONCEUR_WEB} className="underline">Tu es annonceur ? Accède à ton espace web</a>
      {mode === "login" && <a href="/login?web=1" className="underline">Partenaire média : connexion web</a>}
    </ForceAppDownloadGate>
  );
}
