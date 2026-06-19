"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { tokenStore, userStore, api, type StoredUser } from "@/lib/api";

// ── Nudge types ────────────────────────────────────────────────────────────────

export interface NudgeCta {
  label: string;
  screen: string;
  params?: Record<string, string>;
}

export interface Nudge {
  id: string;
  type: string;        // critical | onboarding | high | normal | ambassador
  dismissible: boolean;
  title: string;
  message: string;
  cta: NudgeCta | null;
}

interface NudgeResponse {
  modal: Nudge | null;
  banners: Nudge[];
}

// ── Context shape ──────────────────────────────────────────────────────────────

interface AppCtx {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  user: StoredUser | null;
  onboardingDone: boolean;
  onboardingMissionId: string | null;
  markOnboardingDone: () => void;
  // Révision de profil (migration référentiel)
  profileNeedsReview: boolean;
  clearProfileNeedsReview: () => void;
  // Mise à jour localisation obligatoire
  needsLocationUpdate: boolean;
  userLocalityId: string | null;
  markLocationUpdated: () => void;
  // Profil incomplet (champs N/A)
  profileIncomplete: boolean;
  // Nudges
  nudgeModal: Nudge | null;
  nudgeBanners: Nudge[];
  dismissNudgeModal: () => void;
  dismissNudgeBanner: (id: string) => void;
}

const Ctx = createContext<AppCtx>({
  sidebarOpen: false,
  openSidebar: () => {},
  closeSidebar: () => {},
  user: null,
  onboardingDone: true,
  onboardingMissionId: null,
  markOnboardingDone: () => {},
  profileNeedsReview: false,
  clearProfileNeedsReview: () => {},
  needsLocationUpdate: false,
  userLocalityId: null,
  markLocationUpdated: () => {},
  profileIncomplete: false,
  nudgeModal: null,
  nudgeBanners: [],
  dismissNudgeModal: () => {},
  dismissNudgeBanner: () => {},
});

// ── API response types ─────────────────────────────────────────────────────────

interface ProfileResponse {
  id: string; firstname: string; lastname: string; email: string;
  onboarding_shown_at: string | null;
  profile_needs_review: boolean;
  phone: string | null;
  birthdate: string | null;
  locality: { id: string; name: string } | null;
  arrondissement: { id: string; name: string } | null;
  quartier: { id: string; name: string } | null;
  occupation: { id: string; name: string } | null;
}

interface MissionListItem {
  id: string; status: string;
  task: { is_onboarding: boolean } | null;
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [onboardingMissionId, setOnboardingMissionId] = useState<string | null>(null);
  const [profileNeedsReview, setProfileNeedsReview] = useState(false);
  const [needsLocationUpdate, setNeedsLocationUpdate] = useState(false);
  const [userLocalityId, setUserLocalityId] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  // Nudge state
  const [nudgeModal, setNudgeModal] = useState<Nudge | null>(null);
  const [nudgeBanners, setNudgeBanners] = useState<Nudge[]>([]);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

  // ── Vérification de session (robuste) ─────────────────────────────────────
  // Appelée au mount ET à chaque retour au premier plan.
  // Si le compte est désactivé (401), api.ts redirige vers /login directement.
  const checkSession = () => {
    if (!tokenStore.get()) {
      window.location.replace("/login");
      return;
    }
    api.get<ProfileResponse>("/profile")
      .then((p) => {
        const u: StoredUser = { id: p.id, firstname: p.firstname, lastname: p.lastname, email: p.email, profil: "DIFFUSEUR" };
        userStore.set(u);
        setUser(u);

        if (p.profile_needs_review) setProfileNeedsReview(true);

        // Modal localisation obligatoire si pas d'arrondissement/quartier ET localité connue
        // (on ne bloque que si la localité a des arrondissements disponibles côté API)
        if ((!p.arrondissement || !p.quartier) && p.locality?.id) {
          setNeedsLocationUpdate(true);
          setUserLocalityId(p.locality.id);
        } else {
          setNeedsLocationUpdate(false);
        }

        // Bannière profil incomplet (champs N/A en base)
        // arrondissement/quartier comptent comme manquants seulement si la localité existe
        const locationIncomplete = p.locality && (!p.arrondissement || !p.quartier);
        const incomplete = !p.phone || !p.birthdate || !p.locality || locationIncomplete || !p.occupation;
        setProfileIncomplete(!!incomplete);

        if (!p.onboarding_shown_at) {
          setOnboardingDone(false);
          api.get<MissionListItem[]>("/missions")
            .then((missions) => {
              const ob = missions.find((m) => m.task?.is_onboarding);
              if (ob) setOnboardingMissionId(ob.id);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        // api.ts a déjà géré le 401 avec window.location.replace("/login").
        // Pour les autres erreurs réseau (5xx, timeout), on ne fait rien.
      });
  };

  useEffect(() => {
    if (!tokenStore.get()) return;

    const stored = userStore.get();
    if (stored?.firstname) setUser(stored);

    // Vérification au démarrage
    checkSession();

    // Revérification à chaque retour au premier plan
    // (couvre le cas : admin désactive pendant que l'app est en arrière-plan)
    const handleVisibility = () => {
      if (!document.hidden) checkSession();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Fetch nudges — indépendant du profil, zéro-bloquant
    api.get<NudgeResponse>("/nudges")
      .then((data) => {
        setNudgeModal(data.modal ?? null);
        setNudgeBanners(data.banners ?? []);
      })
      .catch(() => {}); // nudges ne bloquent jamais l'app

    return () => document.removeEventListener("visibilitychange", handleVisibility);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function markOnboardingDone() {
    setOnboardingDone(true);
  }

  function clearProfileNeedsReview() {
    setProfileNeedsReview(false);
  }

  function markLocationUpdated() {
    setNeedsLocationUpdate(false);
  }

  function dismissNudgeModal() {
    if (nudgeModal?.id === 'incident_june_2026') {
      api.post('/incident/acknowledge', {}).catch(() => {});
    }
    setNudgeModal(null);
  }

  function dismissNudgeBanner(id: string) {
    setDismissedBanners((prev) => new Set([...prev, id]));
  }

  const visibleBanners = nudgeBanners.filter((b) => !dismissedBanners.has(b.id));

  return (
    <Ctx.Provider value={{
      sidebarOpen,
      openSidebar:  () => setSidebarOpen(true),
      closeSidebar: () => setSidebarOpen(false),
      user,
      onboardingDone,
      onboardingMissionId,
      markOnboardingDone,
      profileNeedsReview,
      clearProfileNeedsReview,
      needsLocationUpdate,
      userLocalityId,
      markLocationUpdated,
      profileIncomplete,
      nudgeModal,
      nudgeBanners: visibleBanners,
      dismissNudgeModal,
      dismissNudgeBanner,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
