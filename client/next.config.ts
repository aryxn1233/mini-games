import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We use a web wrapper approach for Capacitor to support SSR/Server Actions
  images: {
    unoptimized: true,
  },
  experimental: {},
};

export default nextConfig;
