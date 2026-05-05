import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Dates reflect actual last significant content updates — update when content changes
  return [
    {
      url: 'https://gittrek.vercel.app',
      lastModified: new Date('2025-05-05'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://gittrek.vercel.app/badges',
      lastModified: new Date('2025-05-05'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://gittrek.vercel.app/about',
      lastModified: new Date('2025-05-05'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]
}
