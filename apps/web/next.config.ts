import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // R4 / P4: the @eventology/* packages are published as raw TypeScript
  // source (main -> ./src/index.ts, no build step). Next must transpile and
  // BUNDLE them — including their JSON catalogs (en.json / am.json) — into
  // the server + client output. Without this, `next dev` works (on-the-fly
  // transpile) but a production serverless build leaves the workspace
  // package as an external that Node cannot load at runtime, so the i18n
  // catalog fails to resolve and the navbar falls back to raw keys.
  transpilePackages: [
    "@eventology/locales",
    "@eventology/config",
    "@eventology/schemas",
    "@eventology/utils",
    "@eventology/ai",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "randomuser.me" },
      { protocol: "https", hostname: "api.dicebear.com" },
      // Supabase Storage (event banners, avatars, logos, etc.)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
