import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { generateUniqueSlug } from '@/lib/slugify'

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

    // Store the exact query as received (no trimming or normalization)
    const exactQuery = query

    const supabase = await createClient()

    // Check if a record with this query already exists (with or without result)
    // Only create new record if it doesn't exist
    const { data: existingSearch } = await supabase
      .from('searches')
      .select('id')
      .eq('query', exactQuery)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Only insert if no record exists for this query
    // This prevents duplicates when user searches the same thing multiple times
    if (!existingSearch) {
      // Generate unique slug for the new search
      const { data: existingSlugs } = await supabase
        .from('searches')
        .select('slug')
      
      const slugs = existingSlugs?.map(s => s.slug) || []
      const slug = generateUniqueSlug(exactQuery, slugs)

      await supabase
        .from('searches')
        .insert({
          query: exactQuery,
          slug,
          user_id: userId || null,
          created_at: new Date().toISOString(),
        })
    }
    // If record exists, we'll update it later when the result comes in

    // Track in user searches if authenticated
    if (userId) {
      await supabase
        .from('user_searches')
        .insert({
          user_id: userId,
          query: exactQuery,
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

