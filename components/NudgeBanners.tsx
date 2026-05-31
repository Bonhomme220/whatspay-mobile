"use client";

import Link from "next/link";
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
function typeColors(type: string): {
  bg: string; border: string; icon: string; badge: string; cta: string;
} {
  switch (type) {
    case "critical":
      return { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500", badge: "bg-red-100 text-red-700", cta: "bg-red-600 text-white" };
    case "high":
      return { bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-500", badge: "bg-orange-100 text-orange-700", cta: "bg-orange-500 text-white" };
    case "ambassador":
      return { bg: "bg-yellow-50", border: "border-yellow-200", icon: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700", cta: "bg-yellow-500 text-white" };
    default: // normal
      return { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-500", badge: "bg-blue-100 text-blue-700", cta: "bg-blue-500 text-white" };
  }
}

function typeIcon(type: string) {
  const cls = "w-5 h-5";
  switch (type) {
    case "critical":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      );
    case "high":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    case "ambassador":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

// ── Banner card ───────────────────────────────────────────────────────────────
function BannerCard({ nudge, onDismiss }: { nudge: Nudge; onDismiss: () => void }) {
  const c = typeColors(nudge.type);

  return (
    <div className={`rounded-2xl border p-4 ${c.bg} ${c.border}`}>
      <div className="flex items-start gap-3">
        {/* Icône */}
        <span className={`flex-shrink-0 mt-0.5 ${c.icon}`}>
          {typeIcon(nudge.type)}
        </span>

        {/* Texte */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 text-sm font-semibold leading-snug">{nudge.title}</p>
          <p className="text-gray-600 text-xs mt-1 leading-relaxed">{nudge.message}</p>

          {nudge.cta && (
            <Link
              href={ctaHref(nudge.cta)}
              className={`inline-block mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold ${c.cta}`}
            >
              {nudge.cta.label} →
            </Link>
          )}
        </div>

        {/* Bouton dismiss */}
        {nudge.dismissible && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-white/60 flex items-center justify-center text-gray-400"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
interface Props {
  banners: Nudge[];
  onDismiss: (id: string) => void;
}

export default function NudgeBanners({ banners, onDismiss }: Props) {
  if (banners.length === 0) return null;

  return (
    <div className="mx-4 mt-4 space-y-3">
      {banners.map((b) => (
        <BannerCard key={b.id} nudge={b} onDismiss={() => onDismiss(b.id)} />
      ))}
    </div>
  );
}
