"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface AmbassadorData {
  is_ambassador: boolean;
  ambassador_code: string | null;
  gain_per_view: number;
  is_eligible: boolean;
  stat: { active_referrals: number; total_referrals: number } | null;
  referrals: { id: string; name: string; joined_at: string; missions: number }[];
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function AmbassadeurPage() {
  const router = useRouter();
  const [data, setData]     = useState<AmbassadorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AmbassadorData>("/ambassador")
      .then(setData)
      .catch((e) => { if (e?.status === 401) router.push("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className={`px-5 pt-5 pb-14 ${data.is_ambassador ? "bg-yellow-500" : "bg-green-600"}`}>
        <h1 className="text-white text-2xl font-bold">Programme Ambassadeur</h1>
        <p className="text-white/80 text-sm mt-0.5">
          {data.is_ambassador ? "Vous êtes ambassadeur WhatsPAY ★" : "Parrainez et gagnez plus"}
        </p>

        {data.is_ambassador && data.stat && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="text-white font-bold text-lg">{data.stat.active_referrals}</div>
              <div className="text-white/70 text-[10px] mt-0.5">Filleuls actifs</div>
            </div>
            <div className="py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="text-white font-bold text-lg">{data.stat.total_referrals}</div>
              <div className="text-white/70 text-[10px] mt-0.5">Total filleuls</div>
            </div>
            <div className="py-2.5 px-3 rounded-xl col-span-2" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="text-white font-bold text-lg">{data.gain_per_view.toFixed(2)} F / vue</div>
              <div className="text-white/70 text-[10px] mt-0.5">Votre taux de gain actuel</div>
            </div>
          </div>
        )}
      </div>

      <div className="mx-4 -mt-6 pb-10 space-y-4">

        {/* Code parrainage */}
        {data.is_ambassador && data.ambassador_code && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Mon code de parrainage</p>
            <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
              <span className="text-yellow-800 font-bold text-xl tracking-widest">{data.ambassador_code}</span>
              <button
                onClick={() => navigator.clipboard?.writeText(data.ambassador_code!)}
                className="ml-3 text-yellow-600 p-1.5 rounded-lg bg-yellow-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-2">Partagez ce code à vos contacts pour qu'ils s'inscrivent sur WhatsPAY.</p>
          </div>
        )}

        {/* Comment ça marche */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Comment ça marche</p>
          <div className="space-y-3">
            {[
              { step: "1", text: "Partagez votre code de parrainage à vos contacts." },
              { step: "2", text: "Ils s'inscrivent sur WhatsPAY avec votre code et participent à des campagnes." },
              { step: "3", text: "Pour chaque filleul actif, votre gain par vue augmente de +0,01 F." },
              { step: "4", text: "Plus vous avez de filleuls actifs, plus vous gagnez sur chaque campagne !" },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {s.step}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Éligibilité si pas encore ambassadeur */}
        {!data.is_ambassador && (
          <div className={`rounded-2xl p-4 ${data.is_eligible ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              <svg className={`w-5 h-5 ${data.is_eligible ? "text-green-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={data.is_eligible ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"} />
              </svg>
              <p className={`text-sm font-semibold ${data.is_eligible ? "text-green-700" : "text-gray-600"}`}>
                {data.is_eligible ? "Vous êtes éligible au programme !" : "Pas encore éligible"}
              </p>
            </div>
            <p className={`text-xs leading-relaxed ${data.is_eligible ? "text-green-600" : "text-gray-500"}`}>
              {data.is_eligible
                ? "Vous avez atteint 1 000 F de retraits validés. Contactez-nous via un ticket pour activer votre statut ambassadeur."
                : "Pour devenir ambassadeur, vous devez avoir effectué au moins 1 000 F de retraits validés sur WhatsPAY."}
            </p>
          </div>
        )}

        {/* Liste filleuls */}
        {data.is_ambassador && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">
              Mes filleuls ({data.referrals.length})
            </p>
            {data.referrals.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Aucun filleul pour l'instant.</p>
            ) : (
              <div className="space-y-2">
                {data.referrals.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-gray-700 text-sm font-medium">{r.name}</p>
                      <p className="text-gray-400 text-[10px]">Inscrit le {fmtDate(r.joined_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-700 text-sm font-bold">{r.missions}</p>
                      <p className="text-gray-400 text-[10px]">missions</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
