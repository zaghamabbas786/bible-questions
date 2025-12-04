import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// IMPORTANT: STRIPE_SECRET_KEY is ONLY used here in the backend API route
// It is NEVER exposed to the frontend (no NEXT_PUBLIC_ prefix)

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Payment intent API is working',
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    route: '/api/create-payment-intent',
  })
}

export async function POST(request: NextRequest) {
  try {
    // Check for Stripe secret key
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })

    const { amount } = await request.json()

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: 'Amount must be at least $1' },
        { status: 400 }
      )
    }

    // Create a PaymentIntent with the order amount and currency
    const amountInCents = Math.round(amount * 100) // Convert to cents
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        amount: amount.toString(), // Store original amount for reference
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount, // Also return the amount for verification
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

