import { MetadataRoute } from 'next'

/**
 * Main Sitemap Index
 * This file only contains the homepage and static pages
 * Question pages are split across multiple child sitemaps (sitemap-0.xml, sitemap-1.xml, etc.)
 * Each child sitemap can contain up to 50,000 URLs as per Google's limit
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use hardcoded baseUrl to avoid any routing issues
  const baseUrl = 'https://biblequestionsapp.com'
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}


