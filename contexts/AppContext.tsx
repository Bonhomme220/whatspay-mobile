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

  // Nudge state
  const [nudgeModal, setNudgeModal] = useState<Nudge | null>(null);
  const [nudgeBanners, setNudgeBanners] = useState<Nudge[]>([]);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!tokenStore.get()) return;

    const stored = userStore.get();
    if (stored?.firstname) setUser(stored);

    // Fetch profile to check onboarding status
    api.get<ProfileResponse>("/profile")
      .then((p) => {
        const u: StoredUser = { id: p.id, firstname: p.firstname, lastname: p.lastname, email: p.email, profil: "DIFFUSEUR" };
        userStore.set(u);
        setUser(u);

        // Flag migration référentiel
        if (p.profile_needs_review) {
          setProfileNeedsReview(true);
        }

        if (!p.onboarding_shown_at) {
          setOnboardingDone(false);
          // Find the onboarding mission
          api.get<MissionListItem[]>("/missions")
            .then((missions) => {
              const ob = missions.find((m) => m.task?.is_onboarding);
              if (ob) setOnboardingMissionId(ob.id);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    // Fetch nudges — indépendant du profil, zéro-bloquant
    api.get<NudgeResponse>("/nudges")
      .then((data) => {
        setNudgeModal(data.modal ?? null);
        setNudgeBanners(data.banners ?? []);
      })
      .catch(() => {}); // nudges ne bloquent jamais l'app
  }, []);

  function markOnboardingDone() {
    setOnboardingDone(true);
  }

  function clearProfileNeedsReview() {
    setProfileNeedsReview(false);
  }

  function dismissNudgeModal() {
    // Toujours effacer — session-only.
    // Le modal revient au prochain chargement si l'API le retourne encore.
    // On ne bloque jamais l'accès à l'app dans la session courante.
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
