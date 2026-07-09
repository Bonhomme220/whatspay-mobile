"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, userStore, type StoredUser } from "@/lib/api";

export default function ProfilPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => { setUser(userStore.get()); }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await auth.logout();
    window.location.replace("/login");
  }

  const initials = `${user?.firstname?.[0] ?? ""}${user?.lastname?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Profil</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg">
          {initials || "?"}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 truncate">{user?.firstname} {user?.lastname}</p>
          <p className="text-sm text-gray-400 truncate">{user?.email}</p>
          <span className="inline-block mt-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Annonceur</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 divide-y divide-gray-50">
        <Link href="/annonceur/briefs" className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm text-gray-700">💡 Mes briefs</span>
          <span className="text-gray-300">→</span>
        </Link>
        <Row label="Paramètres du compte" hint="Bientôt disponible" />
        <Row label="Sécurité & mot de passe" hint="Bientôt disponible" />
        <Row label="Aide & support" hint="Bientôt disponible" />
      </div>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full mt-6 border border-red-200 text-red-600 font-semibold py-3 rounded-xl disabled:opacity-60"
      >
        {loggingOut ? "Déconnexion…" : "Se déconnecter"}
      </button>
    </div>
  );
}

function Row({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-sm text-gray-700">{label}</span>
      <span className="text-xs text-gray-300">{hint}</span>
    </div>
  );
}
