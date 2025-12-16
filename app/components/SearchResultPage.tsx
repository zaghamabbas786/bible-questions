'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { StudyResponse, ExternalResource } from '@/types'
import { WordCard } from './WordCard'
import { FrequencyChart } from './RelevanceChart'
import { Interlinear } from './Interlinear'
import { StudyMap } from './StudyMap'
import { ResourceSection } from './ResourceSection'
import SimilarTopicsSidebar from './SimilarTopicsSidebar'
import { trackSearchResultView } from '@/lib/analytics'

interface SearchResultPageProps {
  query: string
  result: StudyResponse
}

export default function SearchResultPage({ query, result }: SearchResultPageProps) {
  const [mapUrl, setMapUrl] = useState<string | null>(null)
  const [mapLoading, setMapLoading] = useState(false)
  const [resources, setResources] = useState<ExternalResource[]>([])

  // Scroll to top when component mounts (e.g., when navigating to a new question)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Track page view in Google Analytics
  useEffect(() => {
    trackSearchResultView(query)
  }, [query])

  // Fetch map if geographical anchor exists
  useEffect(() => {
    if (result.content?.geographicalAnchor) {
      setMapLoading(true)
      const anchor = result.content.geographicalAnchor
      fetch('/api/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: anchor.location, region: anchor.region }),
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.imageUrl) {
            setMapUrl(data.imageUrl)
          }
        })
        .catch(err => console.error('Failed to fetch map:', err))
        .finally(() => setMapLoading(false))
    }
  }, [result.content?.geographicalAnchor])

  // Fetch resources if search topic exists
  useEffect(() => {
    if (result.content?.searchTopic) {
      fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: result.content.searchTopic }),
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setResources(data)
          }
        })
        .catch(err => console.error('Failed to fetch resources:', err))
    }
  }, [result.content?.searchTopic])

  if (!result.isRelevant && result.refusalMessage) {
    return (
      <div className="min-h-screen bg-paper py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface p-8 rounded-lg border border-stone">
            <h1 className="text-2xl font-display text-ink mb-4">{query}</h1>
            <p className="text-ink/80">{result.refusalMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!result.content) {
    return (
      <div className="min-h-screen bg-paper py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface p-8 rounded-lg border border-stone">
            <h1 className="text-2xl font-display text-ink mb-4">{query}</h1>
            <p className="text-ink/80">No content available for this query.</p>
          </div>
        </div>
      </div>
    )
  }

  const {
    literalAnswer,
    keyTerms = [],
    scriptureReferences = [],
    historicalContext,
    originalLanguageAnalysis = [],
    theologicalInsight,
    commentarySynthesis = [],
    biblicalBookFrequency = [],
    interlinear,
    geographicalAnchor,
    searchTopic,
  } = result.content

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="bg-surface border-b border-stone sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-display text-ink hover:text-gold transition-colors">
              Bible Questions
            </Link>
            <Link
              href={`/?q=${encodeURIComponent(query)}&back=1`}
              className="text-sm text-ink/80 hover:text-gold transition-colors"
            >
              ← Back to Search
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
        {/* Query Title */}
        <h1 className="text-4xl font-display text-ink mb-8">{query}</h1>

        {/* Breakdown Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-display text-ink mb-4 border-b border-gold/30 pb-2">
            BREAKDOWN
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-ink leading-relaxed whitespace-pre-line">
              {literalAnswer}
            </p>
          </div>
        </section>

        {/* Key Terms */}
        {keyTerms.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-display text-ink mb-4 border-b border-gold/30 pb-2">
              KEY TERMS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {keyTerms.map((term, idx) => (
                <div
                  key={idx}
                  className="bg-surface p-4 rounded border border-stone hover:border-gold transition-colors"
                >
                  <h3 className="font-semibold text-ink mb-1">{term.term}</h3>
                  <p className="text-sm text-ink/80">{term.definition}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Scripture References */}
        {scriptureReferences.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-display text-ink mb-4 border-b border-gold/30 pb-2">
              SCRIPTURE REFERENCES
            </h2>
            <div className="space-y-4">
              {scriptureReferences.map((ref, idx) => (
                <div key={idx} className="bg-surface p-4 rounded border border-stone">
                  <h3 className="font-semibold text-ink mb-2">{ref.reference}</h3>
                  <p className="text-ink/90 italic">{ref.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Interlinear */}
        {interlinear && (
          <section className="mb-12">
            <h2 className="text-2xl font-display text-ink mb-4 border-b border-gold/30 pb-2">
              INTERLINEAR ANALYSIS
            </h2>
            <Interlinear data={interlinear} />
          </section>
        )}

        {/* Original Language Analysis */}
        {originalLanguageAnalysis.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-display text-ink mb-4 border-b border-gold/30 pb-2">
              ORIGINAL LANGUAGE ANALYSIS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {originalLanguageAnalysis.map((word, idx) => (
                <WordCard key={idx} data={word} />
              ))}
            </div>
          </section>
        )}

        {/* Historical Context */}
        {historicalContext && (
          <section className="mb-12">
            <h2 className="text-2xl font-display text-ink mb-4 border-b border-gold/30 pb-2">
              HISTORICAL CONTEXT
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-ink leading-relaxed whitespace-pre-line">
                {historicalContext}
              </p>
            </div>
          </section>
        )}

        {/* Theological Insight */}
        {theologicalInsight && (
          <section className="mb-12">
            <h2 className="text-2xl font-display text-ink mb-4 border-b border-gold/30 pb-2">
              THEOLOGICAL INSIGHT
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-ink leading-relaxed whitespace-pre-line">
                {theologicalInsight}
              </p>
            </div>
          </section>
        )}

        {/* Commentary Synthesis */}
        {commentarySynthesis.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-display text-ink mb-4 border-b border-gold/30 pb-2">
              COMMENTARY SYNTHESIS
            </h2>
            <div className="space-y-6">
              {commentarySynthesis.map((commentary, idx) => (
                <div key={idx} className="bg-surface p-6 rounded border border-stone">
                  <h3 className="font-semibold text-ink mb-2">
                    {commentary.source} ({commentary.tradition})
                  </h3>
                  <p className="text-ink leading-relaxed whitespace-pre-line">
                    {commentary.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Biblical Book Frequency */}
        {biblicalBookFrequency.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-display text-ink mb-4 border-b border-gold/30 pb-2">
              BIBLICAL BOOK FREQUENCY
            </h2>
            <FrequencyChart data={biblicalBookFrequency} />
          </section>
        )}

        {/* Map Section */}
        {geographicalAnchor && (
          <section className="mb-12">
            <h2 className="text-2xl font-display text-ink mb-4 border-b border-gold/30 pb-2">
              GEOGRAPHICAL CONTEXT
            </h2>
            <StudyMap
              imageUrl={mapUrl}
              loading={mapLoading}
              locationName={geographicalAnchor.location}
            />
          </section>
        )}

        {/* External Resources */}
        {resources.length > 0 && (
          <section className="mb-12">
            <ResourceSection resources={resources} />
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-stone text-center text-sm text-ink/70">
          <p>
            This content was generated by Bible Questions. For more biblical studies,{' '}
            <a href="/" className="text-gold hover:underline">
              visit our homepage
            </a>
            .
          </p>
        </footer>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SimilarTopicsSidebar
              currentQuery={query}
              searchTopic={searchTopic}
              keyTerms={keyTerms}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
