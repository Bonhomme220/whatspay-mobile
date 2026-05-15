"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { auth } from "@/lib/api";

export default function GreenTopBar() {
  const { openSidebar } = useApp();
  const router = useRouter();

  async function handleLogout() {
    await auth.logout();
    router.push("/login");
  }

  return (
    <div className="flex items-center gap-3 mb-1">
      <button onClick={openSidebar} className="p-1 text-white flex-shrink-0">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1 flex justify-center">
        <Image src="/logo.png" alt="WhatsPAY" width={110} height={32} className="object-contain h-8 w-auto brightness-0 invert" />
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="relative text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">1</span>
        </button>
        <button onClick={handleLogout} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
