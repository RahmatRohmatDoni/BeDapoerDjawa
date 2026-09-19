import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // =========================================================
  // NGROK DEVELOPMENT
  // =========================================================
  // Mengizinkan Next.js development server diakses
  // melalui domain Ngrok.
  allowedDevOrigins: [
    "tribune-cradle-hash.ngrok-free.dev",
  ],

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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.sandbox.midtrans.com https://snap-assets.sandbox.midtrans.com https://*.google.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;