import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  cacheStartUrl: true,
  dynamicStartUrl: true,
  dynamicStartUrlRedirect: "/login",
  customWorkerSrc: "public",
  customWorkerDest: "public",
  customWorkerPrefix: "custom-sw",
  fallbacks: {
    document: "/~offline",
  },
});

const nextConfig: NextConfig = {
  // Use webpack for PWA support (next-pwa uses webpack)
  turbopack: {},
};

export default withPWA(nextConfig);
