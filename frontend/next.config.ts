import type { NextConfig } from "next";
import { loadPublicRootEnv } from "./config/public-env";

loadPublicRootEnv();

const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    const upstream = process.env.API_PROXY_TARGET?.replace(/\/$/, "");
    if (!upstream) return [];
    const url = new URL(upstream);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
      throw new Error("API_PROXY_TARGET must be an HTTP(S) origin without credentials or a path");
    }
    return [{ source: "/api/:path*", destination: upstream + "/api/:path*" }];
  },
};

export default nextConfig;
