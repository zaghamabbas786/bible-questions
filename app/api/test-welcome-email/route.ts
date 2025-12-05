import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { sendWelcomeEmail } from '@/lib/emails/send-welcome-email'

export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
      return NextResponse.json(
        { error: 'You must be signed in to test the welcome email' },
        { status: 401 }
      )
    }

    // Get the user's primary email
    const primaryEmail = user.emailAddresses?.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress || user.emailAddresses?.[0]?.emailAddress

    if (!primaryEmail) {
      return NextResponse.json(
        { error: 'No email address found for this user' },
        { status: 400 }
      )
    }

    // Get user's name
    const userName = user.firstName || user.lastName
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : null

    // Send welcome email
    const result = await sendWelcomeEmail(primaryEmail, userName)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully!',
        email: primaryEmail,
        emailId: result.emailId,
        userName: userName || 'Friend',
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
          email: primaryEmail,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Test welcome email error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send test email',
      },
      { status: 500 }
    )
  }
}

