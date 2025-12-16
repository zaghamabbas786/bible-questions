import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase-server'

/**
 * Admin control endpoint for START/STOP generation
 * Updates the database flag that the cron job checks
 */

async function checkAdminAccess(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const user = await currentUser()
  if (!user) return false

  const userEmail = user.emailAddresses.find(
    email => email.id === user.primaryEmailAddressId
  )?.emailAddress

  const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0)

  return userEmail ? allowedEmails.includes(userEmail.toLowerCase()) : false
}

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const hasAccess = await checkAdminAccess()
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, target = 500 } = await request.json()

    const supabase = await createClient()

    // Get current status
    const { data: config, error: configError } = await supabase
      .from('admin_config')
      .select('value')
      .eq('key', 'generation_status')
      .single()

    if (configError) {
      return NextResponse.json(
        { error: 'Failed to read configuration' },
        { status: 500 }
      )
    }

    const currentStatus = config.value as {
      is_generating: boolean
      progress: number
      target: number
      started_at?: string | null
      last_run_at?: string | null
      user_id?: string
    }

    if (action === 'start') {
      // Start generation
      const newStatus = {
        is_generating: true,
        progress: currentStatus.progress || 0,
        target: target,
        started_at: new Date().toISOString(),
        last_run_at: currentStatus.last_run_at || null,
        user_id: userId,
      }

      const { error: updateError } = await supabase
        .from('admin_config')
        .update({ value: newStatus })
        .eq('key', 'generation_status')

      if (updateError) {
        console.error('Failed to start generation:', updateError)
        return NextResponse.json(
          { error: 'Failed to start generation' },
          { status: 500 }
        )
      }

      console.log(`✅ Generation STARTED by user ${userId} - Target: ${target}`)

      return NextResponse.json({
        success: true,
        message: 'Generation started',
        status: newStatus,
      })

    } else if (action === 'stop') {
      // Stop generation
      const newStatus = {
        ...currentStatus,
        is_generating: false,
      }

      const { error: updateError } = await supabase
        .from('admin_config')
        .update({ value: newStatus })
        .eq('key', 'generation_status')

      if (updateError) {
        console.error('Failed to stop generation:', updateError)
        return NextResponse.json(
          { error: 'Failed to stop generation' },
          { status: 500 }
        )
      }

      console.log(`🛑 Generation STOPPED by user ${userId}`)

      return NextResponse.json({
        success: true,
        message: 'Generation stopped',
        status: newStatus,
      })

    } else if (action === 'reset') {
      // Reset progress
      const newStatus = {
        is_generating: false,
        progress: 0,
        target: 500,
        started_at: null,
        last_run_at: null,
        user_id: null,
      }

      const { error: updateError } = await supabase
        .from('admin_config')
        .update({ value: newStatus })
        .eq('key', 'generation_status')

      if (updateError) {
        console.error('Failed to reset:', updateError)
        return NextResponse.json(
          { error: 'Failed to reset' },
          { status: 500 }
        )
      }

      console.log(`🔄 Generation RESET by user ${userId}`)

      return NextResponse.json({
        success: true,
        message: 'Generation reset',
        status: newStatus,
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Control error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}

// GET endpoint to check current status
export async function GET() {
  try {
    const hasAccess = await checkAdminAccess()
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const supabase = await createClient()

    const { data: config, error } = await supabase
      .from('admin_config')
      .select('value')
      .eq('key', 'generation_status')
      .single()

    if (error || !config) {
      return NextResponse.json(
        { error: 'Failed to read status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: config.value,
    })

  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}

