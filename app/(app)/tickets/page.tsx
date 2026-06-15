"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message: { message: string; is_admin: boolean; created_at: string } | null;
}

const STATUS_LABEL: Record<string, string> = { open: "Ouvert", closed: "Fermé" };
const STATUS_COLOR: Record<string, string> = {
  open:   "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get<Ticket[]>("/tickets")
      .then(setTickets)
      .catch(() => {}) // 401 géré globalement par wp:unauthorized dans le layout
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-green-600 px-5 pt-5 pb-14">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Mes Tickets</h1>
            <p className="text-white/70 text-sm mt-0.5">Support & assistance</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau
          </button>
        </div>
      </div>

      <div className="mx-4 -mt-6 pb-10 space-y-3">

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">Aucun ticket pour l'instant.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-green-600 text-sm font-semibold"
            >
              Créer mon premier ticket →
            </button>
          </div>
        ) : tickets.map((t) => (
          <Link key={t.id} href={`/tickets/${t.id}`} className="block bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-gray-800 text-sm font-semibold leading-snug flex-1">{t.subject}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[t.status] ?? "bg-gray-100 text-gray-500"}`}>
                {STATUS_LABEL[t.status] ?? t.status}
              </span>
            </div>
            {t.last_message && (
              <p className="text-gray-400 text-xs line-clamp-1">
                {t.last_message.is_admin ? "Support : " : "Vous : "}{t.last_message.message}
              </p>
            )}
            <p className="text-gray-300 text-[10px] mt-2">{fmtDate(t.updated_at)}</p>
          </Link>
        ))}

      </div>

      {showCreate && (
        <CreateTicketSheet
          onClose={() => setShowCreate(false)}
          onSuccess={(id) => { setShowCreate(false); router.push(`/tickets/${id}`); }}
        />
      )}

    </div>
  );
}

// ── CreateTicketSheet ──────────────────────────────────────────────────────────
function CreateTicketSheet({ onClose, onSuccess }: { onClose: () => void; onSuccess: (id: string) => void }) {
  const [subject, setSubject]   = useState("");
  const [message, setMessage]   = useState("");
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await api.post<{ id: string }>("/tickets", { subject, message });
      onSuccess(res.id);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Une erreur est survenue.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="mt-auto w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-6 pb-3 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-gray-800 font-bold text-base">Nouveau ticket</h2>
            <button onClick={onClose} className="text-gray-400 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={submit} className="overflow-y-auto px-5 pb-10 space-y-4 flex-1">
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-red-600 text-xs">{error}</p></div>}
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1.5">Sujet *</label>
            <input
              type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              required minLength={5} maxLength={200}
              placeholder="Résumez votre problème en quelques mots"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1.5">Message *</label>
            <textarea
              value={message} onChange={(e) => setMessage(e.target.value)}
              rows={5} required minLength={10} maxLength={2000}
              placeholder="Décrivez votre problème en détail…"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
            />
            <p className="text-gray-400 text-[10px] mt-1 text-right">{message.length}/2000</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold">Annuler</button>
            <button type="submit" disabled={sending || subject.length < 5 || message.length < 10}
              className="flex-1 py-3.5 rounded-2xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {sending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {sending ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
