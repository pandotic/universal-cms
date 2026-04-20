import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't pick up a stray lockfile
  // from a parent directory (e.g. ~/package-lock.json).
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  transpilePackages: [
    "@pandotic/universal-cms",
    "@pandotic/skill-library",
  ],
  async redirects() {
    return [
      { source: "/api-usage", destination: "/apis/usage", permanent: true },
      { source: "/api-keys", destination: "/apis/keys", permanent: true },
      { source: "/api-central", destination: "/apis/services", permanent: true },
      { source: "/audit", destination: "/apis/audit", permanent: true },
    ];
  },
};

export default nextConfig;
