import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
