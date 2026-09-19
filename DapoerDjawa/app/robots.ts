import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://dapoerdjawa.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/profile/', '/checkout/', '/cart/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

