"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { fmt } from "@/lib/annonceur";
import MultiSelect, { type Option } from "@/components/annonceur/MultiSelect";

const VIEW_PRICE = 3.5;      // F / vue (aligné backend)
const MIN_PER_DAY = 2500;    // budget minimum par jour

type MediaType = "image" | "video" | "image_link" | "video_link";

interface EstimateResp { error: boolean; eligible_count: number; total_views_per_day: number }

export default function NouvelleCampagnePage() {
  const router = useRouter();

  // Référentiels
  const [localities, setLocalities] = useState<Option[]>([]);
  const [occupations, setOccupations] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);

  // Champs
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [legend, setLegend] = useState("");
  const [startdate, setStartdate] = useState("");
  const [enddate, setEnddate] = useState("");
  const [budget, setBudget] = useState("");
  const [selLoc, setSelLoc] = useState<string[]>([]);
  const [selOcc, setSelOcc] = useState<string[]>([]);
  const [selCat, setSelCat] = useState<string[]>([]);

  const [estimate, setEstimate] = useState<EstimateResp | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Chargement référentiels
  useEffect(() => {
    api.get<Option[]>("/categories").then(setCategories).catch(() => {});
    api.get<Option[]>("/occupations").then(setOccupations).catch(() => {});
    api.get<{ data: Option[] }>("/localities").then((r) => setLocalities(r.data ?? [])).catch(() => {});
  }, []);

  // Estimation d'audience (débounce) selon le ciblage
  useEffect(() => {
    if (selLoc.length === 0 && selOcc.length === 0 && selCat.length === 0) { setEstimate(null); return; }
    const t = setTimeout(() => {
      api.post<EstimateResp>("/tasks/estimate-views", {
        localities: selLoc, occupations: selOcc, categories: selCat,
      }).then(setEstimate).catch(() => setEstimate(null));
    }, 500);
    return () => clearTimeout(t);
  }, [selLoc, selOcc, selCat]);

  const nbDays = useMemo(() => {
    if (!startdate || !enddate) return 0;
    const d = Math.round((new Date(enddate).getTime() - new Date(startdate).getTime()) / 86400000) + 1;
    return d > 0 ? d : 0;
  }, [startdate, enddate]);

  const minBudget = nbDays > 0 ? MIN_PER_DAY * nbDays : MIN_PER_DAY;
  const budgetNum = parseFloat(budget) || 0;
  const estimatedViews = budgetNum > 0 ? Math.floor(budgetNum / VIEW_PRICE) : 0;

  const needsFile = mediaType === "image" || mediaType === "video";
  const needsUrl = mediaType === "image_link" || mediaType === "video_link";

  function onPickFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  const canSubmit =
    name.trim() && legend.trim() && startdate && enddate && nbDays > 0 &&
    budgetNum >= minBudget && selLoc.length > 0 && selOcc.length > 0 &&
    (needsFile ? !!file : true) && (needsUrl ? !!url.trim() : true);

  async function handleSubmit() {
    setError("");
    if (!canSubmit) { setError("Complétez tous les champs requis."); return; }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("name", name.trim());
      if (description.trim()) form.append("descriptipon", description.trim());
      form.append("media_type", mediaType);
      if (needsUrl) form.append("url", url.trim());
      if (needsFile && file) form.append("campaign_files", file);
      form.append("legend", legend.trim());
      form.append("startdate", startdate);
      form.append("enddate", enddate);
      form.append("budget", String(budgetNum));
      selLoc.forEach((id) => form.append("localities[]", id));
      selOcc.forEach((id) => form.append("occupations[]", id));
      selCat.forEach((id) => form.append("categories[]", id));

      const res = await api.postForm<{ task_id: string }>("/announcer/campaigns", form);
      router.replace(`/annonceur/campagnes/${res.task_id}`);
    } catch (e: any) {
      if (e?.insufficient_funds) {
        router.push("/annonceur/portefeuille");
        return;
      }
      setError(e?.message ?? "Impossible de créer la campagne.");
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Nouvelle campagne</h1>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">{error}</div>
      )}

      <div className="px-4 mt-3 space-y-4">
        {/* MÉDIA */}
        <Section title="Média">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {([
              ["image", "Image"], ["video", "Vidéo"], ["image_link", "Img+lien"], ["video_link", "Vid+lien"],
            ] as [MediaType, string][]).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setMediaType(v)}
                className={`py-2 rounded-lg text-xs font-medium border ${
                  mediaType === v ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500 border-gray-200"
                }`}>{l}</button>
            ))}
          </div>

          {needsFile && (
            <div>
              <input ref={fileRef} type="file" accept={mediaType === "video" ? "video/*" : "image/*"} className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />
              {preview ? (
                <div className="relative">
                  {mediaType === "video"
                    ? <video src={preview} className="w-full max-h-56 rounded-xl bg-black object-contain" controls playsInline />
                    /* eslint-disable-next-line @next/next/no-img-element */
                    : <img src={preview} alt="" className="w-full max-h-56 rounded-xl object-cover" />}
                  <button type="button" onClick={() => onPickFile(null)}
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">Changer</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 text-center text-sm text-gray-400">
                  <div className="text-2xl mb-1">📎</div>
                  Ajouter {mediaType === "video" ? "une vidéo" : "une image"}
                </button>
              )}
            </div>
          )}

          {needsUrl && (
            <Input label="Lien du média" value={url} onChange={setUrl} placeholder="https://…" type="url" required />
          )}

          <div className="mt-3">
            <Textarea label="Légende" value={legend} onChange={setLegend} placeholder="Texte accompagnant le statut" required />
          </div>
        </Section>

        {/* INFOS */}
        <Section title="Informations">
          <Input label="Nom de la campagne" value={name} onChange={setName} placeholder="Ex. Promo rentrée 2026" required />
          <div className="mt-3">
            <Textarea label="Description (optionnel)" value={description} onChange={setDescription} placeholder="Contexte de la campagne" />
          </div>
        </Section>

        {/* PÉRIODE */}
        <Section title="Période">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Début" value={startdate} onChange={setStartdate} type="date" required />
            <Input label="Fin" value={enddate} onChange={setEnddate} type="date" required />
          </div>
          {nbDays > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {nbDays} jour(s) · budget minimum <b>{fmt(minBudget)} F</b>
            </p>
          )}
        </Section>

        {/* BUDGET */}
        <Section title="Budget">
          <Input label="Budget total (F CFA)" value={budget} onChange={setBudget} type="number" placeholder={String(minBudget)} required />
          {budgetNum > 0 && (
            <div className="mt-2 bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-800 font-semibold">≈ {fmt(estimatedViews)} vues visées</p>
              <p className="text-xs text-green-600">à {VIEW_PRICE} F / vue</p>
              {budgetNum < minBudget && (
                <p className="text-xs text-red-500 mt-1">Budget sous le minimum ({fmt(minBudget)} F).</p>
              )}
            </div>
          )}
        </Section>

        {/* CIBLAGE */}
        <Section title="Ciblage">
          <MultiSelect label="Localités" options={localities} selected={selLoc} onChange={setSelLoc} required />
          <div className="mt-3">
            <MultiSelect label="Professions" options={occupations} selected={selOcc} onChange={setSelOcc} required />
          </div>
          <div className="mt-3">
            <MultiSelect label="Catégories (optionnel)" options={categories} selected={selCat} onChange={setSelCat} />
          </div>

          {estimate && !estimate.error && (
            <div className="mt-3 bg-indigo-50 rounded-lg p-3">
              <p className="text-sm text-indigo-800 font-semibold">{fmt(estimate.eligible_count)} diffuseurs éligibles</p>
              <p className="text-xs text-indigo-500">≈ {fmt(estimate.total_views_per_day)} vues potentielles / jour</p>
            </div>
          )}
        </Section>
      </div>

      {/* Barre de soumission fixe */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        <button onClick={handleSubmit} disabled={!canSubmit || submitting}
          className="w-full bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
          {submitting ? "Création…" : "Créer la campagne"}
        </button>
      </div>
    </div>
  );
}

// ── UI atoms ─────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h2 className="font-bold text-gray-900 text-sm mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-500" />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-500 resize-none" />
    </div>
  );
}
