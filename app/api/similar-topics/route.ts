import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase-public'

export async function POST(request: NextRequest) {
  try {
    const { query, searchTopic, keyTerms } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const supabase = createPublicClient()

    // Get all searches with results
    const { data: allSearches, error } = await supabase
      .from('searches')
      .select('query, result, created_at')
      .not('result', 'is', null)
      .neq('query', query) // Exclude the current query
      .order('created_at', { ascending: false })
      .limit(100) // Get a larger pool to filter from

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch similar topics' },
        { status: 500 }
      )
    }

    if (!allSearches || allSearches.length === 0) {
      return NextResponse.json([])
    }

    // Score and rank similar topics
    const scoredTopics = allSearches
      .map((search) => {
        let score = 0
        const otherQuery = search.query.toLowerCase()
        const currentQuery = query.toLowerCase()
        const otherResult = search.result as any

        // Extract search topic and key terms from other result
        const otherSearchTopic = otherResult?.content?.searchTopic?.toLowerCase() || ''
        const otherKeyTerms = otherResult?.content?.keyTerms?.map((kt: any) => kt.term.toLowerCase()) || []

        // Score based on search topic match
        if (searchTopic && otherSearchTopic) {
          const currentSearchTopic = searchTopic.toLowerCase()
          if (otherSearchTopic.includes(currentSearchTopic) || currentSearchTopic.includes(otherSearchTopic)) {
            score += 10
          }
          // Check for word overlap in search topics
          const currentWords = currentSearchTopic.split(/\s+/)
          const otherWords = otherSearchTopic.split(/\s+/)
          const commonWords = currentWords.filter(w => otherWords.includes(w) && w.length > 3)
          score += commonWords.length * 3
        }

        // Score based on key terms overlap
        if (keyTerms && Array.isArray(keyTerms) && keyTerms.length > 0) {
          const currentKeyTerms = keyTerms.map((kt: any) => typeof kt === 'string' ? kt.toLowerCase() : kt.term?.toLowerCase()).filter(Boolean)
          const matchingTerms = currentKeyTerms.filter(term => 
            otherKeyTerms.some((otherTerm: string) => 
              otherTerm.includes(term) || term.includes(otherTerm)
            )
          )
          score += matchingTerms.length * 5
        }

        // Score based on query word overlap (excluding common words)
        const commonWords = ['what', 'is', 'the', 'of', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by']
        const currentWords = currentQuery.split(/\s+/).filter(w => w.length > 2 && !commonWords.includes(w))
        const otherWords = otherQuery.split(/\s+/).filter(w => w.length > 2 && !commonWords.includes(w))
        const commonQueryWords = currentWords.filter(w => otherWords.includes(w))
        score += commonQueryWords.length * 2

        // Boost score for recent searches
        const daysSinceCreation = (Date.now() - new Date(search.created_at).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceCreation < 7) {
          score += 2
        } else if (daysSinceCreation < 30) {
          score += 1
        }

        return {
          query: search.query,
          score,
          created_at: search.created_at
        }
      })
      .filter(item => item.score > 0) // Only include items with some similarity
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, 8) // Return top 8 similar topics

    return NextResponse.json(scoredTopics)

  } catch (error) {
    console.error('Similar topics error:', error)
    return NextResponse.json(
      { error: 'Failed to find similar topics' },
      { status: 500 }
    )
  }
}

