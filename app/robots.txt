import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Use hardcoded baseUrl to avoid any routing issues
  const baseUrl = 'https://biblequestionsapp.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-index.xml`,
    ],
  }
}


