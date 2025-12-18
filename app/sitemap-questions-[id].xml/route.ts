import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase-public'

/**
 * Dynamic Child Sitemap Generator
 * Generates paginated sitemaps for questions
 * Each sitemap contains up to 50,000 URLs (Google's limit)
 * 
 * URLs:
 * - /sitemap-questions-0.xml (questions 0-49,999)
 * - /sitemap-questions-1.xml (questions 50,000-99,999)
 * - /sitemap-questions-2.xml (questions 100,000-149,999)
 * - /sitemap-questions-3.xml (questions 150,000-199,999)
 * etc.
 */

// @ts-ignore - Next.js type inference issue with .xml in folder name
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Use hardcoded baseUrl to avoid any routing issues
  const baseUrl = 'https://biblequestionsapp.com'
  const { id } = await params
  const sitemapId = parseInt(id, 10)

  if (isNaN(sitemapId) || sitemapId < 0) {
    return new NextResponse('Invalid sitemap ID', { status: 400 })
  }

  const questionsPerSitemap = 50000
  const offset = sitemapId * questionsPerSitemap

  // Fetch questions for this sitemap page
  const supabase = createPublicClient()
  const { data: questions, error } = await supabase
    .from('searches')
    .select('slug, created_at')
    .not('result', 'is', null)
    .not('slug', 'is', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + questionsPerSitemap - 1)

  if (error) {
    console.error('Sitemap generation error:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }

  if (!questions || questions.length === 0) {
    return new NextResponse('Sitemap not found', { status: 404 })
  }

  // Generate sitemap XML
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${questions
  .filter(q => q.slug)
  .map(
    (question) => `  <url>
    <loc>${baseUrl}/question/${question.slug}</loc>
    <lastmod>${new Date(question.created_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  return new NextResponse(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

