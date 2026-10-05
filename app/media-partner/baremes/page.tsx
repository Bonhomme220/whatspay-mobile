"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Tier {
  id: string;
  label: string;
  min_reach: number;
  max_reach: number | null;
  flat_price: number;
  click_bonus_rate: number;
}
interface CurrentTier { id?: string; label: string; flat_price: number; }
interface ProfileLite { current_tier: CurrentTier | null; reached_accounts_30d: number; }

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MediaPartnerBaremesPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<Tier[]>("/media-partner-tiers"),
      api.get<ProfileLite>("/media-partner/profile").catch(() => null),
    ])
      .then(([t, p]) => {
        setTiers(t);
        setProfile(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentId = profile?.current_tier?.id;
  const currentLabel = profile?.current_tier?.label;

  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      {/* ── Hero ── */}
      <div className="bg-green-600 px-5 pt-5 pb-10">
        <h1 className="text-white text-2xl font-bold">Barème des paliers</h1>
        <p className="text-green-100 text-sm mt-1">
          Votre rémunération dépend du nombre de comptes touchés déclarés sur 30 jours (palier) : un prix fixe par mission, plus un bonus au clic.
        </p>
      </div>

      <div className="mx-4 -mt-5 space-y-3">
        {tiers.map((t) => {
          const isCurrent = currentId ? t.id === currentId : t.label === currentLabel;
          return (
            <div
              key={t.id}
              className={`bg-white rounded-2xl shadow-sm p-4 border-2 ${
                isCurrent ? "border-green-500" : "border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-gray-800 font-semibold">{t.label}</h2>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Votre palier
                    </span>
                  )}
                </div>
                <span className="text-green-600 font-bold">{fmt(t.flat_price)} F</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                {t.max_reach ? `${fmt(t.min_reach)} à ${fmt(t.max_reach)} comptes touchés / 30j` : `${fmt(t.min_reach)}+ comptes touchés / 30j`}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                <span>+</span>
                <span className="font-semibold text-gray-700">{t.click_bonus_rate} F</span>
                <span>par clic généré sur le lien de suivi</span>
              </div>
            </div>
          );
        })}

        {tiers.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center text-gray-400 text-sm">
            Aucun palier disponible pour le moment.
          </div>
        )}
      </div>

      <div className="mx-4 mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <p className="text-amber-800 text-xs">
          Votre palier est recalculé à chaque validation de votre{" "}
          <Link href="/media-partner/recapture" className="font-semibold underline">
            recapture mensuelle
          </Link>
          , en fonction des comptes touchés que vous déclarez.
        </p>
      </div>
    </div>
  );
}
