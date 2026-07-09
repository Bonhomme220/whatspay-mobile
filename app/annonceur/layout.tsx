"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tokenStore, userStore, type StoredUser } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";
import PwaInstallBanner from "@/components/PwaInstallBanner";

const NAV = [
  { href: "/annonceur/dashboard",    label: "Accueil",     icon: <IconHome /> },
  { href: "/annonceur/campagnes",    label: "Campagnes",   icon: <IconMega /> },
  { href: "/annonceur/rapports",     label: "Rapports",    icon: <IconChart /> },
  { href: "/annonceur/portefeuille", label: "Portefeuille", icon: <IconWallet /> },
  { href: "/annonceur/profil",       label: "Profil",      icon: <IconUser /> },
];

export default function AnnouncerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Init paresseuse depuis le store (null côté SSR — userStore garde localStorage).
  const [user] = useState<StoredUser | null>(() => userStore.get());

  useEffect(() => {
    if (!tokenStore.get()) {
      window.location.replace("/login");
      return;
    }
    // Garde de rôle : seul un annonceur accède à cet espace.
    if (userStore.get()?.profil && userStore.get()?.profil !== "ANNONCEUR") {
      window.location.replace("/dashboard");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header blanc */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 h-14 flex items-center px-4 gap-3">
        <div className="flex-1 flex justify-center">
          <Image src="/logo.png" alt="WhatsPAY" width={110} height={32} className="object-contain h-8 w-auto" />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 absolute right-4">
          <NotificationBell />
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

function IconHome()   { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>; }
function IconMega()   { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>; }
function IconChart()  { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6m4 6V5m4 14v-9M4 19h16" /></svg>; }
function IconWallet() { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>; }
function IconUser()   { return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
