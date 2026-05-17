"use client";

import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { getFirebaseMessaging, VAPID_KEY } from "@/lib/firebase";
import { api } from "@/lib/api";

const STORAGE_KEY = "wp_fcm_token";
const DEBUG_KEY   = "wp_fcm_debug";

function dbg(msg: string) {
  const logs: string[] = JSON.parse(localStorage.getItem(DEBUG_KEY) ?? "[]");
  const entry = `${new Date().toISOString().slice(11, 19)} ${msg}`;
  logs.push(entry);
  localStorage.setItem(DEBUG_KEY, JSON.stringify(logs.slice(-30)));
  console.log("[FCM]", msg);
}

function waitForServiceWorkerActive(reg: ServiceWorkerRegistration): Promise<void> {
  return new Promise((resolve) => {
    if (reg.active) { resolve(); return; }
    const sw = reg.installing ?? reg.waiting;
    if (!sw) { resolve(); return; }
    sw.addEventListener("statechange", function handler() {
      if (sw.state === "activated") {
        sw.removeEventListener("statechange", handler);
        resolve();
      }
    });
  });
}

export function usePushNotifications() {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) return;

    async function init() {
      // Réinitialiser les logs à chaque tentative
      localStorage.setItem(DEBUG_KEY, "[]");

      try {
        dbg("init start");

        const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        dbg(`sw registered — active:${!!swReg.active} waiting:${!!swReg.waiting} installing:${!!swReg.installing}`);

        await waitForServiceWorkerActive(swReg);
        dbg("sw active");

        const permission = await Notification.requestPermission();
        dbg(`permission=${permission}`);
        if (permission !== "granted") return;

        const messaging = getFirebaseMessaging();
        dbg(`messaging=${messaging ? "ok" : "null"}`);
        if (!messaging) return;

        dbg(`vapidKey=${VAPID_KEY ? VAPID_KEY.slice(0, 12) + "…" : "MISSING"}`);

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });
        dbg(`token=${token ? token.slice(0, 20) + "…" : "null/empty"}`);
        if (!token) return;

        const cached = localStorage.getItem(STORAGE_KEY);
        dbg(`cached=${cached ? cached.slice(0, 20) + "…" : "none"}`);
        if (cached === token) {
          dbg("token unchanged — forcing API call anyway");
          // On force quand même l'appel pour s'assurer que le backend a le token
          // (utile après un reset de DB ou changement de session)
        }

        const resp = await api.post("/fcm-token", { fcm_token: token });
        dbg(`api response=${JSON.stringify(resp.data)}`);
        localStorage.setItem(STORAGE_KEY, token);
        dbg("done ✓");
      } catch (err) {
        const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        dbg(`ERROR: ${msg}`);
        console.warn("[FCM] Échec enregistrement push:", err);
      }
    }

    init();
  }, []);
}
