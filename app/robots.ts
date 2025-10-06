import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/admin/',
        '/therapist/dashboard/',
        '/partner/dashboard/',
        '/api/',
        '/_next/',
        '/static/',
      ],
    },
    sitemap: 'https://quiet-therapy.com/sitemap.xml',
  }
}
