"use client";

import Link from "next/link";

/**
 * Bandeau non-dismissible affiché quand profile_needs_review = true.
 * Redirige vers /profil?review=1 pour ouvrir automatiquement l'EditSheet.
 * Disparaît quand l'utilisateur sauvegarde son profil (le backend remet le flag à false,
 * et l'AppContext recharge au prochain montage).
 */
export default function ProfileReviewBanner() {
  return (
    <div className="bg-orange-500 text-white px-4 py-3 flex items-start gap-3">
      {/* Icône */}
      <div className="flex-shrink-0 mt-0.5">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>

      {/* Texte + CTA */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">
          Mets à jour tes centres d'intérêt&nbsp;!
        </p>
        <p className="text-orange-100 text-xs mt-0.5 leading-snug">
          Nos catégories ont été enrichies. Reconfirme tes 4 centres d'intérêt et ta profession
          pour continuer à recevoir des campagnes personnalisées.
        </p>
        <Link
          href="/profil?review=1"
          className="inline-flex items-center gap-1 mt-2 text-xs font-bold bg-white text-orange-600 px-3 py-1.5 rounded-full"
        >
          Mettre à jour
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
