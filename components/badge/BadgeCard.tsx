"use client";

import { forwardRef } from "react";

export interface BadgeData {
  firstname: string;
  lastInitial: string;
  year: string;            // « Membre depuis »
  totalViews: number;      // « Vues cumulées »
  completedCampaigns: number; // « Campagnes validées »
  reliability?: number | null;// « Fiabilité » (0-100, null si pas de données)
  isAmbassador: boolean;
  code?: string | null;    // code parrainage (ambassadeur)
  activeReferrals?: number;// filleuls actifs (ambassadeur)
  civicCount?: number;     // badge citoyen
  photoDataUrl?: string | null; // photo choisie (sinon initiales)
}

// Format portrait 4:5 — idéal Statut WhatsApp
export const CARD_W = 1080;
export const CARD_H = 1350;

const fmt = (n: number) => (n || 0).toLocaleString("fr-FR");

/**
 * Carte partageable 1080×1350 (portrait, rendue à taille réelle, mise à l'échelle en aperçu).
 * Or = ambassadeur, Vert = diffuseur. Layout en colonne flex (aucun chevauchement).
 * Styles inline (px) pour un rendu fiable via html-to-image.
 */
const BadgeCard = forwardRef<HTMLDivElement, { data: BadgeData }>(function BadgeCard({ data }, ref) {
  const gold = data.isAmbassador;
  const accent = gold ? "#E0A227" : "#1BA24B";
  const bg = "#F4F1EA";
  const dark = "#161616";
  const initials = `${data.firstname?.[0] ?? ""}${data.lastInitial ?? ""}`.toUpperCase();

  const reliability = typeof data.reliability === "number" ? Math.round(data.reliability) : null;
  const stats: { value: string; label: string }[] = [
    { value: data.year || "—", label: "MEMBRE" },
    { value: fmt(data.totalViews), label: "VUES" },
    { value: fmt(data.completedCampaigns), label: "CAMPAGNES" },
    { value: reliability !== null ? `${reliability}%` : "—", label: "FIABILITÉ" },
  ];

  return (
    <div
      ref={ref}
      style={{
        width: CARD_W, height: CARD_H, background: bg, position: "relative",
        fontFamily: "Geist, Arial, sans-serif", color: dark, overflow: "hidden",
        boxSizing: "border-box", display: "flex", flexDirection: "column",
        padding: "80px 78px 72px",
      }}
    >
      {/* Barre d'accent haute */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 18, background: accent }} />

      {/* Header : logo + pill rôle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" style={{ height: 88, objectFit: "contain" }} crossOrigin="anonymous" />
        <div style={{
          border: `2px solid ${accent}`, color: accent, borderRadius: 999,
          padding: "12px 28px", fontSize: 28, fontWeight: 800, letterSpacing: 3,
        }}>
          {gold ? "★ AMBASSADEUR" : "◆ DIFFUSEUR"}
        </div>
      </div>

      {/* Avatar */}
      <div style={{ alignSelf: "center", marginTop: 56 }}>
        <div style={{
          width: 340, height: 340, borderRadius: "50%", background: "#fff",
          border: `5px solid ${accent}`, overflow: "hidden", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 24px 56px rgba(0,0,0,0.10)",
        }}>
          {data.photoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photoDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 150, fontWeight: 800, color: accent }}>{initials || "?"}</span>
          )}
        </div>
      </div>

      {/* Nom */}
      <div style={{ textAlign: "center", marginTop: 34, fontSize: 74, fontWeight: 800, lineHeight: 1 }}>
        {data.firstname} {data.lastInitial}.
      </div>

      {/* Bandeau stats (dashboard) */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 40, background: "#fff", borderRadius: 26, padding: "30px 10px",
        boxShadow: "0 16px 40px rgba(0,0,0,0.06)",
      }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 50, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: 1.5, color: "#9a958c", marginTop: 9 }}>{s.label}</div>
            </div>
            {i < stats.length - 1 && <div style={{ width: 1, height: 74, background: "#e6e2d8" }} />}
          </div>
        ))}
      </div>

      {/* Bloc ambassadeur : code parrainage seul + filleuls */}
      {gold && data.code && (
        <div style={{ marginTop: 40, marginLeft: 18, marginRight: 18 }}>
          <div style={{ background: dark, borderRadius: 24, padding: "28px 30px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3, color: accent }}>MON CODE AMBASSADEUR</div>
            <div style={{ fontSize: 62, fontWeight: 800, color: "#fff", marginTop: 10, letterSpacing: 2 }}>{data.code}</div>
          </div>
          {typeof data.activeReferrals === "number" && data.activeReferrals > 0 && (
            <div style={{ textAlign: "center", marginTop: 18, fontSize: 28, fontWeight: 700, color: "#5a5a5a" }}>
              {data.activeReferrals} filleul{data.activeReferrals > 1 ? "s" : ""} actif{data.activeReferrals > 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* Badge citoyen (si participation, diffuseur) */}
      {(data.civicCount ?? 0) > 0 && !gold && (
        <div style={{ marginTop: 40, textAlign: "center", fontSize: 30, fontWeight: 700, color: "#1BA24B" }}>
          🏛️ A soutenu {data.civicCount} campagne{(data.civicCount ?? 0) > 1 ? "s" : ""} citoyenne{(data.civicCount ?? 0) > 1 ? "s" : ""}
        </div>
      )}

      {/* Espaceur : pousse le footer en bas */}
      <div style={{ flex: 1 }} />

      {/* Footer : tagline */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 3, color: accent, marginBottom: 16 }}>◆ APP.WHATSPAY.AFRICA</div>
        <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.14 }}>
          {gold ? (<>Mon réseau. <span style={{ color: accent }}>Mes gains.</span></>) : (<>Je fais partie du <span style={{ color: accent }}>mouvement.</span></>)}
        </div>
      </div>
    </div>
  );
});

export default BadgeCard;
