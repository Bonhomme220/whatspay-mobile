"use client";

import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { getFirebaseMessaging, VAPID_KEY } from "@/lib/firebase";
import { api } from "@/lib/api";

const STORAGE_KEY = "wp_fcm_token";

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
      try {
        const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

        // Attendre que le SW soit actif avant d'appeler getToken
        await waitForServiceWorkerActive(swReg);

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const messaging = getFirebaseMessaging();
        if (!messaging) return;

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });
        if (!token) return;

        if (localStorage.getItem(STORAGE_KEY) === token) return;

        await api.post("/fcm-token", { fcm_token: token });
        localStorage.setItem(STORAGE_KEY, token);
      } catch (err) {
        console.warn("[FCM] Échec enregistrement push:", err);
      }
    }

    init();
  }, []);
}
