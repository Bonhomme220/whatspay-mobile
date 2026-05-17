import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const config = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? "",
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? "",
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? "",
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? "",
  };

  const sw = `
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "WhatsPAY";
  const body  = payload.notification?.body  ?? "";
  self.registration.showNotification(title, {
    body,
    icon:  "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data:  payload.data ?? {},
  });
});
`;

  return new NextResponse(sw, {
    headers: { "Content-Type": "application/javascript; charset=utf-8" },
  });
}
