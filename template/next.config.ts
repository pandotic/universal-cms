import type { NextConfig } from "next";

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://snap.licdn.com https://*.posthog.com https://app.rybbit.io https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data:",
  "font-src 'self' https:",
  "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.facebook.com https://px.ads.linkedin.com https://*.posthog.com https://app.rybbit.io https://cloudflareinsights.com",
  "frame-src https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: cspHeader },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@pandotic/universal-cms"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
