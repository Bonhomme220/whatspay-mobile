"use client";

// Ouvre la confirmation du profil une fois par session tant qu'elle n'est pas faite.
// Les retraits ne dépendent jamais de ce formulaire.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchProfileForm, ProfileForm } from "@/lib/targeting";

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

export default function ProfileConfirmBanner() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm | null>(null);

  useEffect(() => {
    fetchProfileForm().then((f) => {
      setForm(f);
      if (!f.complete && !sessionStorage.getItem("wp_profile_confirm_opened")) {
        sessionStorage.setItem("wp_profile_confirm_opened", "1");
        router.push("/profil/confirmer");
      }
    }).catch(() => {});
  }, [router]);

  if (!form || form.complete) return null;
  const text = form.blocked_from_missions
    ? "Confirme ton profil pour recevoir de nouvelles missions. Tes retraits restent possibles."
    : form.deadline
      ? `À confirmer avant le ${fmt(form.deadline)} pour continuer à recevoir de nouvelles missions.`
      : "Nous l’avons prérempli : il ne te reste qu’à vérifier.";
  return (
    <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <p className="text-sm font-semibold text-amber-900">Confirme ton profil</p>
      <p className="text-xs text-amber-900 mt-1">{text}</p>
      <Link href="/profil/confirmer" className="inline-block mt-2 text-sm font-semibold text-green-700">Confirmer →</Link>
    </div>
  );
}
