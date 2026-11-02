import type { NextConfig } from "next";

// Vercel builds this one Next.js project into static pages (frontend) and
// serverless functions for everything under src/app/api (backend).
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
