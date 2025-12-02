import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    const { userId } = await auth()
    const cookieStore = await cookies()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Track in public searches table (for SEO)
    await supabase
      .from('searches')
      .insert({
        query,
        user_id: userId || null,
        created_at: new Date().toISOString(),
      })

    // Track in user searches if authenticated
    if (userId) {
      await supabase
        .from('user_searches')
        .insert({
          user_id: userId,
          query,
          created_at: new Date().toISOString(),
        })
    } else {
      // For anonymous users, increment cookie count
      const searchCountCookie = cookieStore.get('anonymous_search_count')
      const currentCount = searchCountCookie ? parseInt(searchCountCookie.value) || 0 : 0
      const newCount = currentCount + 1
      
      // Set cookie that expires in 30 days
      cookieStore.set('anonymous_search_count', newCount.toString(), {
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Track search error:", error)
    return NextResponse.json(
      { error: "Failed to track search" },
      { status: 500 }
    )
  }
}

