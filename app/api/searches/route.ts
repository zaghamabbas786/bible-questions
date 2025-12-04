import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { query, result } = await request.json()
    const { userId } = await auth()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First, check if a complete result already exists for this query
    // If it exists with a result, don't create duplicate - just return it
    const { data: existingComplete } = await supabase
      .from('searches')
      .select('id, result')
      .eq('query', query)
      .not('result', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // If complete result exists, don't create duplicate
    if (existingComplete && existingComplete.result) {
      return NextResponse.json({ 
        success: true, 
        data: existingComplete, 
        updated: false,
        message: 'Result already exists, no duplicate created'
      })
    }

    // If no complete result exists, check for incomplete record (created within last 5 minutes)
    // This matches the record created by track-search
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: existingIncomplete, error: findError } = await supabase
      .from('searches')
      .select('id')
      .eq('query', query)
      .is('result', null) // Only match records without results
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingIncomplete && !findError) {
      // Update existing incomplete record with result
      const { data, error } = await supabase
        .from('searches')
        .update({
          result: result || null,
          user_id: userId || null,
        })
        .eq('id', existingIncomplete.id)
        .select()
        .single()

      if (error) {
        console.error('Supabase update error:', error)
        return NextResponse.json(
          { error: 'Failed to update search result' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data, updated: true })
    } else {
      // Insert new record only if no existing record found
      const { data, error } = await supabase
        .from('searches')
        .insert({
          query,
          result: result || null,
          user_id: userId || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        return NextResponse.json(
          { error: 'Failed to save search' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data, updated: false })
    }

  } catch (error) {
    console.error("Save search error:", error)
    return NextResponse.json(
      { error: "Failed to save search" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const { data, error } = await supabase
      .from('searches')
      .select('query, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch searches' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error("Fetch searches error:", error)
    return NextResponse.json(
      { error: "Failed to fetch searches" },
      { status: 500 }
    )
  }
}

