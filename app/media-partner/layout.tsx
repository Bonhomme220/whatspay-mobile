"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { tokenStore, userStore, homeRouteForProfil, auth, type StoredUser } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";
import PwaInstallBanner from "@/components/PwaInstallBanner";

const NAV = [
  { href: "/media-partner/missions", label: "Missions", icon: <IconMega /> },
];

// Espace Partenaire Média — compte séparé du Diffuseur (pas de lien entre les deux),
// donc sa propre coquille (header + nav), calquée sur app/annonceur/layout.tsx.
export default function MediaPartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Init paresseuse depuis le store (null côté SSR — userStore garde localStorage).
  const [user] = useState<StoredUser | null>(() => userStore.get());

  useEffect(() => {
    if (!tokenStore.get()) {
      window.location.replace("/login");
      return;
    }
    // Garde de rôle : seul un partenaire média accède à cet espace.
    const profil = userStore.get()?.profil;
    if (profil && profil !== "PARTENAIRE_MEDIA") {
      window.location.replace(homeRouteForProfil(profil));
    }
  }, []);

  async function handleLogout() {
    await auth.logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header blanc */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 h-14 flex items-center px-4 gap-3">
        <div className="flex-1 flex justify-center">
          <Image src="/logo.png" alt="WhatsPAY" width={110} height={32} className="object-contain h-8 w-auto" />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 absolute right-4">
          <NotificationBell />
          <button onClick={handleLogout} className="text-gray-500" aria-label="Déconnexion">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="pt-14 pb-16">
        <PwaInstallBanner />
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 h-16 flex">
        {NAV.map((item) => {
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

      {/* user monté pour usage éventuel futur (évite un warning de variable inutilisée) */}
      <span className="hidden">{user?.firstname}</span>
    </div>
  );
}

function IconMega() { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>; }
