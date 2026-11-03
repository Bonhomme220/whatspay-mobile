"use client";
/**
 * Lieu choisi niveau par niveau, avec les niveaux et noms du pays (« Préfecture », « Commune »…) lus
 * depuis /api/geo (Console › Pays). Chaque liste est filtrée par le choix le plus proche au-dessus.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";

type Level = { id: number | null; code: string; name: string; plural: string; role: number; required: boolean };
type Item = { id: number; name: string };
export type GeoValue = { ids: number[]; missing: string[] };

const ref = (l: Level) => (l.id ? String(l.id) : `role:${l.role}`);

export default function GeoCascade({ countryId, initial, onChange, error }: {
  countryId: string; initial?: number[]; onChange: (v: GeoValue) => void; error?: string;
}) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [lists, setLists] = useState<Record<string, Item[]>>({});
  const [picks, setPicks] = useState<Record<string, number>>({});
  const touched = useRef(false);

  useEffect(() => {
    setLevels([]); setLists({}); setPicks({});
    if (!countryId) return;
    api.get<{ items: Level[] }>(`/geo/countries/${countryId}/levels?context=registration`).then((r) => setLevels(r.items ?? [])).catch(() => setLevels([]));
  }, [countryId]);

  const parentOf = (i: number) => {
    for (let j = i - 1; j >= 0; j--) { const p = picks[ref(levels[j])]; if (p) return p; }
    return null;
  };
  const key = levels.map((l, i) => `${ref(l)}:${parentOf(i) ?? ""}`).join("|");
  useEffect(() => {
    levels.forEach((l, i) => {
      const parent = parentOf(i);
      if (l.role > 2 && !parent) { setLists((s) => ({ ...s, [ref(l)]: [] })); return; }
      const qs = new URLSearchParams({ level: ref(l), limit: "2000" });
      if (parent) qs.set("parent_id", String(parent));
      api.get<{ items: Item[] }>(`/geo/countries/${countryId}/items?${qs}`)
        .then((r) => setLists((s) => ({ ...s, [ref(l)]: r.items ?? [] })))
        .catch(() => setLists((s) => ({ ...s, [ref(l)]: [] })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, countryId]);

  useEffect(() => {
    if (!initial?.length || touched.current) return;
    const found = { ...picks }; let added = false;
    levels.forEach((l) => {
      const hit = !found[ref(l)] && (lists[ref(l)] ?? []).find((it) => initial.includes(it.id));
      if (hit) { found[ref(l)] = hit.id; added = true; }
    });
    if (added) setPicks(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists, levels]);

  const value = useMemo<GeoValue>(() => ({
    ids: levels.map((l) => picks[ref(l)]).filter(Boolean) as number[],
    missing: levels.filter((l) => l.required && !picks[ref(l)]).map((l) => l.name),
  }), [picks, levels]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onChange(value); }, [value]);

  const pick = (i: number, id: string) => {
    touched.current = true;
    const next: Record<string, number> = {};
    levels.forEach((l, j) => { if (j < i && picks[ref(l)]) next[ref(l)] = picks[ref(l)]; });
    if (id) next[ref(levels[i])] = Number(id);
    setPicks(next);
  };

  return (
    <>
      {levels.map((l, i) => {
        const opts = lists[ref(l)] ?? [];
        return (
          <div key={ref(l)}>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">{l.name}{l.required ? " *" : ""}</label>
            <select value={picks[ref(l)] ? String(picks[ref(l)]) : ""} onChange={(e) => pick(i, e.target.value)} disabled={!opts.length}
              className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-700 focus:outline-none focus:border-green-500 transition"
              style={{ backgroundColor: "rgba(43,94,94,0.1)" }}>
              <option value="">{opts.length ? `Sélectionnez : ${l.name.toLowerCase()}` : "Choisissez d'abord le niveau au-dessus"}</option>
              {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        );
      })}
      {error ? <p className="text-red-500 text-xs mt-1">{error}</p> : null}
    </>
  );
}
