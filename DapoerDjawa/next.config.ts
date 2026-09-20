import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // =========================================================
  // IMAGE CONFIGURATION
  // =========================================================
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  // =========================================================
  // SECURITY HEADERS
  // =========================================================
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://app.sandbox.midtrans.com https://snap-assets.sandbox.midtrans.com https://*.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss:; frame-src 'self' https://app.sandbox.midtrans.com;",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          }
        ],
      },
    ];
  },
};

export default nextConfig;