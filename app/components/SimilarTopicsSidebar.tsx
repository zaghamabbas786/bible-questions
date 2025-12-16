'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { trackSimilarTopicClick } from '@/lib/analytics'

interface SimilarTopic {
  query: string
  slug: string
  score: number
  created_at: string
}

interface SimilarTopicsSidebarProps {
  currentQuery: string
  searchTopic?: string
  keyTerms?: Array<{ term: string; definition: string }>
}

const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
)

export default function SimilarTopicsSidebar({ currentQuery, searchTopic, keyTerms }: SimilarTopicsSidebarProps) {
  const [similarTopics, setSimilarTopics] = useState<SimilarTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSimilarTopics = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/similar-topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: currentQuery,
            searchTopic,
            keyTerms
          })
        })

        if (response.ok) {
          const data = await response.json()
          setSimilarTopics(data)
        }
      } catch (error) {
        console.error('Failed to fetch similar topics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (currentQuery) {
      fetchSimilarTopics()
    }
  }, [currentQuery, searchTopic, keyTerms])

  if (loading) {
    return (
      <aside className="bg-surface border border-stone rounded-sm p-6">
        <h3 className="font-display text-lg text-ink mb-4 border-b border-gold/30 pb-2">
          Similar Topics
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-stone/20 rounded animate-pulse" />
          ))}
        </div>
      </aside>
    )
  }

  if (similarTopics.length === 0) {
    return null
  }

  return (
    <aside className="bg-surface border border-stone rounded-sm p-6 sticky top-8">
      <h3 className="font-display text-lg text-ink mb-4 border-b border-gold/30 pb-2 flex items-center gap-2">
        <BookIcon />
        <span>Similar Topics</span>
      </h3>
      <ul className="space-y-3">
        {similarTopics.map((topic, index) => (
          <li key={index}>
            <Link
              href={`/question/${topic.slug}`}
              onClick={() => trackSimilarTopicClick(topic.query)}
              className="block p-3 rounded border border-stone hover:border-gold hover:bg-stone/5 transition-all group"
            >
              <p className="text-sm font-serif text-ink group-hover:text-gold transition-colors line-clamp-2">
                {topic.query}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}

