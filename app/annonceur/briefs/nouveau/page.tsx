"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { BRIEF_OBJECTIVES, type Brief } from "@/lib/annonceur";

export default function NouveauBriefPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [objective, setObjective] = useState("brand_awareness");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("");
  const [link, setLink] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [impressions, setImpressions] = useState("");
  const [instructions, setInstructions] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, 10));
  }

  const canSubmit = name.trim() && description.trim().length >= 30 && audience.trim().length >= 20;

  async function handleSubmit() {
    setError("");
    if (!canSubmit) {
      setError("Nom requis, description ≥ 30 caractères, cible ≥ 20 caractères.");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("objective", objective);
      form.append("description", description.trim());
      form.append("target_audience", audience.trim());
      if (link.trim()) form.append("link", link.trim());
      if (startDate) form.append("preferred_start_date", startDate);
      if (duration) form.append("duration_days", duration);
      if (impressions) form.append("target_impressions", impressions);
      if (instructions.trim()) form.append("special_instructions", instructions.trim());
      files.forEach((f) => form.append("media[]", f));

      const res = await api.postForm<{ brief: Brief }>("/briefs", form);
      router.replace(`/annonceur/briefs/${res.brief.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Impossible d'enregistrer le brief.");
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-28">
      <div className="px-4 pt-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Nouveau brief</h1>
      </div>

      {error && <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">{error}</div>}

      <div className="px-4 mt-3 space-y-4">
        <Section title="L'essentiel">
          <Field label="Nom du projet" required>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Lancement boutique"
              className="inp" />
          </Field>
          <Field label="Objectif" required>
            <div className="space-y-2">
              {BRIEF_OBJECTIVES.map((o) => (
                <button key={o.value} type="button" onClick={() => setObjective(o.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm ${
                    objective === o.value ? "border-green-500 bg-green-50 text-green-700 font-medium" : "border-gray-200 text-gray-600"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        <Section title="Votre besoin">
          <Field label="Description" hint="Au moins 30 caractères" required>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              placeholder="Décrivez votre produit / service et le message à faire passer"
              className="inp resize-none" />
            <p className="text-[11px] text-gray-400 mt-1">{description.trim().length}/30</p>
          </Field>
          <Field label="Audience cible" hint="Au moins 20 caractères" required>
            <textarea value={audience} onChange={(e) => setAudience(e.target.value)} rows={3}
              placeholder="Qui souhaitez-vous toucher ? (zone, âge, profil…)"
              className="inp resize-none" />
            <p className="text-[11px] text-gray-400 mt-1">{audience.trim().length}/20</p>
          </Field>
          <Field label="Lien (optionnel)">
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" className="inp" />
          </Field>
        </Section>

        <Section title="Préférences (optionnel)">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Début souhaité">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="inp" />
            </Field>
            <Field label="Durée (jours)">
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ex. 14" className="inp" />
            </Field>
          </div>
          <Field label="Impressions visées">
            <input type="number" value={impressions} onChange={(e) => setImpressions(e.target.value)} placeholder="Ex. 50000" className="inp" />
          </Field>
          <Field label="Instructions particulières">
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2}
              placeholder="Contraintes, ton, éléments à éviter…" className="inp resize-none" />
          </Field>
        </Section>

        <Section title="Visuels (optionnel)">
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden"
            onChange={(e) => addFiles(e.target.files)} />
          <div className="grid grid-cols-3 gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                {f.type.startsWith("video")
                  ? <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white text-xs">Vidéo</div>
                  /* eslint-disable-next-line @next/next/no-img-element */
                  : <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />}
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 rounded-full text-xs">×</button>
              </div>
            ))}
            {files.length < 10 && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-2xl text-gray-300">+</button>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Vous pourrez publier le brief à l&apos;équipe une fois enregistré.</p>
        </Section>
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        <button onClick={handleSubmit} disabled={!canSubmit || submitting}
          className="w-full bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
          {submitting ? "Enregistrement…" : "Enregistrer le brief"}
        </button>
      </div>

      <style jsx>{`
        .inp {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: #1f2937;
          outline: none;
        }
        .inp:focus { border-color: #22c55e; }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
      {children}
    </div>
  );
}
function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="text-gray-400 font-normal"> · {hint}</span>}
      </label>
      {children}
    </div>
  );
}
