import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase-server'

/**
 * Get admin statistics
 * Requires admin email to be in ALLOWED_ADMIN_EMAILS env variable
 * Now reads state from database instead of memory
 */
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin access
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    )?.emailAddress

    const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || '')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0)

    if (!userEmail || !allowedEmails.includes(userEmail.toLowerCase())) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const supabase = await createClient()

    // Get total questions count
    const { count: totalQuestions } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true })
      .not('result', 'is', null)

    // Get today's generated count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: todayGenerated } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true })
      .not('result', 'is', null)
      .gte('created_at', today.toISOString())

    // Read generation status from database
    const { data: config } = await supabase
      .from('admin_config')
      .select('value')
      .eq('key', 'generation_status')
      .single()

    const status = config?.value as {
      is_generating: boolean
      progress: number
      target: number
      started_at?: string | null
      last_run_at?: string | null
    } || {
      is_generating: false,
      progress: 0,
      target: 500,
      started_at: null,
      last_run_at: null,
    }

    return NextResponse.json({
      totalQuestions: totalQuestions || 0,
      todayGenerated: todayGenerated || 0,
      dailyLimit: status.target,
      isRunning: status.is_generating,
      progress: status.progress,
      target: status.target,
      startedAt: status.started_at,
      lastRunAt: status.last_run_at,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
