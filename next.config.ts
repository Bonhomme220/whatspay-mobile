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
