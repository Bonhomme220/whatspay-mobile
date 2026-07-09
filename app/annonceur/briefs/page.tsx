"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { fmtDate, briefStatusMeta, type Brief } from "@/lib/annonceur";

export default function BriefsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ briefs: Brief[] }>("/briefs")
      .then((r) => setBriefs(r.briefs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-24">
      <div className="px-4 pt-5">
        <h1 className="text-xl font-bold text-gray-900">Mes briefs</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Décrivez votre besoin, l&apos;équipe WhatsPay conçoit la campagne pour vous.
        </p>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading && <div className="bg-white rounded-xl border border-gray-100 p-4 text-sm text-gray-400">Chargement…</div>}
        {!loading && briefs.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-3">💡</div>
            <p className="text-sm text-gray-500 mb-4">Aucun brief pour le moment.</p>
            <Link href="/annonceur/briefs/nouveau" className="inline-block bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
              Créer un brief
            </Link>
          </div>
        )}
        {briefs.map((b) => {
          const st = briefStatusMeta(b.status);
          return (
            <Link key={b.id} href={`/annonceur/briefs/${b.id}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-900 text-sm truncate">{b.name}</p>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{b.objective_label}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                <span>{b.media.length} visuel(s)</span>
                <span>·</span>
                <span>{fmtDate(b.created_at)}</span>
              </div>
              {b.status === "rejected" && b.admin_note && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1.5">{b.admin_note}</p>
              )}
            </Link>
          );
        })}
      </div>

      <Link href="/annonceur/briefs/nouveau"
        className="fixed bottom-20 right-4 z-30 flex items-center gap-2 bg-green-600 text-white font-bold pl-4 pr-5 py-3 rounded-full shadow-lg">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 4v16m8-8H4" />
        </svg>
        Nouveau
      </Link>
    </div>
  );
}
