import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pandotic/universal-cms"],
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
