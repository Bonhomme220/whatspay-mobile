"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StoredUser } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  user: StoredUser | null;
}

// Secondaire au bottom-nav (4 items) : sections qui ne rentrent pas dans la barre du bas.
const NAV = [
  { href: "/media-partner/dashboard",  label: "Tableau De Bord", icon: <IcoDash /> },
  { href: "/media-partner/missions",   label: "Missions",        icon: <IcoMega /> },
  { href: "/media-partner/recapture",  label: "Mes Chiffres",    icon: <IcoChart /> },
  { href: "/media-partner/wallet",     label: "Mes Gains",       icon: <IcoWallet /> },
  { href: "/media-partner/baremes",    label: "Barème des paliers", icon: <IcoScale /> },
  { href: "/media-partner/profil",     label: "Mon Profil",      icon: <IcoUser /> },
  { href: "/media-partner/faq",        label: "FAQ",             icon: <IcoHelp /> },
  { href: "/media-partner/tickets",    label: "Mes Tickets",     icon: <IcoTicket /> },
];

export default function MediaPartnerSidebar({ open, onClose, user }: Props) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[78vw] max-w-[300px] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <Image
            src="/logo.png"
            alt="WhatsPAY"
            width={120}
            height={36}
            className="object-contain h-9 w-auto"
          />
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User card */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
          <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-800 font-semibold text-sm leading-tight">
              {user ? `${user.firstname} ${user.lastname}` : "—"}
            </p>
            <span className="text-green-600 text-xs font-semibold">Partenaire Média</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-5 py-3.5 mx-2 rounded-xl transition-colors ${
                  active
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className={active ? "text-green-600" : "text-gray-400"}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium flex-1">{item.label}</span>
                <svg className={`w-4 h-4 ${active ? "text-green-400" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-gray-400 text-xs text-center">WhatsPAY v2.1 · © 2026</p>
        </div>
      </aside>
    </>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const s = "w-5 h-5";
function IcoDash()   { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>; }
function IcoMega()   { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>; }
function IcoChart()  { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6m4 6V9m4 10V5M5 19h14a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v12a1 1 0 001 1z" /></svg>; }
function IcoWallet() { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>; }
function IcoUser()   { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
function IcoHelp()   { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function IcoTicket() { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>; }
function IcoScale()  { return <svg className={s} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v18M5 7l-3 6a3 3 0 006 0l-3-6zm14 0l-3 6a3 3 0 006 0l-3-6zM5 7h14M9 21h6" /></svg>; }
