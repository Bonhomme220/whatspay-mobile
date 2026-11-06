"use client";
/**
 * Suivi d'un retrait (ou d'une commande), entièrement décrit par le serveur (App\Support\OrderProgress) :
 * état, étapes datées, délai habituel, phrase rassurante et action attendue.
 */
import { useEffect, useState } from "react";

export type ProgressStep = { label: string; status: "done" | "current" | "todo" | "action" | "failed"; at?: string | null };
export type Progress = {
  state: "waiting" | "action" | "done" | "failed";
  title: string;
  message: string;
  steps: ProgressStep[];
  eta?: string | null;
  reassurance?: string | null;
  action?: { kind: string; label: string } | null;
  started_at?: string | null;
  poll?: number | null;
};

function elapsed(since: string | null | undefined, now: number): string | null {
  if (!since) return null;
  const s = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 172800) return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
  return `${Math.floor(s / 86400)} j ${Math.floor((s % 86400) / 3600)} h`;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const DOT: Record<ProgressStep["status"], string> = {
  done: "bg-green-600 text-white",
  current: "bg-blue-100 text-blue-600",
  action: "bg-amber-500 text-white",
  failed: "bg-red-500 text-white",
  todo: "bg-gray-100 text-gray-300",
};
const ICON: Record<ProgressStep["status"], string> = { done: "✓", current: "•", action: "!", failed: "✕", todo: "" };

export default function OrderProgress({ progress, onAction }: { progress: Progress; onAction?: (kind: string) => void }) {
  const live = progress.state === "waiting" || progress.state === "action";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [live]);
  const since = live ? elapsed(progress.started_at, now) : null;
  const tone = progress.state === "action" ? "text-amber-700" : progress.state === "failed" ? "text-red-700" : progress.state === "done" ? "text-green-700" : "text-gray-800";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="relative flex h-3 w-3 mt-1.5 flex-shrink-0">
          {live && <span className={`motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${progress.state === "action" ? "bg-amber-400" : "bg-blue-400"}`} />}
          <span className={`relative inline-flex rounded-full h-3 w-3 ${progress.state === "action" ? "bg-amber-500" : progress.state === "done" ? "bg-green-600" : progress.state === "failed" ? "bg-red-500" : "bg-blue-500"}`} />
        </span>
        <div className="min-w-0">
          <p className={`font-semibold text-sm ${tone}`}>{progress.title}</p>
          <p className="text-gray-500 text-xs mt-0.5">{progress.message}{since ? ` · depuis ${since}` : ""}</p>
        </div>
      </div>

      <ol className="mt-3 space-y-2">
        {progress.steps.map((st, i) => (
          <li key={`${i}-${st.label}`} className="flex items-center gap-3">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${DOT[st.status]}`}>{ICON[st.status]}</span>
            <span className={`text-xs ${st.status === "todo" ? "text-gray-400" : st.status === "action" ? "text-amber-700 font-semibold" : "text-gray-800 font-medium"}`}>{st.label}</span>
            {st.at && <span className="text-[11px] text-gray-400 ml-auto">{fmtDate(st.at)}</span>}
          </li>
        ))}
      </ol>

      {progress.eta && <p className="text-[11px] text-gray-500 mt-3">{progress.eta}</p>}
      {progress.reassurance && <p className="text-[11px] text-green-800 bg-green-50 rounded-xl px-3 py-2 mt-2">{progress.reassurance}</p>}
      {progress.action && onAction && (
        <button onClick={() => onAction(progress.action!.kind)}
          className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl py-2.5 transition-colors">
          {progress.action.label}
        </button>
      )}
    </div>
  );
}
