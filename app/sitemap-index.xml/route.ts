import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase-public'

/**
 * Sitemap Index Generator
 * Creates a parent sitemap that links to all child sitemaps
 * Each child sitemap contains up to 50,000 question URLs
 * 
 * Access at: /sitemap-index.xml
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'
  
  // Count total questions with slugs
  const supabase = createPublicClient()
  const { count } = await supabase
    .from('searches')
    .select('*', { count: 'exact', head: true })
    .not('result', 'is', null)
    .not('slug', 'is', null)

  const totalQuestions = count || 0
  const questionsPerSitemap = 50000
  const numberOfSitemaps = Math.ceil(totalQuestions / questionsPerSitemap)

  // Generate sitemap index XML
  const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
${Array.from({ length: numberOfSitemaps }, (_, i) => `  <sitemap>
    <loc>${baseUrl}/sitemap-questions-${i}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`

  return new NextResponse(sitemapIndexXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

