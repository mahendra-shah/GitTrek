import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Social crawlers (Twitterbot, facebookexternalhit, LinkedInBot, etc.)
        // must be able to fetch /api/og/badge and /api/og/home to render link previews.
        // Keep auth + github proxy routes private.
        userAgent: "*",
        allow: ["/", "/api/og/"],
        disallow: ["/api/auth/", "/api/github/"],
      },
    ],
    sitemap: "https://gittrek.vercel.app/sitemap.xml",
  };
}
