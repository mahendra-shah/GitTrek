import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — no framing of this site allowed
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send origin as referrer on cross-origin requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Enforce HTTPS for 2 years, include subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Disable browser features we don't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Content Security Policy
  // - script-src: Next.js requires 'unsafe-inline' for hydration chunks in App Router
  // - img-src: github.com avatars + raw.githubusercontent.com badge images
  // - connect-src: GitHub REST + GraphQL APIs
  // - style-src: Google Fonts stylesheet + Next.js inline styles
  // - font-src: Google Fonts CDN
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://github.com https://avatars.githubusercontent.com https://raw.githubusercontent.com https://user-images.githubusercontent.com",
      "connect-src 'self' https://api.github.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
