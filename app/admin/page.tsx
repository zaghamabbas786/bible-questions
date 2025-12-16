'use client'

import { useState, useEffect } from 'react'
import { useAuth, SignInButton, UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'

export default function AdminPage() {
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalQuestions: 0,
    todayGenerated: 0,
    dailyLimit: 500,
    progress: 0,
    target: 500,
    startedAt: null as string | null,
    lastRunAt: null as string | null,
  })

  // Check admin access on mount
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!isSignedIn || !user) {
        setIsCheckingAccess(false)
        setHasAccess(false)
        return
      }

      try {
        const response = await fetch('/api/admin/check-access')
        const data = await response.json()
        setHasAccess(data.hasAccess)
      } catch (error) {
        console.error('Failed to check admin access:', error)
        setHasAccess(false)
      } finally {
        setIsCheckingAccess(false)
      }
    }

    checkAdminAccess()
  }, [isSignedIn, user])

  // Poll for stats when user has access
  useEffect(() => {
    if (hasAccess) {
      fetchStats()
      
      // Only poll when generation is running
      let interval: NodeJS.Timeout | null = null
      
      if (isGenerating) {
        // Poll every 2 seconds while running
        interval = setInterval(fetchStats, 2000)
      }
      
      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [hasAccess, isGenerating])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Stats fetched:', { isRunning: data.isRunning, progress: data.progress, target: data.target })
        setStats(data)
        setIsGenerating(data.isRunning)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleStart = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', target: 500 }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsGenerating(true)
        alert('✅ Generation started! Cron will run every 60 seconds.')
        fetchStats()
      } else {
        alert(`❌ ${data.error || 'Failed to start generation'}`)
      }
    } catch (error) {
      console.error('Start error:', error)
      alert('❌ Failed to start generation')
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    try {
      setLoading(true)
      console.log('🛑 Stopping generation...')
      const response = await fetch('/api/admin/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      })
      
      const data = await response.json()
      console.log('🛑 Stop response:', data)
      
      if (data.success) {
        setIsGenerating(false)
        alert('✅ Generation stopped!')
        await fetchStats()
      } else {
        alert(`❌ ${data.error || 'Failed to stop generation'}`)
      }
    } catch (error) {
      console.error('Stop error:', error)
      alert('❌ Failed to stop generation')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset progress to 0?')) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/admin/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('✅ Progress reset!')
        fetchStats()
      } else {
        alert(`❌ ${data.error || 'Failed to reset'}`)
      }
    } catch (error) {
      console.error('Reset error:', error)
      alert('❌ Failed to reset')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-clay">Checking access...</p>
        </div>
      </div>
    )
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center space-y-6">
          <h1 className="font-display text-4xl text-ink">Admin Access Required</h1>
          <p className="text-clay">Please sign in to access the admin panel</p>
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-gold text-paper font-sans uppercase tracking-widest text-sm hover:bg-gold/90 transition-colors rounded-sm">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    )
  }

  // No access (email not in allowed list)
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">🚫</div>
          <h1 className="font-display text-4xl text-ink">Access Denied</h1>
          <p className="text-clay">
            Your email address is not authorized to access the admin panel.
          </p>
          <p className="text-sm text-stone">
            Contact the site administrator if you believe this is an error.
          </p>
          <div className="flex gap-4 justify-center">
            <UserButton />
            <Link 
              href="/"
              className="px-6 py-3 bg-surface text-ink font-sans uppercase tracking-widest text-sm hover:bg-stone/20 transition-colors rounded-sm border border-stone"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Main admin interface
  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="border-b border-stone bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-display text-3xl text-ink">Admin Panel</h1>
              <p className="text-clay text-sm mt-1">Auto-Generate Bible Questions</p>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-sm text-clay hover:text-ink transition-colors"
              >
                ← Back to Site
              </Link>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Statistics Card */}
          <div className="bg-surface border border-stone rounded-lg p-8 shadow-sm">
            <h2 className="font-display text-2xl text-ink mb-6">Statistics</h2>
            
            <div className="space-y-6">
              {/* Total Questions */}
              <div>
                <div className="text-sm text-clay mb-1">Total Questions</div>
                <div className="text-4xl font-display text-ink">{stats.totalQuestions.toLocaleString()}</div>
              </div>

              {/* Generation Progress */}
              <div>
                <h3 className="text-lg font-display text-ink mb-2">Generation Progress</h3>
                <div className="flex justify-between text-sm text-clay mb-2">
                  <span>Current Progress</span>
                  <span className="font-mono">{stats.progress} / {stats.target}</span>
                </div>
                <div className="w-full bg-stone/20 rounded-full h-3 overflow-hidden border border-stone">
                  <div 
                    className="bg-gold h-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.progress / stats.target) * 100, 100)}%` }}
                  />
                </div>
                {stats.progress >= stats.target && (
                  <div className="text-xs text-emerald-600 mt-1 font-medium">
                    ✅ Target reached!
                  </div>
                )}
              </div>

              {/* Today's Activity */}
              <div>
                <h3 className="text-lg font-display text-ink mb-2">Today's Activity</h3>
                <div className="flex justify-between text-sm text-clay">
                  <span>Questions Generated</span>
                  <span className="font-mono">{stats.todayGenerated}</span>
                </div>
              </div>

              {/* Status Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone">
                <div>
                  <div className="text-xs uppercase tracking-wider text-stone mb-1">Status</div>
                  <div className="text-lg font-display text-ink">
                    {isGenerating ? (
                      <span className="text-emerald-600">● Running</span>
                    ) : (
                      <span className="text-stone">● Stopped</span>
                    )}
                  </div>
                  {stats.lastRunAt && (
                    <div className="text-xs text-clay mt-1">
                      Last: {new Date(stats.lastRunAt).toLocaleTimeString()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-stone mb-1">Target</div>
                  <div className="text-lg font-display text-ink">{stats.target}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Control Card */}
          <div className="bg-surface border border-stone rounded-lg p-8 shadow-sm">
            <h2 className="font-display text-2xl text-ink mb-6">Controls</h2>

            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex gap-4">
                {!isGenerating ? (
                  <button
                    onClick={handleStart}
                    disabled={loading || stats.progress >= stats.target}
                    className="flex-1 px-6 py-4 bg-gold text-paper font-sans uppercase tracking-widest text-sm hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-sm shadow-md"
                  >
                    {loading ? 'Starting...' : '▶ Start Generation'}
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    disabled={loading}
                    className="flex-1 px-6 py-4 bg-red-600 text-white font-sans uppercase tracking-widest text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-sm shadow-md"
                  >
                    {loading ? 'Stopping...' : '■ Stop Generation'}
                  </button>
                )}
                <button
                  onClick={handleReset}
                  disabled={loading || isGenerating}
                  className="px-6 py-4 bg-surface text-ink border border-stone font-sans uppercase tracking-widest text-sm hover:bg-stone/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
                  title="Reset progress counter"
                >
                  🔄 Reset
                </button>
              </div>

              {/* Info Box */}
              <div className="bg-paper border border-stone rounded p-4">
                <h3 className="font-display text-sm text-ink mb-2 flex items-center gap-2">
                  <span>💡</span>
                  <span>How it works</span>
                </h3>
                <div className="text-xs text-clay space-y-2">
                  <p>
                    • Vercel cron runs every <strong>60 seconds</strong>
                  </p>
                  <p>
                    • Generates <strong>3 questions per minute</strong> when running
                  </p>
                  <p>
                    • Progress saved to database automatically
                  </p>
                  <p>
                    • Click START to begin, STOP to pause
                  </p>
                  {/* <p className="pt-2 border-t border-stone/50">
                    <strong>⚠️ Requires:</strong> Vercel Pro ($20/month) for cron jobs
                  </p> */}
                </div>
              </div>

              {/* Timing Info */}
              {stats.startedAt && (
                <div className="text-xs text-clay">
                  <strong>Started:</strong> {new Date(stats.startedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documentation Link */}
        {/* <div className="mt-8 text-center">
          <p className="text-sm text-clay">
            📖 Need help? Check the{' '}
            <Link href="/CRON-SETUP-GUIDE.md" className="text-gold hover:underline">
              Setup Guide
            </Link>
          </p>
        </div> */}
      </main>
    </div>
  )
}
