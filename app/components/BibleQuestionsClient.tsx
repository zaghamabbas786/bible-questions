'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs'
import { StudyResponse, LoadingState, ScriptureReference, ExternalResource, KeyTerm, InterlinearData, Commentary } from '@/types'
import { WordCard } from './WordCard'
import { FrequencyChart } from './RelevanceChart'
import { LoadingIndicator } from './LoadingIndicator'
import { Interlinear } from './Interlinear'
import { StudyMap } from './StudyMap'
import { ResourceSection } from './ResourceSection'
import DonateButton from './DonateButton'

// Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
)

const BookIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
)

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
)

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 20.25V9" />
  </svg>
)

const AlefIcon = () => (
  <span className="font-serif text-xl font-bold leading-none pb-1">א</span>
)

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
)

const ColumnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
  </svg>
)

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
  </svg>
)

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
)

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
)

const VersePill: React.FC<{ data: ScriptureReference; onClick: (ref: string) => void }> = ({ data, onClick }) => {
  return (
    <div 
      className="relative group inline-block cursor-pointer"
      onClick={() => onClick(data.reference)}
    >
      <span className="px-4 py-1 bg-stone/20 border border-stone text-sm font-sans font-medium text-clay tracking-wide rounded-full group-hover:border-gold group-hover:text-gold group-hover:bg-surface transition-all flex items-center gap-2">
        {data.reference}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gold"><EyeIcon/></span>
      </span>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 sm:w-80 bg-ink text-paper p-4 rounded-sm shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
        <p className="font-serif italic text-sm leading-relaxed text-stone">
          "{data.text}"
        </p>
        <p className="text-[10px] font-sans text-gold uppercase mt-2 tracking-wider">Click to view Interlinear</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2 border-4 border-transparent border-t-ink"></div>
      </div>
    </div>
  )
}

interface HighlightItem {
  text: string
  tooltip: string
  type: 'term' | 'verse'
}

const InlineTooltip: React.FC<HighlightItem> = ({ text, tooltip, type }) => {
  const isVerse = type === 'verse'
  
  return (
    <span className="relative group inline-block cursor-help">
      <span className={`${isVerse ? 'text-gold border-b-2 border-gold font-semibold' : 'underline decoration-dotted decoration-gold'} underline-offset-4 group-hover:opacity-80 transition-all`}>
        {text}
      </span>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-80 bg-ink text-paper p-3 rounded-sm shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-center">
        <p className="font-sans text-xs font-medium text-gold uppercase tracking-wider mb-1">
          {isVerse ? 'Scripture' : text}
        </p>
        <p className="font-serif italic text-sm leading-snug text-stone">
          {tooltip}
        </p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-ink"></div>
      </div>
    </span>
  )
}

const renderSummaryWithTooltips = (text: string, terms?: KeyTerm[], verses?: ScriptureReference[]) => {
  const items: HighlightItem[] = []

  // Add Terms
  if (terms) {
    terms.forEach(t => items.push({ text: t.term, tooltip: t.definition, type: 'term' }))
  }

  // Add Verses (using reference as the trigger text)
  if (verses) {
    verses.forEach(v => items.push({ text: v.reference, tooltip: v.text, type: 'verse' }))
  }

  if (items.length === 0) return text

  // Sort items by length (longest first) to prevent partial replacements
  const sortedItems = items.sort((a, b) => b.text.length - a.text.length)

  // Create a regex pattern that matches any of the terms/verses
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(${sortedItems.map(i => escapeRegExp(i.text)).join('|')})`, 'gi')

  const parts = text.split(pattern)

  return parts.map((part, index) => {
    // Find if this part matches an item (case insensitive)
    const match = sortedItems.find(i => i.text.toLowerCase() === part.toLowerCase())
    
    if (match) {
      return <InlineTooltip key={index} text={part} tooltip={match.tooltip} type={match.type} />
    }
    return <span key={index}>{part}</span>
  })
}

// Commentary Dropdown Component
const CommentaryDropdown: React.FC<{ commentary: Commentary }> = ({ commentary }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-surface border border-stone rounded-sm overflow-hidden transition-all duration-300 hover:border-gold/50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left focus:outline-none bg-stone/5 hover:bg-stone/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-display text-lg text-ink font-bold">{commentary.source}</span>
          <span className={`text-[10px] font-sans uppercase tracking-widest px-2 py-0.5 rounded-full border ${commentary.tradition === 'Jewish' ? 'border-blue-200 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-900/20' : 'border-red-200 text-red-700 dark:text-red-300 bg-red-50/50 dark:bg-red-900/20'}`}>
            {commentary.tradition}
          </span>
        </div>
        <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-stone`}>
          <ChevronDownIcon />
        </div>
      </button>
      
      <div 
        className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[400px] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}
      >
        <div className="p-4 border-t border-stone/10">
          <p className="font-serif text-lg leading-relaxed text-ink/90 italic bg-stone/5 p-4 rounded-sm border-l-2 border-gold/30">
            "{commentary.text}"
          </p>
        </div>
      </div>
    </div>
  )
}

export default function BibleQuestionsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSignedIn, userId } = useAuth()
  
  const [query, setQuery] = useState('')
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE)
  const [data, setData] = useState<StudyResponse | null>(null)
  const [resources, setResources] = useState<ExternalResource[]>([])
  const [mapUrl, setMapUrl] = useState<string | null>(null)
  const [mapLoading, setMapLoading] = useState(false)
  const [activeInterlinear, setActiveInterlinear] = useState<InterlinearData | null>(null)
  const [interlinearLoading, setInterlinearLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [searchCount, setSearchCount] = useState(0)
  const [requiresAuth, setRequiresAuth] = useState(false)
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const interlinearRef = useRef<HTMLDivElement>(null)

  // Initialize Dark Mode from local storage or preference
  useEffect(() => {
    const storedPref = localStorage.getItem('bibleQuestionsTheme')
    if (storedPref === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    }

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check search count on mount
  useEffect(() => {
    checkSearchCount()
  }, [isSignedIn])

  const checkSearchCount = async () => {
    try {
      const response = await fetch('/api/search-count')
      const result = await response.json()
      setSearchCount(result.count || 0)
      setRequiresAuth(result.requiresAuth || false)
    } catch (err) {
      console.error('Failed to check search count:', err)
    }
  }

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('bibleQuestionsTheme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('bibleQuestionsTheme', 'light')
    }
  }

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return

    // Check search count before allowing search
    const countResponse = await fetch('/api/search-count')
    const countResult = await countResponse.json()
    
    // Check if auth is required
    if (countResult.requiresAuth && !isSignedIn) {
      setError("Please sign in to continue searching. You've reached the free search limit.")
      setLoadingState(LoadingState.ERROR)
      return
    }

    setLoadingState(LoadingState.LOADING)
    setError(null)
    setData(null)
    setResources([])
    setMapUrl(null)
    setMapLoading(false)
    setCopied(false)
    setActiveInterlinear(null)

    try {
      // Track search
      await fetch('/api/track-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm }),
      })

      // Update search count after tracking
      await checkSearchCount()

      // Perform search
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm }),
      })

      if (!searchResponse.ok) {
        // Try to get error message from response
        let errorMessage = 'Search failed'
        try {
          const errorData = await searchResponse.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = searchResponse.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await searchResponse.json() as StudyResponse
      setData(result)
      
      // Save the full result to database for SEO indexing
      try {
        await fetch('/api/searches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: searchTerm,
            result: result 
          }),
        })
      } catch (saveError) {
        // Don't block the UI if saving fails
        console.error('Failed to save search result:', saveError)
      }
      
      // Redirect to SEO page after saving
      // This ensures users see the full article page and Google can index it
      const encodedQuery = encodeURIComponent(searchTerm)
      router.push(`/search/${encodedQuery}`)
      
      // Note: The rest of the UI logic (interlinear, map, resources) 
      // will be handled by the SearchResultPage component
    } catch (err: any) {
      console.error('Search error:', err)
      // Show the actual error message if available, otherwise show generic message
      const errorMessage = err?.message || "The ancient texts are momentarily silent. Please check your connection and try again."
      setError(errorMessage)
      setLoadingState(LoadingState.ERROR)
    }
  }

  const handleVerseClick = async (ref: string) => {
    setInterlinearLoading(true)
    if (!activeInterlinear) {
        setActiveInterlinear({ reference: ref, language: 'Hebrew', words: [] })
    }

    try {
        const response = await fetch('/api/interlinear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: ref }),
        })
        if (response.ok) {
          const result = await response.json() as InterlinearData
          setActiveInterlinear(result)
          setTimeout(() => {
              interlinearRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
    } catch (err) {
        console.error("Failed to fetch interlinear", err)
    } finally {
        setInterlinearLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const newUrl = `/?q=${encodeURIComponent(query)}`
    router.push(newUrl)

    performSearch(query)
  }

  const handleShare = () => {
    const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?q=${encodeURIComponent(query)}`

    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleExport = () => {
    if (!data || !data.content) return

    const { literalAnswer, keyTerms, scriptureReferences, historicalContext, originalLanguageAnalysis, theologicalInsight, commentarySynthesis, searchTopic } = data.content

    const title = `Bible Questions: ${query}`
    const date = new Date().toLocaleDateString()
    const slug = query.replace(/[^a-z0-9]/gi, '-').toLowerCase().substring(0, 50)
    
    let content = `# ${title}\nDate: ${date}\n\n## Breakdown\n${literalAnswer}\n\n`
    
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bible-questions-${slug}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleTorahPortion = () => {
    const today = new Date()
    const dateString = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const portionQuery = `What is the Torah portion (Parasha) for this week (week of ${dateString})? Please provide a study breakdown including the summary, key Hebrew words, theological insights, and a word-for-word interlinear analysis of the most important verse in this portion.`
    
    setQuery(portionQuery)
    
    const newUrl = `/?q=${encodeURIComponent(portionQuery)}`
    router.push(newUrl)

    performSearch(portionQuery)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      performSearch(q)
    }

    // Check for donation success redirect
    const donationSuccess = searchParams.get('donation')
    const paymentIntentId = searchParams.get('payment_intent')
    const redirectStatus = searchParams.get('redirect_status')
    
    if (donationSuccess === 'success' && paymentIntentId && redirectStatus === 'succeeded') {
      // Payment succeeded via redirect (3D Secure, etc.)
      // You could show a success notification here
    }
  }, [searchParams])

  useEffect(() => {
    if (loadingState === LoadingState.SUCCESS && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [loadingState])

  const isIdle = loadingState === LoadingState.IDLE

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-gold selection:text-white flex flex-col transition-colors duration-300">
      {/* Header / Navigation */}
      <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className={`flex items-center gap-2 transition-all duration-700 ${isIdle ? 'opacity-0 translate-y-[-20px]' : 'opacity-100'}`}>
           <span className="text-gold"><BookIcon className="w-6 h-6" /></span>
           <h1 
             className="font-display text-xl tracking-widest uppercase font-semibold cursor-pointer hover:text-gold transition-colors" 
             onClick={() => {
               setQuery('')
               setLoadingState(LoadingState.IDLE)
               router.push('/')
             }}
           >
             Bible Questions
           </h1>
        </div>

        <div className="flex items-center gap-4">
          {!isIdle && loadingState === LoadingState.SUCCESS && data && (
            <div className="flex items-center gap-4">
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 text-sm font-sans uppercase tracking-widest text-clay hover:text-gold transition-colors focus:outline-none"
                title="Save Article for SEO/Archive"
              >
                <FolderIcon />
                <span className="hidden sm:inline">Save Article</span>
              </button>

              <button 
                onClick={handleShare}
                className="flex items-center gap-2 text-sm font-sans uppercase tracking-widest text-clay hover:text-gold transition-colors focus:outline-none"
                title="Copy link to this study"
              >
                {copied ? <CheckIcon /> : <LinkIcon />}
                <span className={`${copied ? 'text-gold' : ''} transition-colors hidden sm:inline`}>
                  {copied ? 'Copied' : 'Share'}
                </span>
              </button>
            </div>
          )}
          
          {/* Donate Button */}
          <DonateButton />
          
          {/* Auth Button */}
          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button className="text-sm font-sans uppercase tracking-widest text-clay hover:text-gold transition-colors px-4 py-2 border border-stone hover:border-gold rounded-sm">
                Sign In
              </button>
            </SignInButton>
          )}
          
          {/* Night Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="text-clay hover:text-gold transition-colors p-1 focus:outline-none"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center w-full max-w-4xl mx-auto px-6 pb-20">
        
        {/* Hero / Search Section */}
        <div className={`w-full transition-all duration-700 ease-in-out flex flex-col items-center ${isIdle ? 'mt-[20vh]' : 'mt-4'}`}>
          
          {isIdle && (
            <div className="mb-12 text-center space-y-4 animate-fade-in">
              <div className="flex justify-center mb-8 text-gold">
                <BookIcon className="w-20 h-20 md:w-24 md:h-24" />
              </div>
              <h1 className="font-display text-4xl md:text-6xl text-ink tracking-wider">Bible Questions</h1>
              <p className="font-serif text-clay italic text-lg max-w-md mx-auto">
                "Ask, and it will be given to you; seek, and you will find."
              </p>
            </div>
          )}

          {requiresAuth && !isSignedIn && (
            <div className="mb-6 p-4 bg-gold/10 border border-gold/30 rounded-sm text-center">
              <p className="text-sm font-sans text-clay mb-2">
                You've reached the free search limit. Please sign in to continue.
              </p>
            </div>
          )}

          <form onSubmit={handleSearch} className="w-full max-w-xl relative group z-10">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a verse, concept, or question..."
              className="w-full bg-surface border-none shadow-md group-hover:shadow-lg transition-shadow duration-300 rounded-sm py-4 pl-6 pr-12 font-serif text-lg text-ink focus:ring-1 focus:ring-gold focus:outline-none placeholder:text-stone/60 placeholder:italic"
            />
            <button 
              type="submit" 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-clay hover:text-gold transition-colors"
              disabled={loadingState === LoadingState.LOADING}
            >
              <SearchIcon />
            </button>
          </form>

          {/* This Week's Torah Portion Button - Only visible in IDLE state */}
          {isIdle && (
            <div className="mt-8 animate-fade-in animation-delay-200">
              <button 
                onClick={handleTorahPortion}
                className="flex items-center gap-2 px-6 py-2 rounded-full border border-stone hover:border-gold bg-surface/50 hover:bg-surface text-xs font-sans uppercase tracking-widest text-stone hover:text-gold transition-all duration-300 shadow-sm"
              >
                <AlefIcon />
                <span>This Week's Torah Portion</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Display */}
        <div className="w-full mt-12" ref={contentRef}>
          
          {loadingState === LoadingState.LOADING && <LoadingIndicator />}
          
          {loadingState === LoadingState.ERROR && (
             <div className="text-center p-8 border border-red-800/20 bg-red-500/10 rounded-sm text-red-700 dark:text-red-400 font-serif">
                {error}
             </div>
          )}

          {loadingState === LoadingState.SUCCESS && data && (
            <div className="animate-fade-in-up space-y-16">
              
              {/* Refusal State */}
              {!data.isRelevant ? (
                <div className="text-center max-w-lg mx-auto py-12 px-6 border-y border-stone">
                  <p className="font-serif text-xl text-ink italic leading-relaxed">
                    {data.refusalMessage || "Let us keep our hearts and minds on the Holy Scriptures."}
                  </p>
                </div>
              ) : (
                /* Study Content */
                data.content && (
                  <>
                    {/* 1. Literal Answer (Annotated Breakdown) */}
                    <section className="max-w-3xl mx-auto">
                       <h2 className="font-display text-sm uppercase tracking-widest text-clay mb-4 text-center">Breakdown</h2>
                       <div className="font-serif text-xl text-ink leading-relaxed border-b border-gold/20 pb-8 text-justify md:text-left">
                         <div className="whitespace-pre-line">
                           {renderSummaryWithTooltips(
                             data.content.literalAnswer, 
                             data.content.keyTerms,
                             data.content.scriptureReferences // Pass verses here
                           )}
                         </div>
                       </div>
                    </section>

                    {/* 2. Interlinear (Dynamic Section) */}
                    {activeInterlinear && (
                      <div ref={interlinearRef} className="relative min-h-[200px]">
                         {interlinearLoading && (
                            <div className="absolute inset-0 bg-surface/80 z-10 flex items-center justify-center backdrop-blur-sm">
                               <div className="flex flex-col items-center">
                                   <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mb-2"></div>
                                   <span className="text-xs text-clay font-serif italic">Opening scroll...</span>
                               </div>
                            </div>
                         )}
                         <Interlinear data={activeInterlinear} />
                      </div>
                    )}

                    {/* 3. Scripture References */}
                    {data.content.scriptureReferences.length > 0 && (
                      <section className="flex flex-wrap gap-3 justify-center">
                        {data.content.scriptureReferences.map((ref, i) => (
                          <VersePill key={i} data={ref} onClick={handleVerseClick} />
                        ))}
                      </section>
                    )}

                    {/* 4. Word Study (Grid) */}
                    {data.content.originalLanguageAnalysis.length > 0 && (
                      <section className="py-6 -mx-6 px-6 md:rounded-sm">
                        <h2 className="font-display text-2xl text-center text-ink mb-8">Original Language Analysis</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {data.content.originalLanguageAnalysis.map((word, idx) => (
                            <WordCard key={idx} data={word} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* 5. Commentary & Insight */}
                    <section className="grid md:grid-cols-3 gap-12">
                      <div className="md:col-span-2 space-y-10">
                        <div>
                          <h2 className="font-display text-2xl text-ink mb-4 border-b border-gold/30 pb-2 inline-block">Theological Insight</h2>
                          <p className="font-serif text-lg leading-8 text-ink/90">
                            {data.content.theologicalInsight}
                          </p>
                        </div>
                        
                        <div>
                          <h2 className="font-display text-2xl text-ink mb-4 border-b border-gold/30 pb-2 inline-block">Commentary Synthesis</h2>
                          <div className="space-y-4">
                            {data.content.commentarySynthesis.map((commentary, idx) => (
                              <CommentaryDropdown key={idx} commentary={commentary} />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Sidebar / Chart */}
                      <div className="md:col-span-1">
                         <div className="sticky top-8">
                            <FrequencyChart data={data.content.biblicalBookFrequency} />
                         </div>
                      </div>
                    </section>

                    {/* 6. Map (Historical Geography) */}
                    <StudyMap 
                      imageUrl={mapUrl} 
                      loading={mapLoading} 
                      locationName={data.content.geographicalAnchor?.location || "Biblical Lands"} 
                    />

                    {/* 7. Archaeology & Historical Context */}
                    <section className="max-w-3xl mx-auto bg-stone/10 p-8 rounded-sm border-l-4 border-gold shadow-sm mt-8">
                       <div className="flex items-center gap-3 mb-6">
                         <span className="text-gold"><ColumnIcon /></span>
                         <h2 className="font-display text-xl text-ink tracking-wide">Archaeology & Historical Context</h2>
                       </div>

                       <p className="font-serif text-lg leading-8 text-ink text-justify">
                         {data.content.historicalContext}
                       </p>
                    </section>

                    {/* 8. External Resources */}
                    {resources.length > 0 && (
                      <ResourceSection resources={resources} />
                    )}
                  </>
                )
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="py-8 text-center text-stone text-xs font-sans tracking-widest uppercase">
        Bible Questions &copy; {new Date().getFullYear()}
      </footer>

      {/* Floating Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 p-3 bg-surface border border-gold/30 text-gold hover:bg-gold hover:text-surface shadow-lg rounded-full transition-all duration-500 z-50 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        aria-label="Back to top"
      >
        <ChevronUpIcon />
      </button>
    </div>
  )
}

