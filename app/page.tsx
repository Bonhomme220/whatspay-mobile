"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { tokenStore, userStore, homeRouteForProfil } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  // Si déjà connecté → espace correspondant au rôle
  useEffect(() => {
    if (tokenStore.get()) router.replace(homeRouteForProfil(userStore.get()?.profil));
  }, [router]);

  return (
    <div className="min-h-screen bg-white">

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <Image src="/logo.png" alt="WhatsPAY" width={120} height={34} className="object-contain h-8 w-auto" />
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm font-semibold text-gray-600 px-3 py-1.5">
            Connexion
          </Link>
          <Link href="/register" className="text-sm font-bold bg-green-600 text-white px-4 py-1.5 rounded-lg">
            S'inscrire
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-green-700 to-green-500 px-5 pt-10 pb-14 relative overflow-hidden">
        {/* grain */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")"}}/>
        <div className="relative z-10">
          <div className="inline-flex items-center bg-white/20 rounded-full px-3 py-1 mb-5">
            <span className="w-2 h-2 bg-green-200 rounded-full mr-2 animate-pulse" />
            <span className="text-xs font-semibold text-green-50">+12 000 diffuseurs actifs au Bénin, Togo &amp; Afrique de l'Ouest</span>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-3">
            Gagne de l'argent avec tes{" "}
            <span className="text-green-200">Status WhatsApp</span>
          </h1>
          <p className="text-green-100 text-base mb-7 leading-relaxed">
            Publie des publicités sur ton statut WhatsApp et reçois ton argent directement sur Mobile Money. Inscription gratuite.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/register"
              className="bg-white text-green-700 font-bold text-center py-3.5 rounded-xl shadow-lg text-base">
              Je m'inscris gratuitement →
            </Link>
            <Link href="/login"
              className="border-2 border-white/60 text-white font-semibold text-center py-3 rounded-xl text-base">
              J'ai déjà un compte
            </Link>
          </div>
          <div className="flex items-center gap-4 mt-5 text-green-100 text-xs flex-wrap">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              Inscription gratuite
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              Paiement Mobile Money
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              Sans abonnement
            </span>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section className="px-5 py-12 bg-white">
        <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2">Comment ça marche</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-8">3 étapes simples</h2>
        <div className="space-y-5">
          {[
            { n: "1", ico: "📲", title: "Inscris-toi gratuitement", desc: "Crée ton profil en 2 minutes. Aucun frais, aucun abonnement." },
            { n: "2", ico: "📸", title: "Publie sur ton Status", desc: "Reçois une pub, mets-la sur ton Status WhatsApp 24h et prends une capture d'écran." },
            { n: "3", ico: "💸", title: "Reçois ton argent", desc: "Soumets ta capture, on vérifie et tu reçois ton paiement sur Mobile Money." },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center text-xl flex-shrink-0">{s.ico}</div>
              <div>
                <p className="font-bold text-gray-900 text-sm mb-0.5">{s.title}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── GAINS ── */}
      <section className="px-5 py-12 bg-gray-50">
        <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2">Tes revenus</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Combien tu peux gagner ?</h2>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Formule</p>
          <div className="flex items-center gap-2 flex-wrap font-mono text-sm">
            <span className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-green-800 font-bold">1 F de base</span>
            <span className="text-gray-400">+</span>
            <span className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-green-800 font-bold">0,01 F × filleuls actifs</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Exemple concret :</p>
          <div className="space-y-2 text-sm">
            {[
              ["Missions ce mois", "10"],
              ["Vues par mission", "150 vues"],
              ["Gain par vue", "1 F"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">{l}</span>
                <span className="font-bold text-gray-900 font-mono">{v}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2.5 px-3 bg-green-50 rounded-lg border border-green-200 mt-1">
              <span className="text-green-800 font-semibold">Revenus du mois</span>
              <span className="font-bold text-green-700 text-lg font-mono">1 500 F</span>
            </div>
          </div>
        </div>

        {/* Mobile Money */}
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-600 mb-3">Paiement via Mobile Money</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center bg-yellow-50 border border-yellow-200 rounded-xl py-3">
              <span className="text-xs font-bold text-yellow-800">MTN</span>
              <span className="text-[10px] text-yellow-600">MoMo</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-blue-50 border border-blue-200 rounded-xl py-3">
              <span className="text-xs font-bold text-blue-800">Moov</span>
              <span className="text-[10px] text-blue-600">Money</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-green-50 border border-green-200 rounded-xl py-3">
              <span className="text-xs font-bold text-green-800">Wave</span>
              <span className="text-[10px] text-green-600">Transfer</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── AMBASSADEUR ── */}
      <section className="px-5 py-12 bg-green-600">
        <p className="text-xs font-bold uppercase tracking-widest text-green-200 mb-2">⭐ Programme Ambassadeur</p>
        <h2 className="text-2xl font-bold text-white mb-3">Parraine et gagne encore plus</h2>
        <p className="text-green-100 text-sm mb-6 leading-relaxed">
          Pour chaque filleul actif que tu parraines, ton gain par vue augmente de +0,01 F. Sans plafond.
        </p>
        <div className="bg-white/10 rounded-2xl p-5 text-center">
          <p className="text-green-100 text-xs mb-2">Exemple avec 50 filleuls actifs :</p>
          <p className="text-white font-mono font-bold text-base">
            1 F + (50 × 0,01 F) = <span className="text-yellow-300 text-2xl">1,50 F</span> / vue
          </p>
          <p className="text-green-200 text-xs mt-1">Soit +50 % de revenus sur toutes tes missions</p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-5 py-12 bg-white text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Prêt à commencer ?</h2>
        <p className="text-gray-500 text-sm mb-7 leading-relaxed">
          Rejoins les 12 000 diffuseurs qui gagnent de l'argent chaque semaine grâce à leurs Status WhatsApp.
        </p>
        <Link href="/register"
          className="block bg-green-600 text-white font-bold py-4 rounded-xl text-base mb-3">
          Rejoindre WhatsPAY gratuitement →
        </Link>
        <Link href="/login" className="block text-sm text-gray-500 py-2">
          J'ai déjà un compte — Se connecter
        </Link>
        <p className="mt-8 text-xs text-gray-400">
          Vous êtes annonceur ?{" "}
          <a href="https://whatspay.africa" className="text-green-600 font-medium">
            Découvrir la plateforme annonceur →
          </a>
        </p>
      </section>

    </div>
  );
}
