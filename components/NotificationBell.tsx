"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";

interface Notif {
  id: string;
  title: string;
  body: string | null;
  data: Record<string, string> | null;
  is_read: boolean;
  created_at: string;
}

function fmtDate(d: string) {
  const date = new Date(d);
  const now   = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH  = Math.floor(diffMs / 3600000);
  const diffM  = Math.floor(diffMs / 60000);
  if (diffM < 1)  return "À l'instant";
  if (diffM < 60) return `Il y a ${diffM} min`;
  if (diffH < 24) return `Il y a ${diffH} h`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export default function NotificationBell() {
  const [notifs, setNotifs]       = useState<Notif[]>([]);
  const [unread, setUnread]       = useState(0);
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const panelRef                  = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ notifications: Notif[]; unread_count: number }>("/notifications");
      setNotifs(res.notifications);
      setUnread(res.unread_count);
    } catch {}
    finally { setLoading(false); }
  }, []);

  // Poll toutes les 60s
  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  // Fermer en cliquant hors du panel
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleOpen() {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      // Mark all read optimistically
      setUnread(0);
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      try { await api.post("/notifications/read-all", {}); } catch {}
    }
  }

  async function handleMarkRead(id: string) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    try { await api.patch(`/notifications/${id}/read`, {}); } catch {}
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button onClick={handleOpen} className="relative text-gray-600 p-1">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] rounded-full min-w-[16px] h-4 flex items-center justify-center font-bold px-0.5">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="text-gray-800 font-bold text-sm">Notifications</p>
            {notifs.some((n) => !n.is_read) && (
              <button
                onClick={async () => {
                  setUnread(0);
                  setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
                  try { await api.post("/notifications/read-all", {}); } catch {}
                }}
                className="text-green-600 text-xs font-semibold"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && notifs.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="py-10 text-center">
                <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-gray-400 text-xs">Aucune notification</p>
              </div>
            ) : notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 flex gap-3 items-start transition-colors ${n.is_read ? "bg-white" : "bg-green-50"}`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? "bg-transparent" : "bg-green-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.is_read ? "text-gray-600 font-normal" : "text-gray-800 font-semibold"}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                  )}
                  <p className="text-gray-300 text-[10px] mt-1">{fmtDate(n.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
