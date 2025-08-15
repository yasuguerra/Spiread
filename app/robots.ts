import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/legal/*',
          '/offline'
        ],
        disallow: [
          '/debug',
          '/api/*',
          '/_next/*',
          '/private/*'
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/legal/*'
        ],
        disallow: [
          '/debug',
          '/api/*',
          '/offline'
        ],
      }
    ],
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.spiread.com'}/sitemap.xml`,
  }
}