import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { query, result } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('searches')
      .insert({
        query,
        result: result || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save search' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

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

