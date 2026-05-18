"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Props {
  onboardingMissionId: string | null;
  onDone: () => void;
}

const STEPS = [
  {
    icon: (
      <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    badge: "Bienvenue 👋",
    title: "Tu vas gagner de l'argent sur WhatsApp",
    body: "WhatsPAY te paie pour partager des publicités sur ton statut WhatsApp. C'est simple, rapide, et tu es payé par vue.",
    cta: "J'ai compris",
  },
  {
    icon: (
      <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    badge: "Comment ça marche",
    title: "4 étapes, c'est tout",
    steps: [
      { num: "1", text: "Tu reçois une mission" },
      { num: "2", text: "Tu l'acceptes et tu partages sur ton statut WhatsApp" },
      { num: "3", text: "Tu reviens soumettre un screenshot avec le nombre de vues" },
      { num: "4", text: "Ton gain est crédité sur ton portefeuille" },
    ],
    cta: "J'ai compris",
  },
  {
    icon: (
      <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    badge: "Ta première mission ⭐",
    title: "Une mission de bienvenue t'attend",
    body: "On t'a préparé une mission d'onboarding pour que tu découvres le processus. Elle n'est pas rémunérée, mais elle est essentielle pour débloquer les vraies missions payantes.",
    cta: "Voir ma mission →",
  },
];

export default function OnboardingModal({ onboardingMissionId, onDone }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function handleCta() {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setLoading(true);
    try {
      await api.post("/onboarding/complete", {});
    } catch {}
    onDone();
    if (onboardingMissionId) {
      router.push(`/campagnes/${onboardingMissionId}`);
    } else {
      router.push("/campagnes");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full bg-white rounded-t-3xl overflow-hidden">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-5 pb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-green-600" : i < step ? "w-4 bg-green-300" : "w-4 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pt-4 pb-8">
          {/* Badge */}
          <span className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            {current.badge}
          </span>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            {current.icon}
          </div>

          {/* Title */}
          <h2 className="text-gray-900 text-xl font-bold text-center mb-3 leading-snug">
            {current.title}
          </h2>

          {/* Body or steps list */}
          {"steps" in current ? (
            <div className="space-y-3 mb-6">
              {current.steps.map((s) => (
                <div key={s.num} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {s.num}
                  </span>
                  <p className="text-gray-700 text-sm">{s.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm text-center leading-relaxed mb-6">
              {current.body}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={handleCta}
            disabled={loading}
            className="w-full py-4 bg-green-600 text-white font-semibold rounded-2xl text-sm shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {current.cta}
          </button>

          {/* Skip on first two steps */}
          {!isLast && (
            <button
              onClick={() => setStep(STEPS.length - 1)}
              className="w-full mt-3 text-gray-400 text-xs text-center py-1"
            >
              Passer l'introduction
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
