import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'

/**
 * Check if the current user has admin access
 * Based on email whitelist from environment variable
 */
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ hasAccess: false }, { status: 401 })
    }

    // Get current user to access email
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ hasAccess: false }, { status: 401 })
    }

    // Get primary email address
    const userEmail = user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    )?.emailAddress

    if (!userEmail) {
      return NextResponse.json({ 
        hasAccess: false,
        error: 'No email found for user' 
      })
    }

    // Get allowed emails from environment variable
    const allowedEmailsEnv = process.env.ALLOWED_ADMIN_EMAILS || ''
    
    if (!allowedEmailsEnv) {
      console.warn('ALLOWED_ADMIN_EMAILS not set in environment variables')
      return NextResponse.json({ 
        hasAccess: false,
        error: 'Admin access not configured' 
      })
    }

    // Parse comma-separated emails and trim whitespace
    const allowedEmails = allowedEmailsEnv
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0)

    // Check if user's email is in the allowed list (case-insensitive)
    const hasAccess = allowedEmails.includes(userEmail.toLowerCase())

    if (hasAccess) {
      console.log(`✅ Admin access granted to: ${userEmail}`)
    } else {
      console.log(`❌ Admin access denied for: ${userEmail}`)
    }

    return NextResponse.json({ 
      hasAccess,
      email: userEmail 
    })

  } catch (error) {
    console.error('Check access error:', error)
    return NextResponse.json(
      { hasAccess: false, error: 'Failed to check access' },
      { status: 500 }
    )
  }
}

