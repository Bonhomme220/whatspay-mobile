// Digital Asset Links pour la TWA Play Store (filet de sécurité si le fichier
// public/.well-known/assetlinks.json n'est pas servi). Servi en application/json.
// Rewrite depuis /.well-known/assetlinks.json → cf. next.config.ts.

const ASSETLINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "africa.whatspay.app.twa",
      sha256_cert_fingerprints: [
        // Clé d'upload (test APK local)
        "47:A2:94:1B:0E:64:44:10:72:24:AF:EF:EE:A0:D1:B2:A5:2D:44:49:99:3B:01:79:F1:18:6C:DA:D0:DE:E7:62",
        // TODO: ajouter ici l'empreinte SHA-256 de la clé "Play App Signing"
        // (Play Console → Intégrité de l'app → Signature de l'app), après le 1er upload de l'AAB.
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
