// Helpers partagés de l'espace annonceur (formatage + statuts campagne).

export const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));

export function fmtCompact(n: number): string {
  n = n || 0;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + " M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + " k";
  return fmt(n);
}

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export interface StatusMeta { label: string; cls: string; dot: string }

export const CAMPAIGN_STATUS: Record<string, StatusMeta> = {
  ACCEPTED: { label: "Acceptée",   cls: "bg-green-50 text-green-700", dot: "bg-green-500" },
  PAID:     { label: "Active",     cls: "bg-green-50 text-green-700", dot: "bg-green-500" },
  PENDING:  { label: "En attente", cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  CLOSED:   { label: "Terminée",   cls: "bg-gray-100 text-gray-600",  dot: "bg-gray-400" },
  REJECTED: { label: "Rejetée",    cls: "bg-red-50 text-red-600",     dot: "bg-red-500" },
};

export const statusMeta = (s: string): StatusMeta =>
  CAMPAIGN_STATUS[s] ?? { label: s, cls: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };

export const isVideo = (mediaType?: string | null, url?: string | null) =>
  mediaType === "video" || mediaType === "video_link" || !!url?.match(/\.(mp4|mov|webm|avi|mkv)(\?|$)/i);

export const isImage = (mediaType?: string | null, url?: string | null) =>
  mediaType === "image" || mediaType === "image_link" || !!url?.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);

// ── Briefs ─────────────────────────────────────────────────────────────────────
export const BRIEF_OBJECTIVES: { value: string; label: string }[] = [
  { value: "brand_awareness", label: "Faire connaître ma marque" },
  { value: "traffic", label: "Générer des clics / du trafic" },
  { value: "sales", label: "Promouvoir mes ventes" },
];

export const BRIEF_STATUS: Record<string, StatusMeta> = {
  draft:            { label: "Brouillon",             cls: "bg-gray-100 text-gray-600",   dot: "bg-gray-400" },
  pending:          { label: "En attente",            cls: "bg-amber-50 text-amber-700",  dot: "bg-amber-500" },
  in_review:        { label: "En cours de traitement", cls: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500" },
  rejected:         { label: "À corriger",            cls: "bg-red-50 text-red-600",      dot: "bg-red-500" },
  campaign_created: { label: "Campagne créée",        cls: "bg-green-50 text-green-700",  dot: "bg-green-500" },
};

export const briefStatusMeta = (s: string): StatusMeta =>
  BRIEF_STATUS[s] ?? { label: s, cls: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };

export interface BriefMedia {
  id: string; url: string; mime_type: string; original_name: string;
  size: number; is_image: boolean; is_video: boolean;
}
export interface Brief {
  id: string; name: string; objective: string; objective_label: string;
  description: string; target_audience: string; link: string | null;
  preferred_start_date: string | null; duration_days: number | null;
  target_impressions: number | null; estimated_budget: number | null;
  special_instructions: string | null; status: string; status_label: string;
  admin_note: string | null; published_at: string | null; created_at: string;
  media: BriefMedia[];
}
