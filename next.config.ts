import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const turnstile = "https://challenges.cloudflare.com";

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is needed for Next's inline bootstrap + next-themes; eval only in dev (HMR).
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} ${turnstile}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'" + (isDev ? " ws: wss:" : ""),
  `frame-src ${turnstile}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
