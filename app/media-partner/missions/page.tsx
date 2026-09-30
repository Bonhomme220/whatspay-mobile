"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Task {
  id: string; name: string; description: string;
  startdate: string; enddate: string;
  campaign_type: string; media_type: string;
  files: string | null; url: string | null; legend: string | null; client_name: string;
}
export interface Mission {
  id: string; status: string;
  expected_gain: number; gain: number; vues: number; post_link: string | null;
  click_bonus: number; click_bonus_clicks: number | null;
  assignment_date: string | null; response_date: string | null; submission_date: string | null;
  tracking_url: string | null; requires_screenshot: boolean;
  task: Task | null;
}
interface MissionsData {
  disponibles: Mission[]; en_cours: Mission[];
  terminees: Mission[]; gains_cumules: number;
}
interface RecaptureProfile {
  status: "actif" | "inactif" | "off";
  recapture_window_open: boolean;
  recapture_needed: boolean;
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
const fmtMoney = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));

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

const CAMPAIGN_TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  conversion: { label: "🎯 Conversion", cls: "bg-orange-100 text-orange-700" },
  notoriete:  { label: "📢 Notoriété",  cls: "bg-white/15 text-white" },
};

type Tab = "disponibles" | "en_cours" | "terminees";

// ── Thumbnail ──────────────────────────────────────────────────────────────────
function MediaThumb({ task }: { task: Task | null }) {
  if (!task) return <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0" />;
  const isImg = task.media_type === "image" || (task.files ?? "").match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
  const isVid = task.media_type === "video" || (task.files ?? "").match(/\.(mp4|mov|webm|avi|mkv)(\?|$)/i);

  if (task.files && isImg) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={task.files} alt={task.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-gray-100" />;
  }
  return (
    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
      {isVid ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
      ) : task.media_type === "pdf" ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h7" /></svg>
      )}
    </div>
  );
}

function CampaignTypeBadge({ type, dark }: { type: string; dark?: boolean }) {
  const b = CAMPAIGN_TYPE_BADGE[type];
  if (!b) return null;
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${dark ? b.cls : b.cls}`}>
      {b.label}
    </span>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MediaPartnerMissionsPage() {
  const router = useRouter();
  const [tab, setTab]       = useState<Tab>("disponibles");
  const [data, setData]     = useState<MissionsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [recapture, setRecapture] = useState<RecaptureProfile | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get<MissionsData>("/media-partner/missions")
      .then(setData)
      .catch(() => {}) // 401 géré globalement dans lib/api.ts
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Appel léger dédié (pas de cache partagé nécessaire ici) pour savoir si une
  // bannière de rappel de recapture mensuelle doit s'afficher.
  useEffect(() => {
    api.get<RecaptureProfile>("/media-partner/profile").then(setRecapture).catch(() => {});
  }, []);

  async function handleAccept(id: string) {
    setAccepting(id);
    try {
      await api.post(`/media-partner/missions/${id}/accept`, {});
      router.push(`/media-partner/missions/${id}`);
    } catch (err: any) {
      alert(err?.message ?? "Impossible d'accepter la mission. Elle a peut-être déjà été traitée.");
      load();
    } finally {
      setAccepting(null);
    }
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
      <div className="bg-green-600 px-5 pt-5 pb-6">
        <h1 className="text-white text-2xl font-bold">Mes Missions</h1>
        <p className="text-green-100 text-sm mt-0.5">Partenaire Média — sponsoring de votre chaîne WhatsApp</p>

        {/* Gains cumulés — mis en avant */}
        <div className="mt-4 rounded-2xl px-4 py-3.5 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.15)" }}>
          <div>
            <p className="text-green-100 text-[10px] uppercase tracking-wider font-semibold">Gains cumulés</p>
            <p className="text-white text-2xl font-bold mt-0.5">
              {loading ? "…" : `${fmtMoney(data?.gains_cumules ?? 0)} F`}
            </p>
          </div>
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

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
      <div className="mx-4 -mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
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
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rappel de recapture mensuelle */}
      {recapture?.recapture_needed && (
        <div className="px-4 pt-4">
          <RecaptureBanner profile={recapture} />
        </div>
      )}

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
            {tab === "en_cours" && <EnCoursTab missions={data.en_cours} />}
            {tab === "terminees" && <TermineesTab missions={data.terminees} />}
          </>
        )}
      </div>
    </div>
  );
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
        <p className="text-blue-700 text-xs">Acceptez une mission pour découvrir le média à publier sur votre chaîne.</p>
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
  const days = t.enddate ? daysLeft(t.enddate) : 0;

  return (
    <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-50">
      <div className="flex gap-3">
        <MediaThumb task={t} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-gray-800 font-semibold text-sm flex-1 min-w-0 truncate">{t.name}</h3>
            <span className="text-green-700 font-bold text-sm whitespace-nowrap">{fmtMoney(m.expected_gain)} F</span>
          </div>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{t.client_name}</p>
          <div className="mt-1.5">
            <CampaignTypeBadge type={t.campaign_type} />
          </div>
        </div>
      </div>

      <p className="text-gray-500 text-xs mt-2.5 leading-relaxed line-clamp-2">{t.description}</p>

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          Accepter
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
    <Link href={`/media-partner/missions/${m.id}`} className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
      <div className="flex gap-3">
        <MediaThumb task={t} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-gray-800 font-semibold text-sm flex-1 min-w-0 truncate">{t.name}</h3>
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap ${STATUS_COLOR[m.status] ?? "bg-gray-100 text-gray-600"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[m.status] ?? "bg-gray-400"}`} />
              {STATUS_LABEL[m.status]}
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{t.client_name}</p>
          <div className="mt-1.5"><CampaignTypeBadge type={t.campaign_type} /></div>
        </div>
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
          <span>Gain prévu {fmtMoney(m.expected_gain)} F</span>
        </div>
      </div>
    </Link>
  );
}

// ── Terminées ──────────────────────────────────────────────────────────────────
function TermineesTab({ missions }: { missions: Mission[] }) {
  if (!missions.length)
    return <EmptyState text="Aucune mission terminée." />;

  return (
    <div className="space-y-0 divide-y divide-gray-100">
      {missions.map((m) => (
        <TermineeCard key={m.id} mission={m} />
      ))}
    </div>
  );
}

function TermineeCard({ mission: m }: { mission: Mission }) {
  const t = m.task;
  if (!t) return null;
  const isGain = m.status === "SUBMISSION_ACCEPTED";
  return (
    <Link href={`/media-partner/missions/${m.id}`} className="block bg-white py-3.5 px-4 first:rounded-t-2xl last:rounded-b-2xl shadow-sm">
      <div className="flex gap-3">
        <MediaThumb task={t} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-gray-800 font-semibold text-sm truncate">{t.name}</h3>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap ${STATUS_COLOR[m.status] ?? "bg-gray-100 text-gray-600"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[m.status] ?? "bg-gray-400"}`} />
              {STATUS_LABEL[m.status]}
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{t.client_name}</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className={`font-semibold text-xs ${isGain ? "text-green-600" : "text-gray-500"}`}>
              {isGain ? "+" : ""}{fmtMoney(m.gain || m.expected_gain)} F
            </span>
            <span className="text-gray-400 text-[10px]">{fmtDate(t.startdate)} – {fmtDate(t.enddate)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Bannière de rappel de recapture mensuelle ─────────────────────────────────
function RecaptureBanner({ profile }: { profile: RecaptureProfile }) {
  const urgent = profile.status === "inactif" || profile.status === "off";
  const title = urgent
    ? `Compte ${profile.status} — mettez à jour vos chiffres`
    : profile.recapture_window_open
      ? "La fenêtre de recapture est ouverte"
      : "Mettez à jour les chiffres de votre chaîne";
  const subtitle = urgent
    ? "Une recapture valide réactive votre compte automatiquement."
    : profile.recapture_window_open
      ? "Soumettez vos chiffres du mois avant la fermeture de la fenêtre (5-10 du mois)."
      : "Vous pouvez déjà soumettre vos chiffres par anticipation.";

  return (
    <Link
      href="/media-partner/recapture"
      className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-sm border mb-1 ${
        urgent ? "bg-orange-50 border-orange-100" : "bg-white border-gray-50"
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${urgent ? "bg-orange-100" : "bg-green-100"}`}>
        <svg className={`w-5 h-5 ${urgent ? "text-orange-600" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2a4 4 0 014-4h3m0 0l-3-3m3 3l-3 3M5 5h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${urgent ? "text-orange-700" : "text-gray-800"}`}>📋 {title}</p>
        <p className={`text-xs mt-0.5 ${urgent ? "text-orange-600" : "text-gray-500"}`}>{subtitle}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
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
