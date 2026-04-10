import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://bizprint.mn'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/quote`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/marketplace`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/business-cards`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/templates`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/factory`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/partner`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]
}
