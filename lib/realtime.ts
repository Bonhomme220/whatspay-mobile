/**
 * Messagerie instantanée (Laravel Reverb, wss://ws.whatspay.africa). Connexion ouverte seulement si le serveur
 * l'annonce active (GET /realtime) ; sinon les écrans gardent leur interrogation périodique. Canaux privés
 * autorisés avec le jeton de connexion (POST /broadcasting/auth).
 */
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { api } from "@/lib/api";

type Cfg = { enabled: boolean; key?: string; host?: string; port?: number; scheme?: string };
let echo: Echo<"reverb"> | null = null;
let loading: Promise<Echo<"reverb"> | null> | null = null;

export function realtime(): Promise<Echo<"reverb"> | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (echo) return Promise.resolve(echo);
  if (loading) return loading;
  loading = (async () => {
    try {
      const cfg = await api.get<Cfg>("/realtime");
      if (!cfg?.enabled) return null;
      (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;
      echo = new Echo({
        broadcaster: "reverb", key: cfg.key, wsHost: cfg.host, wsPort: cfg.port, wssPort: cfg.port,
        forceTLS: cfg.scheme === "https", enabledTransports: ["ws", "wss"],
        authorizer: (channel: { name: string }) => ({
          authorize: (socketId: string, cb: (err: unknown, data: unknown) => void) => {
            api.post("/broadcasting/auth", { socket_id: socketId, channel_name: channel.name })
              .then((r) => cb(null, r)).catch((e) => cb(e, null));
          },
        }),
      } as never);
      return echo;
    } catch {
      return null;
    }
  })();
  return loading;
}

/** Vrai si la connexion instantanée est établie (l'interrogation de secours ralentit alors). */
export function realtimeConnected(): boolean {
  return (echo as unknown as { connector?: { pusher?: { connection?: { state?: string } } } })?.connector?.pusher?.connection?.state === "connected";
}

/** S'abonne à un canal privé ; renvoie la fonction de désabonnement. */
export function listenPrivate(channel: string, event: string, cb: (data: Record<string, unknown>) => void): () => void {
  let stopped = false;
  realtime().then((e) => { if (e && !stopped) e.private(channel).listen("." + event, cb); });
  return () => { stopped = true; echo?.leave(channel); };
}
