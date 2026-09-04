import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `npm run dev` builds into .next-dev, `npm run build` into .next, so a
  // production build can no longer wipe the running dev server's output.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
