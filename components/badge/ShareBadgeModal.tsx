"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import BadgeCard, { type BadgeData } from "./BadgeCard";

const PREVIEW = 320; // largeur d'aperçu en px

export default function ShareBadgeModal({ data, onClose }: { data: BadgeData; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(data.photoDataUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const scale = PREVIEW / 1080;

  function pickPhoto(f: File | null) {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function render(): Promise<File | null> {
    if (!cardRef.current) return null;
    // Laisse le temps aux images (photo/logo) de se charger avant capture
    await new Promise((r) => setTimeout(r, 120));
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 1, cacheBust: true });
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], "badge-whatspay.png", { type: "image/png" });
  }

  async function share() {
    setBusy(true); setNote("");
    try {
      const file = await render();
      if (!file) throw new Error("render");
      const navAny = navigator as unknown as { canShare?: (d: unknown) => boolean; share?: (d: unknown) => Promise<void> };
      if (navAny.share && navAny.canShare && navAny.canShare({ files: [file] })) {
        await navAny.share({ files: [file], title: "Mon badge WhatsPAY" });
      } else {
        download(file);
        setNote("Image téléchargée — partage-la sur ton Statut WhatsApp.");
      }
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name !== "AbortError") setNote("Impossible de partager. Réessaie ou télécharge l'image.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadOnly() {
    setBusy(true); setNote("");
    try {
      const file = await render();
      if (file) { download(file); setNote("Image téléchargée."); }
    } catch { setNote("Échec du téléchargement."); }
    finally { setBusy(false); }
  }

  function download(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url; a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  const cardData: BadgeData = { ...data, photoDataUrl: photo };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">Mon badge WhatsPAY</h2>
        <p className="text-sm text-gray-500 mb-4">Partage-le sur ton Statut WhatsApp.</p>

        {/* Aperçu */}
        <div className="flex justify-center mb-4">
          <div
            style={{ width: PREVIEW, height: PREVIEW, overflow: "hidden", borderRadius: 16 }}
            className="shadow-lg border border-gray-100"
          >
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <BadgeCard ref={cardRef} data={cardData} />
            </div>
          </div>
        </div>

        {/* Photo */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)} />
        <div className="flex gap-2 mb-3">
          <button onClick={() => fileRef.current?.click()} className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm">
            {photo ? "Changer la photo" : "Ajouter ma photo"}
          </button>
          {photo && (
            <button onClick={() => setPhoto(null)} className="px-4 border border-gray-200 text-gray-500 rounded-xl text-sm">Retirer</button>
          )}
        </div>

        {note && <p className="text-xs text-center text-gray-500 mb-2">{note}</p>}

        <div className="flex gap-2">
          <button onClick={downloadOnly} disabled={busy} className="px-4 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl disabled:opacity-50">
            Télécharger
          </button>
          <button onClick={share} disabled={busy} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
            {busy ? "Préparation…" : "Partager mon badge"}
          </button>
        </div>
      </div>
    </div>
  );
}
