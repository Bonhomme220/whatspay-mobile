"use client";

import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { getFirebaseMessaging, VAPID_KEY } from "@/lib/firebase";
import { api } from "@/lib/api";

const STORAGE_KEY = "wp_fcm_token";

export function usePushNotifications() {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    async function init() {
      try {
        // Enregistrer le service worker qui reçoit les notifs en arrière-plan
        const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

        // Demander la permission (ne redemandera pas si déjà accordée/refusée)
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const messaging = getFirebaseMessaging();
        if (!messaging) return;

        const token = await getToken(messaging, {
          vapidKey:            VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });
        if (!token) return;

        // Éviter d'envoyer le même token au backend à chaque montage
        if (localStorage.getItem(STORAGE_KEY) === token) return;

        await api.post("/fcm-token", { fcm_token: token });
        localStorage.setItem(STORAGE_KEY, token);
      } catch {
        // Erreur silencieuse — les notifications sont facultatives
      }
    }

    init();
  }, []);
}
