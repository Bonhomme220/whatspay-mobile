import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/admin/:path*", destination: "/dashboard", permanent: false },
      // /r/:code est maintenant une vraie page (app/r/[code]/page.tsx) : elle détecte
      // l'appareil et renvoie vers le store avec le code mémorisé pour le post-install.
    ];
  },
  async rewrites() {
    // Filet de sécurité : sert les Digital Asset Links via la route API si le
    // fichier statique public/.well-known/assetlinks.json n'est pas résolu.
    return [
      { source: "/.well-known/assetlinks.json", destination: "/api/assetlinks" },
    ];
  },
};

export default nextConfig;
