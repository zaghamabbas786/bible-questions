import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { sendWelcomeEmail } from '@/lib/emails/send-welcome-email'

export async function POST(request: NextRequest) {
  try {
    // Get the Svix headers for verification
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      )
    }

    // Get the webhook secret
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Get the body as text (required for svix verification)
    const body = await request.text()

    // Create a new Svix instance with the secret
    const wh = new Webhook(webhookSecret)

    let evt: any

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch (err: any) {
      console.error('Webhook verification failed:', err.message)
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      )
    }

    // Handle the webhook
    const eventType = evt.type

    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data

      // Get the primary email
      const primaryEmail = email_addresses?.find((email: any) => email.id === evt.data.primary_email_address_id)
      const email = primaryEmail?.email_address || email_addresses?.[0]?.email_address

      if (email) {
        const userName = first_name || last_name 
          ? `${first_name || ''} ${last_name || ''}`.trim() 
          : null

        // Send welcome email (don't await - send in background)
        sendWelcomeEmail(email, userName).catch((error) => {
          console.error('Failed to send welcome email:', error)
        })
      }

      console.log('User created:', { id, email })
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}


