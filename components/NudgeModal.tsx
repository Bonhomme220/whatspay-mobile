"use client";

import { useRouter } from "next/navigation";
import { type Nudge, type NudgeCta } from "@/contexts/AppContext";

// ── Mapping screen → route Next.js ────────────────────────────────────────────
function ctaHref(cta: NudgeCta): string {
  switch (cta.screen) {
    case "missions":       return "/campagnes";
    case "mission_detail": return `/campagnes/${cta.params?.id ?? ""}`;
    case "wallet":         return "/gains";
    case "ambassador":     return "/ambassadeur";
    case "faq":            return "/faq";
    case "complaints":     return "/reclamations";
    default:               return "/dashboard";
  }
}

// ── Couleurs par type ─────────────────────────────────────────────────────────
function typeStyle(type: string): { bar: string; badge: string; btn: string } {
  switch (type) {
    case "critical":
      return { bar: "bg-red-600", badge: "bg-red-50 text-red-700", btn: "bg-red-600 hover:bg-red-700" };
    case "onboarding":
      return { bar: "bg-green-600", badge: "bg-green-50 text-green-700", btn: "bg-green-600 hover:bg-green-700" };
    case "high":
      return { bar: "bg-orange-500", badge: "bg-orange-50 text-orange-700", btn: "bg-orange-500 hover:bg-orange-600" };
    case "ambassador":
      return { bar: "bg-yellow-500", badge: "bg-yellow-50 text-yellow-700", btn: "bg-yellow-500 hover:bg-yellow-600" };
    default:
      return { bar: "bg-blue-500", badge: "bg-blue-50 text-blue-700", btn: "bg-blue-500 hover:bg-blue-600" };
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case "critical":   return "⚡ Urgent";
    case "onboarding": return "👋 Bienvenue";
    case "high":       return "🔔 Important";
    case "ambassador": return "🤝 Ambassadeur";
    default:           return "ℹ️ Info";
  }
}

// ── Composant ─────────────────────────────────────────────────────────────────
interface Props {
  nudge: Nudge;
  onDismiss: () => void;
}

export default function NudgeModal({ nudge, onDismiss }: Props) {
  const router = useRouter();
  const s = typeStyle(nudge.type);

  function handleCta() {
    if (nudge.cta) {
      router.push(ctaHref(nudge.cta));
    }
    // On ferme le modal côté UI après le CTA (même si non dismissible,
    // le CTA = action réalisée → on efface l'affichage pour cette session)
    onDismiss();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.55)" }}>
      {/* Tap outside — ferme seulement si dismissible */}
      <div
        className="absolute inset-0"
        onClick={() => { if (nudge.dismissible) onDismiss(); }}
      />

      <div className="relative w-full bg-white rounded-t-3xl overflow-hidden shadow-2xl">

        {/* Barre colorée top */}
        <div className={`h-1.5 w-full ${s.bar}`} />

        {/* Bouton X (seulement si dismissible) */}
        {nudge.dismissible && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Contenu */}
        <div className="px-6 pt-5 pb-8">
          {/* Badge type */}
          <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${s.badge}`}>
            {typeLabel(nudge.type)}
          </span>

          {/* Titre */}
          <h2 className="text-gray-900 text-xl font-bold leading-snug mb-3">
            {nudge.title}
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            {nudge.message}
          </p>

          {/* CTA */}
          {nudge.cta ? (
            <button
              onClick={handleCta}
              className={`w-full py-4 text-white font-semibold rounded-2xl text-sm shadow-md transition-colors ${s.btn}`}
            >
              {nudge.cta.label}
            </button>
          ) : nudge.dismissible ? (
            <button
              onClick={onDismiss}
              className="w-full py-4 bg-gray-100 text-gray-600 font-semibold rounded-2xl text-sm"
            >
              J'ai compris
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
