"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";

interface Message { id: string; message: string; is_admin: boolean; created_at: string; }
interface TicketDetail {
  id: string; subject: string; status: string; created_at: string;
  messages: Message[];
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TicketDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [ticket, setTicket]   = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply]     = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api.get<TicketDetail>(`/tickets/${id}`)
      .then((t) => { setTicket(t); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100); })
      .catch(() => {}) // 401 géré globalement par wp:unauthorized dans le layout
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.post(`/tickets/${id}/reply`, { message: reply });
      setReply("");
      load();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!ticket) return null;

  const isClosed = ticket.status === "closed";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Hero */}
      <div className="bg-green-600 px-5 pt-5 pb-6 flex-shrink-0">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/80 text-sm mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-white font-bold text-base leading-snug flex-1">{ticket.subject}</h1>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${isClosed ? "bg-white/20 text-white" : "bg-white text-green-700"}`}>
            {isClosed ? "Fermé" : "Ouvert"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-32">
        {ticket.messages.map((m) => (
          <div key={m.id} className={`flex ${m.is_admin ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.is_admin ? "bg-white shadow-sm rounded-tl-sm" : "bg-green-600 rounded-tr-sm"}`}>
              {m.is_admin && (
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide mb-1">Support WhatsPAY</p>
              )}
              <p className={`text-sm leading-relaxed whitespace-pre-line ${m.is_admin ? "text-gray-700" : "text-white"}`}>{m.message}</p>
              <p className={`text-[10px] mt-1.5 ${m.is_admin ? "text-gray-300" : "text-green-200"}`}>{fmtDate(m.created_at)}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        {isClosed ? (
          <p className="text-center text-gray-400 text-xs py-1">Ce ticket est fermé.</p>
        ) : (
          <form onSubmit={sendReply} className="flex gap-2">
            {error && <p className="text-red-500 text-xs absolute -top-6 left-4">{error}</p>}
            <input
              type="text" value={reply} onChange={(e) => setReply(e.target.value)}
              placeholder="Votre message…"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
            <button
              type="submit"
              disabled={sending || reply.trim().length < 2}
              className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0"
            >
              {sending
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
              }
            </button>
          </form>
        )}
      </div>

    </div>
  );
}
