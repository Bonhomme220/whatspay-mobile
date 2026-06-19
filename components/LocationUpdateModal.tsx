"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Ref { id: string; name: string; }

interface Props {
  localityId: string;
  onDone: () => void;
}

export default function LocationUpdateModal({ localityId, onDone }: Props) {
  const [arrondissements, setArrondissements] = useState<Ref[]>([]);
  const [quartiers,       setQuartiers]       = useState<Ref[]>([]);
  const [arrId,  setArrId]  = useState("");
  const [qtId,   setQtId]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Charger les arrondissements de la localité du diffuseur
  useEffect(() => {
    if (!localityId) return;
    api.get<{ data: Ref[] }>(`/localities/${localityId}/arrondissements`)
      .then((r) => {
        const data = r.data ?? [];
        if (data.length === 0) {
          // Pas d'arrondissements pour cette localité (Togo, CI…) → on skip le modal
          onDone();
        } else {
          setArrondissements(data);
        }
      })
      .catch(() => onDone()); // En cas d'erreur réseau, on ne bloque pas l'utilisateur
  }, [localityId]);

  // Charger les quartiers dès qu'un arrondissement est sélectionné
  useEffect(() => {
    if (!arrId) { setQuartiers([]); setQtId(""); return; }
    api.get<{ data: Ref[] }>(`/arrondissements/${arrId}/quartiers`)
      .then((r) => setQuartiers(r.data ?? []))
      .catch(() => setQuartiers([]));
    setQtId("");
  }, [arrId]);

  async function save() {
    if (!arrId || !qtId) { setError("Veuillez sélectionner votre arrondissement et votre quartier."); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/profile/update-location", {
        arrondissement_locality_id: arrId,
        quartier_locality_id:       qtId,
      });
      onDone();
    } catch (e: any) {
      setError(e?.message ?? "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header coloré */}
        <div className="px-6 pt-6 pb-4" style={{ background: "linear-gradient(135deg,#1ba24b,#2b5e5e)" }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📍</span>
            <h2 className="text-white font-bold text-lg leading-tight">Mettez votre adresse à jour</h2>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            Pour recevoir des campagnes ciblées près de chez vous, précisez votre arrondissement et votre quartier.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Arrondissement */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Arrondissement</label>
            <select
              value={arrId}
              onChange={(e) => setArrId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-700 focus:outline-none focus:border-green-500 transition"
              style={{ backgroundColor: "rgba(43,94,94,0.07)" }}
              disabled={arrondissements.length === 0}
            >
              <option value="">
                {arrondissements.length ? "Choisissez votre arrondissement" : "Chargement…"}
              </option>
              {arrondissements.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Quartier */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Quartier</label>
            <select
              value={qtId}
              onChange={(e) => setQtId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-700 focus:outline-none focus:border-green-500 transition"
              style={{ backgroundColor: "rgba(43,94,94,0.07)" }}
              disabled={!arrId || quartiers.length === 0}
            >
              <option value="">
                {!arrId ? "Choisissez d'abord un arrondissement" : quartiers.length ? "Choisissez votre quartier" : "Chargement…"}
              </option>
              {quartiers.map((q) => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={save}
            disabled={loading || !arrId || !qtId}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition"
            style={{ backgroundColor: "#1ba24b" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Enregistrement…
              </span>
            ) : "Enregistrer ma localisation"}
          </button>

          <p className="text-center text-gray-400 text-xs">
            Cette information est nécessaire pour vous envoyer des campagnes pertinentes.
          </p>
        </div>
      </div>
    </div>
  );
}
