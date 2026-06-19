"use client";

import Link from "next/link";

export default function IncompleteProfileBanner() {
  return (
    <div className="mx-4 mt-3">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-amber-900 font-semibold text-sm">Profil incomplet</p>
          <p className="text-amber-700 text-xs mt-0.5 leading-snug">
            Des informations manquent dans votre profil. Complétez-les pour recevoir plus de campagnes.
          </p>
          <Link
            href="/profil"
            className="inline-block mt-2 text-xs font-semibold text-white px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "#d97706" }}
          >
            Compléter mon profil →
          </Link>
        </div>
      </div>
    </div>
  );
}
