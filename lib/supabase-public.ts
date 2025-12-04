import { createClient } from '@supabase/supabase-js'

/**
 * Public Supabase client for server-side use in static pages
 * Does not use cookies - suitable for ISR and static generation
 * Use this for public data that doesn't require authentication
 */
export function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

