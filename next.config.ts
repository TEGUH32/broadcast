import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* output: "standalone" <-- Baris ini sudah hilang/dihapus */
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
