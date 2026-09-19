// Digital Asset Links pour l'app Android com.whatspay.native (filet de sécurité
// si le fichier public/.well-known/assetlinks.json n'est pas servi). Servi en
// application/json. Rewrite depuis /.well-known/assetlinks.json → cf. next.config.ts.

const ASSETLINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.whatspay.native",
      sha256_cert_fingerprints: [
        // Certificat de signature Play Store (Play Console → Intégrité de l'application)
        "FB:0F:56:B0:A4:6F:E0:6A:54:D4:72:21:0F:B5:6F:EA:59:9A:A2:22:F6:6D:EB:F8:23:1F:2B:DB:B3:F6:F0:C5",
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
