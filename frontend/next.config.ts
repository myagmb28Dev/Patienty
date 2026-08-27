import type { NextConfig } from "next";
import { loadPublicRootEnv } from "./config/public-env";

loadPublicRootEnv();

const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: true,
};

export default nextConfig;
