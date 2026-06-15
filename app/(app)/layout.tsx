"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tokenStore } from "@/lib/api";
import { AppProvider, useApp } from "@/contexts/AppContext";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import OnboardingModal from "@/components/OnboardingModal";
import NudgeModal from "@/components/NudgeModal";
import ProfileReviewBanner from "@/components/ProfileReviewBanner";
import { usePushNotifications } from "@/hooks/usePushNotifications";

function Inner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    sidebarOpen, closeSidebar, openSidebar, user,
    onboardingDone, onboardingMissionId, markOnboardingDone,
    profileNeedsReview,
    nudgeModal, dismissNudgeModal,
  } = useApp();

  useEffect(() => {
    // Vérification initiale du token
    if (!tokenStore.get()) {
      window.location.replace("/login");
      return;
    }

    // Écoute l'événement 401 émis par lib/api.ts
    // (token révoqué côté serveur — compte désactivé par admin)
    // window.location.replace est utilisé intentionnellement à la place de router.replace :
    // router.replace ne s'exécute pas correctement depuis un handler CustomEvent (hors contexte React).
    const handleUnauthorized = () => window.location.replace("/login");
    window.addEventListener("wp:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("wp:unauthorized", handleUnauthorized);
  }, []);

  usePushNotifications();

  const navItems = [
    { href: "/dashboard", label: "Accueil",   icon: <IconHome /> },
    { href: "/campagnes", label: "Campagnes", icon: <IconMega /> },
    { href: "/gains",     label: "Gains",     icon: <IconWallet /> },
    { href: "/profil",    label: "Profil",    icon: <IconUser /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} user={user} />

      {/* White header with logo */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 h-14 flex items-center px-4 gap-3">
        <button onClick={openSidebar} className="p-1 text-gray-600 flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex-1 flex justify-center">
          <Image src="/logo.png" alt="WhatsPAY" width={110} height={32} className="object-contain h-8 w-auto" />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <NotificationBell />
        </div>
      </header>

      {/* pt-14 = header height, pb-16 = bottom nav height */}
      <main className="pt-14 pb-16">
        {profileNeedsReview && <ProfileReviewBanner />}
        <PwaInstallBanner />
        {children}
      </main>

      {!onboardingDone && (
        <OnboardingModal
          onboardingMissionId={onboardingMissionId}
          onDone={markOnboardingDone}
        />
      )}

      {/* Nudge modal — affiché uniquement si onboarding terminé pour ne pas superposer */}
      {onboardingDone && nudgeModal && (
        <NudgeModal nudge={nudgeModal} onDismiss={dismissNudgeModal} />
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 h-16 flex">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
            >
              <span className={active ? "text-green-600" : "text-gray-400"}>{item.icon}</span>
              <span className={`text-[10px] ${active ? "text-green-600 font-semibold" : "text-gray-400"}`}>
                {item.label}
              </span>
              {active && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-green-600" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <Inner>{children}</Inner>
    </AppProvider>
  );
}

function IconHome()   { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>; }
function IconMega()   { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>; }
function IconWallet() { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>; }
function IconUser()   { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
