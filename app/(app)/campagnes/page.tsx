"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import GreenTopBar from "@/components/GreenTopBar";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Task {
  id: string; name: string; description: string;
  startdate: string; enddate: string; type: string;
  files: string | null; legend: string | null;
  client_name: string; categories: { id: string; name: string }[];
  slots_used: number;
}
interface Mission {
  id: string; status: string; expected_gain: number; gain: number;
  assignment_date: string; response_date: string | null;
  submission_date: string | null; tracking_url: string | null;
  task: Task | null;
}
interface MissionsData {
  disponibles: Mission[]; en_cours: Mission[];
  terminees: Mission[]; gains_cumules: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function daysLeft(enddate: string) {
  const diff = new Date(enddate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}
function progressPct(enddate: string, startdate: string) {
  const total = new Date(enddate).getTime() - new Date(startdate).getTime();
  const elapsed = Date.now() - new Date(startdate).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: "Disponible", PENDING: "En cours", SUBMITED: "Soumise",
  SUBMISSION_ACCEPTED: "Terminée", SUBMISSION_REJECTED: "Rejetée", EXPIRED: "Expirée",
};
const STATUS_COLOR: Record<string, string> = {
  SUBMITED: "bg-orange-100 text-orange-600",
  PENDING: "bg-blue-100 text-blue-600",
  SUBMISSION_ACCEPTED: "bg-green-100 text-green-700",
  SUBMISSION_REJECTED: "bg-red-100 text-red-600",
  EXPIRED: "bg-red-100 text-red-600",
};
const STATUS_DOT: Record<string, string> = {
  SUBMISSION_ACCEPTED: "bg-green-500",
  SUBMITED: "bg-orange-500",
  SUBMISSION_REJECTED: "bg-red-500",
  EXPIRED: "bg-red-500",
};

type Tab = "disponibles" | "en_cours" | "terminees";

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CampagnesPage() {
  const router = useRouter();
  const [tab, setTab]       = useState<Tab>("disponibles");
  const [data, setData]     = useState<MissionsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get<MissionsData>("/missions")
      .then(setData)
      .catch((e) => { if (e?.status === 401) router.push("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function handleAccept(id: string) {
    setAccepting(id);
    try {
      await api.post("/missions/" + id + "/accept", {});
      load();
    } catch {}
    setAccepting(null);
  }

  const counts = data
    ? { disponibles: data.disponibles.length, en_cours: data.en_cours.length, terminees: data.terminees.length }
    : { disponibles: 0, en_cours: 0, terminees: 0 };

  const TABS: { key: Tab; label: string }[] = [
    { key: "disponibles", label: "Disponibles" },
    { key: "en_cours",    label: "En cours" },
    { key: "terminees",   label: "Terminées" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header */}
      <div className="bg-green-600 px-5 pt-5 pb-14">
        <h1 className="text-white text-2xl font-bold">Mes Missions</h1>
        <p className="text-green-100 text-sm mt-0.5">Gérez vos campagnes publicitaires</p>

        {/* Count chips */}
        <div className="flex gap-3 mt-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 py-2 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <div className="text-white font-bold text-lg">{counts[t.key]}</div>
              <div className="text-green-100 text-[10px] mt-0.5">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar (overlapping hero) */}
      <div className="mx-4 -mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-xs font-semibold transition-colors relative ${
                  active ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {active && (
                  <span className="absolute top-1.5 right-2.5 text-[10px] font-bold bg-white text-green-600 rounded-full w-4 h-4 flex items-center justify-center">
                    {counts[t.key]}
                  </span>
                )}
                <div className="flex flex-col items-center gap-0.5">
                  <TabIcon tab={t.key} active={active} />
                  <span>{t.label}</span>
                  {!active && <span className="text-[10px] text-gray-400">{counts[t.key]}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data ? null : (
          <>
            {tab === "disponibles" && (
              <DisponiblesTab missions={data.disponibles} onAccept={handleAccept} accepting={accepting} />
            )}
            {tab === "en_cours" && (
              <EnCoursTab missions={data.en_cours} />
            )}
            {tab === "terminees" && (
              <TermineesTab missions={data.terminees} gainsCumules={data.gains_cumules} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab icon ───────────────────────────────────────────────────────────────────
function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  const c = `w-4 h-4 ${active ? "text-white" : "text-gray-400"}`;
  if (tab === "disponibles") return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
  if (tab === "en_cours")    return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

// ── Disponibles ────────────────────────────────────────────────────────────────
function DisponiblesTab({ missions, onAccept, accepting }: {
  missions: Mission[]; onAccept: (id: string) => void; accepting: string | null;
}) {
  if (!missions.length)
    return <EmptyState text="Aucune mission disponible pour le moment." />;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-3">
        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-blue-700 text-xs">Rejoignez une mission avant sa date limite pour gagner des FCFA.</p>
      </div>

      {missions.map((m) => (
        <DispoCard key={m.id} mission={m} onAccept={onAccept} accepting={accepting} />
      ))}
    </div>
  );
}

function DispoCard({ mission: m, onAccept, accepting }: {
  mission: Mission; onAccept: (id: string) => void; accepting: string | null;
}) {
  const t = m.task;
  if (!t) return null;
  const pct = t.startdate && t.enddate ? progressPct(t.enddate, t.startdate) : 0;
  const days = t.enddate ? daysLeft(t.enddate) : 0;

  return (
    <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-50">
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-gray-800 font-semibold text-sm flex-1 mr-2">{t.name}</h3>
        <span className="text-green-700 font-bold text-sm whitespace-nowrap">{m.expected_gain} F</span>
      </div>

      {t.categories[0] && (
        <span className="text-green-600 text-xs font-semibold">{t.categories[0].name}</span>
      )}

      <p className="text-gray-500 text-xs mt-2 leading-relaxed line-clamp-2">{t.description}</p>

      {/* Progress bar (temps restant) */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>Places restantes</span>
          <span>{t.slots_used} utilisées</span>
        </div>
        <div className="bg-gray-100 rounded-full h-1.5">
          <div className="bg-green-500 rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Expire le {fmtDate(t.enddate)}{days > 0 ? ` · J-${days}` : ""}</span>
        </div>
        <button
          onClick={() => onAccept(m.id)}
          disabled={accepting === m.id}
          className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-60 transition"
        >
          {accepting === m.id ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          )}
          Participer
        </button>
      </div>
    </div>
  );
}

// ── En cours ───────────────────────────────────────────────────────────────────
function EnCoursTab({ missions }: { missions: Mission[] }) {
  if (!missions.length)
    return <EmptyState text="Aucune mission en cours." />;

  return (
    <div className="space-y-3">
      {missions.map((m) => (
        <EnCoursCard key={m.id} mission={m} />
      ))}
    </div>
  );
}

function EnCoursCard({ mission: m }: { mission: Mission }) {
  const t = m.task;
  if (!t) return null;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
      <div className="flex justify-between items-start mb-1">
        <div>
          <h3 className="text-gray-800 font-semibold text-sm">{t.name}</h3>
          <p className="text-gray-400 text-xs mt-0.5">{t.type ?? "image_link"}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${STATUS_COLOR[m.status] ?? "bg-gray-100 text-gray-600"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[m.status] ?? "bg-gray-400"}`} />
          {STATUS_LABEL[m.status]}
        </span>
      </div>

      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Fin {fmtDate(t.enddate)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Gain {m.expected_gain} F</span>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <Link
          href={`/campagnes/${m.id}`}
          className="flex-1 text-center py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold"
        >
          Détails
        </Link>
        <Link
          href={`/campagnes/${m.id}`}
          className="flex-1 text-center py-2.5 rounded-xl bg-green-600 text-white text-xs font-semibold"
        >
          Résultat
        </Link>
      </div>
    </div>
  );
}

// ── Terminées ──────────────────────────────────────────────────────────────────
function TermineesTab({ missions, gainsCumules }: { missions: Mission[]; gainsCumules: number }) {
  if (!missions.length)
    return <EmptyState text="Aucune mission terminée." />;

  return (
    <div>
      {/* Gains cumulés */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs">Gains cumulés</p>
          <p className="text-green-600 text-xl font-bold mt-0.5">+{gainsCumules.toLocaleString("fr-FR")} F</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <div className="space-y-0 divide-y divide-gray-100">
        {missions.map((m) => (
          <TermineeCard key={m.id} mission={m} />
        ))}
      </div>
    </div>
  );
}

function TermineeCard({ mission: m }: { mission: Mission }) {
  const t = m.task;
  if (!t) return null;
  const isGain = m.status === "SUBMISSION_ACCEPTED";
  return (
    <div className="bg-white py-3.5 px-4 first:rounded-t-2xl last:rounded-b-2xl shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 mr-2">
          <h3 className="text-gray-800 font-semibold text-sm truncate">{t.name}</h3>
          <p className="text-gray-400 text-xs mt-0.5">
            {t.type ?? "image_link"} · {fmtDate(t.startdate)} – {fmtDate(t.enddate)}
          </p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap ${STATUS_COLOR[m.status] ?? "bg-gray-100 text-gray-600"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[m.status] ?? "bg-gray-400"}`} />
          {STATUS_LABEL[m.status]}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1 text-xs">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`font-semibold ${isGain ? "text-green-600" : "text-gray-500"}`}>
            {isGain ? "+" : ""}{m.gain || m.expected_gain} F
          </span>
        </div>
        <Link href={`/campagnes/${m.id}`} className="flex items-center gap-1 text-green-600 text-xs font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Voir
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}
