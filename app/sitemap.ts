import { MetadataRoute } from 'next'

/**
 * Main Sitemap Index
 * This file only contains the homepage and static pages
 * Question pages are split across multiple child sitemaps (sitemap-0.xml, sitemap-1.xml, etc.)
 * Each child sitemap can contain up to 50,000 URLs as per Google's limit
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Remove trailing slash from baseUrl to prevent double slashes
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://biblequestionsapp.com').replace(/\/$/, '')
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}


