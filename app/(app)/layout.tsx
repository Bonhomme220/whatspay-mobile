"use client";

import { useEffect } from "react";
import { tokenStore, userStore, homeRouteForProfil } from "@/lib/api";
import { AppProvider } from "@/contexts/AppContext";
import ForceAppDownloadGate from "@/components/ForceAppDownloadGate";
import { usePushNotifications } from "@/hooks/usePushNotifications";

/**
 * Espace diffuseur PWA — la PWA n'est plus la destination finale pour ce rôle (décision
 * founder 2026-10-06) : on renvoie systématiquement vers l'app native (Play Store/App Store
 * selon l'appareil), à chaque connexion, sans échappatoire. Rien de l'ancien dashboard PWA
 * (sidebar, nav, pages) ne s'affiche plus — il reste dans l'historique git si la décision
 * est reconsidérée.
 */
function Inner() {
  useEffect(() => {
    // Vérification initiale : pas de token → login
    // Les 401 API sont gérés directement dans lib/api.ts → window.location.replace("/login")
    if (!tokenStore.get()) {
      window.location.replace("/login");
      return;
    }
    // Garde de rôle : un annonceur ou un partenaire média ne doit pas voir l'espace diffuseur
    // (comptes séparés, pas de lien entre eux).
    const profil = userStore.get()?.profil;
    if (profil === "ANNONCEUR" || profil === "PARTENAIRE_MEDIA") {
      window.location.replace(homeRouteForProfil(profil));
    }
  }, []);

  usePushNotifications();

  return <ForceAppDownloadGate />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  void children; // jamais rendu : voir le commentaire sur Inner()
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  );
}
