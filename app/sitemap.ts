import { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase-public'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'
  
  // Get all searches with results from the database
  const supabase = createPublicClient()
  const { data: searches } = await supabase
    .from('searches')
    .select('query, created_at')
    .not('result', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1000) // Limit to most recent 1000 for sitemap

  const searchPages = (searches || []).map((search) => ({
    url: `${baseUrl}/search/${encodeURIComponent(search.query)}`,
    lastModified: new Date(search.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...searchPages,
  ]
}


