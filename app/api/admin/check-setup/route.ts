import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * Diagnostic endpoint to check if everything is configured correctly
 */
export async function GET() {
  const diagnostics: any = {
    environment: {
      hasCronSecret: !!process.env.CRON_SECRET,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    },
    database: {
      connected: false,
      adminConfigExists: false,
      generationStatus: null,
    },
    timestamp: new Date().toISOString(),
  }

  try {
    const supabase = await createClient()
    diagnostics.database.connected = true

    // Check if admin_config table exists and has data
    const { data, error } = await supabase
      .from('admin_config')
      .select('*')
      .eq('key', 'generation_status')
      .single()

    if (error) {
      diagnostics.database.error = error.message
    } else {
      diagnostics.database.adminConfigExists = true
      diagnostics.database.generationStatus = data?.value
    }
  } catch (error: any) {
    diagnostics.database.error = error?.message || 'Unknown error'
  }

  return NextResponse.json(diagnostics, { status: 200 })
}

