// Digital Asset Links pour la TWA Play Store (filet de sécurité si le fichier
// public/.well-known/assetlinks.json n'est pas servi). Servi en application/json.
// Rewrite depuis /.well-known/assetlinks.json → cf. next.config.ts.

const ASSETLINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.whatspay.native",
      sha256_cert_fingerprints: [
        // TODO: remplacer par la vraie empreinte SHA-256 du certificat de signature Play Store
        // (Play Console → Configuration → Intégrité de l'application → Certificat de signature
        // de l'application). Tant que ce placeholder est en place, Android refusera l'App Link
        // (vérification cryptographique échouée) et retombera sur le navigateur/PWA.
        "__TODO_REPLACE_WITH_PLAY_CONSOLE_APP_SIGNING_SHA256__",
      ],
    },
  },
];

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(ASSETLINKS, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
