import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/og/"],
      disallow: ["/api/"],
    },
    sitemap: "https://gittrek.vercel.app/sitemap.xml",
  };
}
