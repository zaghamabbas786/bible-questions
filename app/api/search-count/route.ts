import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const cookieStore = await cookies()
    
    // If user is signed in, they have unlimited searches
    if (userId) {
      return NextResponse.json({ count: 0, requiresAuth: false })
    }

    // For anonymous users, track searches via cookie
    const searchCountCookie = cookieStore.get('anonymous_search_count')
    const count = searchCountCookie ? parseInt(searchCountCookie.value) || 0 : 0

    // Require login after 3 searches
    const requiresAuth = count >= 3

    return NextResponse.json({ 
      count, 
      requiresAuth 
    })

  } catch (error) {
    console.error("Search count error:", error)
    return NextResponse.json({ count: 0, requiresAuth: false })
  }
}

