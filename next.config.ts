import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // HAPUS bagian eslint dari sini
  
  typescript: {
    ignoreBuildErrors: true, 
  },
  reactStrictMode: false,
};

export default nextConfig;
