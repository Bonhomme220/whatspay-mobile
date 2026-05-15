"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { tokenStore, userStore, api, type StoredUser } from "@/lib/api";

interface AppCtx {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  user: StoredUser | null;
}

const Ctx = createContext<AppCtx>({
  sidebarOpen: false,
  openSidebar: () => {},
  closeSidebar: () => {},
  user: null,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    if (!tokenStore.get()) return;
    const stored = userStore.get();
    if (stored?.firstname) {
      setUser(stored);
    } else {
      // fallback : token présent mais wp_user absent ou incomplet
      api.get<{ id: string; firstname: string; lastname: string; email: string }>("/profile")
        .then((p) => {
          const u: StoredUser = { id: p.id, firstname: p.firstname, lastname: p.lastname, email: p.email, profil: "DIFFUSEUR" };
          userStore.set(u);
          setUser(u);
        })
        .catch(() => {});
    }
  }, []);

  return (
    <Ctx.Provider value={{
      sidebarOpen,
      openSidebar:  () => setSidebarOpen(true),
      closeSidebar: () => setSidebarOpen(false),
      user,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
