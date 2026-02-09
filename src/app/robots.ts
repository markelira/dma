import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/player/',
          '/company/',
          '/vallalkozas/',
        ],
      },
    ],
    sitemap: 'https://masterclass.dma.hu/sitemap.xml',
  }
}
