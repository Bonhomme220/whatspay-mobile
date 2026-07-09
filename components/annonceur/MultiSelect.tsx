"use client";

import { useMemo, useState } from "react";

export interface Option { id: string; name: string }

export default function MultiSelect({
  label, options, selected, onChange, placeholder = "Rechercher…", required,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const byId = useMemo(() => Object.fromEntries(options.map((o) => [o.id, o.name])), [options]);
  const filtered = useMemo(
    () => options.filter((o) => o.name.toLowerCase().includes(q.trim().toLowerCase())),
    [options, q]
  );

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Chips sélectionnés */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {byId[id] ?? id}
              <button type="button" onClick={() => toggle(id)} className="text-green-500">×</button>
            </span>
          ))}
        </div>
      )}

      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-500">
        <span>{selected.length > 0 ? `${selected.length} sélectionné(s)` : "Choisir…"}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 border border-gray-200 rounded-lg bg-white overflow-hidden">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border-b border-gray-100 focus:outline-none" />
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && <p className="px-3 py-3 text-sm text-gray-400">Aucun résultat</p>}
            {filtered.map((o) => {
              const on = selected.includes(o.id);
              return (
                <button key={o.id} type="button" onClick={() => toggle(o.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-gray-50">
                  <span className={on ? "text-green-700 font-medium" : "text-gray-700"}>{o.name}</span>
                  {on && (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
