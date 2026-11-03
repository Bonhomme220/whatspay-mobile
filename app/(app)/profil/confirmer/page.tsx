"use client";

// Confirmation du profil d'un compte existant : prérempli, seules les réponses impossibles à déduire restent à donner.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileWizard from "@/components/ProfileWizard";
import { Answers, fetchProfileForm, ProfileForm, saveProfileForm, WARNING_TEXT } from "@/lib/targeting";

export default function ConfirmProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfileForm().then(setForm).catch(() => router.replace("/dashboard"));
  }, [router]);

  async function save(answers: Answers, confirmWarnings = false) {
    setSaving(true);
    setError("");
    try {
      const res = await saveProfileForm(answers, confirmWarnings);
      if (res.warnings?.length) {
        const text = res.warnings.map((w) => WARNING_TEXT[w] ?? w).join("\n");
        if (window.confirm(`${text}\n\nConfirmer quand même ?`)) await save(answers, true);
        return;
      }
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Confirme ton profil</h1>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      {form
        ? <ProfileWizard questions={form.questions} onDone={(a) => save(a)} saving={saving} doneLabel="Terminer" onLater={() => router.replace("/dashboard")} />
        : <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>}
    </div>
  );
}
