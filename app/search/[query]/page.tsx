import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase-public'
import { StudyResponse } from '@/types'
import SearchResultPage from '@/app/components/SearchResultPage'

interface PageProps {
  params: Promise<{ query: string }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { query } = await params
  const decodedQuery = decodeURIComponent(query)
  
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('searches')
    .select('result, query')
    .eq('query', decodedQuery)
    .not('result', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() // Use maybeSingle to handle no record found gracefully

  if (!data || !data.result) {
    return {
      title: `${decodedQuery} - Bible Questions`,
      description: `Biblical study and analysis of ${decodedQuery}`,
    }
  }

  const result = data.result as StudyResponse
  const content = result.content
  const description = content?.literalAnswer 
    ? content.literalAnswer.substring(0, 160).replace(/\n/g, ' ') + '...'
    : `Biblical study and analysis of ${decodedQuery}`

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'
  const canonicalUrl = `${baseUrl}/search/${encodeURIComponent(decodedQuery)}`

  return {
    title: `${decodedQuery} - Bible Questions | Biblical Study & Analysis`,
    description,
    openGraph: {
      title: `${decodedQuery} - Bible Questions`,
      description,
      type: 'article',
      siteName: 'Bible Questions',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${decodedQuery} - Bible Questions`,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

// Generate static params for popular searches (optional - for pre-rendering)
export async function generateStaticParams() {
  // Return empty array to use ISR instead of pre-generating all pages
  // This allows pages to be generated on-demand
  return []
}

// ISR: Revalidate every 24 hours (86400 seconds)
export const revalidate = 86400

export default async function SearchPage({ params }: PageProps) {
  const { query } = await params
  const decodedQuery = decodeURIComponent(query)

  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('searches')
    .select('result, query, created_at')
    .eq('query', decodedQuery)
    .not('result', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() // Use maybeSingle to handle no record found gracefully

  if (error || !data || !data.result) {
    notFound()
  }

  const result = data.result as StudyResponse

  // Generate structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: decodedQuery,
    description: result.content?.literalAnswer?.substring(0, 200) || '',
    author: {
      '@type': 'Organization',
      name: 'Bible Questions',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bible Questions',
    },
    datePublished: data.created_at,
    dateModified: data.created_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/search/${encodeURIComponent(decodedQuery)}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SearchResultPage query={decodedQuery} result={result} />
    </>
  )
}

