"use client";

import { forwardRef } from "react";

export interface BadgeData {
  firstname: string;
  lastInitial: string;
  year: string;            // « Membre depuis »
  totalViews: number;      // « Vues cumulées »
  isAmbassador: boolean;
  code?: string | null;    // code parrainage (ambassadeur)
  activeReferrals?: number;// filleuls actifs (ambassadeur)
  civicCount?: number;     // badge citoyen
  photoDataUrl?: string | null; // photo choisie (sinon initiales)
}

const fmt = (n: number) => (n || 0).toLocaleString("fr-FR");

/**
 * Carte partageable 1080×1080 (rendue à taille réelle, mise à l'échelle en aperçu).
 * Or = ambassadeur, Vert = diffuseur. Styles inline (px) pour un rendu fiable via html-to-image.
 */
const BadgeCard = forwardRef<HTMLDivElement, { data: BadgeData }>(function BadgeCard({ data }, ref) {
  const gold = data.isAmbassador;
  const accent = gold ? "#E0A227" : "#1BA24B";
  const bg = "#F4F1EA";
  const dark = "#161616";
  const initials = `${data.firstname?.[0] ?? ""}${data.lastInitial ?? ""}`.toUpperCase();

  return (
    <div
      ref={ref}
      style={{
        width: 1080, height: 1080, background: bg, position: "relative",
        fontFamily: "Geist, Arial, sans-serif", color: dark, overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Barre d'accent haute */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, background: accent }} />

      {/* Header : logo + pill rôle */}
      <div style={{ position: "absolute", top: 60, left: 70, right: 70, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" style={{ height: 44, objectFit: "contain" }} crossOrigin="anonymous" />
        </div>
        <div style={{
          border: `2px solid ${accent}`, color: accent, borderRadius: 999,
          padding: "12px 26px", fontSize: 26, fontWeight: 800, letterSpacing: 3,
        }}>
          {gold ? "★ AMBASSADEUR" : "◆ DIFFUSEUR"}
        </div>
      </div>

      {/* Avatar */}
      <div style={{ position: "absolute", top: 190, left: "50%", transform: "translateX(-50%)" }}>
        <div style={{
          width: 380, height: 380, borderRadius: "50%", background: "#fff",
          border: `4px solid ${accent}`, overflow: "hidden", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 20px 50px rgba(0,0,0,0.10)",
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
      <div style={{ position: "absolute", top: 610, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1 }}>
          {data.firstname} {data.lastInitial}.
        </div>
      </div>

      {/* Stats */}
      <div style={{ position: "absolute", top: 720, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 60 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 800 }}>{data.year}</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: "#8a8a8a", marginTop: 6 }}>MEMBRE DEPUIS</div>
        </div>
        <div style={{ width: 2, height: 90, background: "#d9d5cb" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 800 }}>{fmt(data.totalViews)}</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: "#8a8a8a", marginTop: 6 }}>VUES CUMULÉES</div>
        </div>
      </div>

      {/* Bloc ambassadeur : code parrainage + filleuls */}
      {gold && data.code && (
        <div style={{ position: "absolute", top: 850, left: 130, right: 130 }}>
          <div style={{ background: dark, borderRadius: 22, padding: "24px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 3, color: accent }}>MON CODE AMBASSADEUR</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#fff", marginTop: 8 }}>whatspay.africa/r/{data.code}</div>
          </div>
          {typeof data.activeReferrals === "number" && data.activeReferrals > 0 && (
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 26, fontWeight: 700, color: "#5a5a5a" }}>
              {data.activeReferrals} filleul{data.activeReferrals > 1 ? "s" : ""} actif{data.activeReferrals > 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* Badge citoyen (si participation) */}
      {(data.civicCount ?? 0) > 0 && !gold && (
        <div style={{ position: "absolute", top: 880, left: 0, right: 0, textAlign: "center", fontSize: 26, fontWeight: 700, color: "#1BA24B" }}>
          🏛️ A soutenu {data.civicCount} campagne{(data.civicCount ?? 0) > 1 ? "s" : ""} citoyenne{(data.civicCount ?? 0) > 1 ? "s" : ""}
        </div>
      )}

      {/* Footer : tagline */}
      <div style={{ position: "absolute", bottom: 70, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3, color: accent, marginBottom: 14 }}>◆ WHATSPAY.AFRICA</div>
        <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.15 }}>
          {gold ? (<>Mon réseau. <span style={{ color: accent }}>Mes gains.</span></>) : (<>Je fais partie du <span style={{ color: accent }}>mouvement.</span></>)}
        </div>
      </div>
    </div>
  );
});

export default BadgeCard;
