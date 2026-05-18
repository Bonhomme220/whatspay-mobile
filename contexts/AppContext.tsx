"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { tokenStore, userStore, api, type StoredUser } from "@/lib/api";

interface AppCtx {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  user: StoredUser | null;
  onboardingDone: boolean;
  onboardingMissionId: string | null;
  markOnboardingDone: () => void;
}

const Ctx = createContext<AppCtx>({
  sidebarOpen: false,
  openSidebar: () => {},
  closeSidebar: () => {},
  user: null,
  onboardingDone: true,
  onboardingMissionId: null,
  markOnboardingDone: () => {},
});

interface ProfileResponse {
  id: string; firstname: string; lastname: string; email: string;
  onboarding_shown_at: string | null;
}

interface MissionListItem {
  id: string; status: string;
  task: { is_onboarding: boolean } | null;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [onboardingMissionId, setOnboardingMissionId] = useState<string | null>(null);

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
  }, []);

  function markOnboardingDone() {
    setOnboardingDone(true);
  }

  return (
    <Ctx.Provider value={{
      sidebarOpen,
      openSidebar:  () => setSidebarOpen(true),
      closeSidebar: () => setSidebarOpen(false),
      user,
      onboardingDone,
      onboardingMissionId,
      markOnboardingDone,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
