"use client";

import { useState } from "react";

export interface GainBreakdown {
  state: "paid" | "estimate" | "example";
  basis: string;
  lines: { label: string; detail: string; amount: number }[];
  total: number;
  notes: string[];
}

const fmt = (n: number) =>
  Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 });

/**
 * Détail du calcul du gain (tranches / taux plat, bonus ambassadeur, bonus clics), affiché sous
 * chaque « gain prévu ». Fourni par l'API (gain_breakdown) — même calcul que le paiement réel.
 */
export default function GainBreakdownCard({
  breakdown,
  defaultOpen = false,
  id,
}: {
  breakdown: GainBreakdown | null | undefined;
  defaultOpen?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!breakdown || !breakdown.lines?.length) return null;

  const title =
    breakdown.state === "paid" ? "Détail du gain versé" : "Comment est calculé ton gain";

  return (
    <div id={id} className="rounded-xl border border-green-100 bg-green-50/50 scroll-mt-20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="text-green-800 text-xs font-semibold">{title}</span>
        <span className="text-green-700 text-xs">{open ? "Masquer ▲" : "Voir le détail ▼"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-gray-500 text-[11px]">{breakdown.basis}</p>
          <div className="divide-y divide-green-100">
            {breakdown.lines.map((l, i) => (
              <div key={i} className="flex justify-between items-start gap-3 py-1.5">
                <div className="min-w-0">
                  <p className="text-gray-800 text-xs font-medium">{l.label}</p>
                  <p className="text-gray-500 text-[11px]">{l.detail}</p>
                </div>
                <span className="text-gray-800 text-xs font-semibold whitespace-nowrap tabular-nums">
                  {l.amount < 0 ? "−" : ""}{fmt(Math.abs(l.amount))} F
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2">
              <span className="text-green-800 text-xs font-bold">
                {breakdown.state === "paid" ? "Total versé" : breakdown.state === "example" ? "Total (exemple)" : "Total estimé"}
              </span>
              <span className="text-green-800 text-sm font-bold tabular-nums">{fmt(breakdown.total)} F</span>
            </div>
          </div>
          {breakdown.notes?.length > 0 && (
            <ul className="space-y-1">
              {breakdown.notes.map((n, i) => (
                <li key={i} className="text-gray-500 text-[11px] leading-snug">• {n}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
