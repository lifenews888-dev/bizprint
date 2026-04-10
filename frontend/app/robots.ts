import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/mobile/', '/api/'],
      },
    ],
    sitemap: 'https://bizprint.mn/sitemap.xml',
  }
}
