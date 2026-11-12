import type { NextConfig } from "next";

// En-têtes de sécurité de base (CLAUDE.md, section 8.3). La CSP stricte avec nonce viendra avec le proxy.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Défaut de Next : 1 Mo, trop peu pour des pièces jointes (jusqu'à 20 Mo au formulaire de contact)
    // ou une réalisation admin (5 photos de 5 Mo au maximum). Nginx doit autoriser au moins autant
    // (client_max_body_size, voir architecture_details.md, section Déploiement), sinon il refuse avant Next.
    serverActions: { bodySizeLimit: "30mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
