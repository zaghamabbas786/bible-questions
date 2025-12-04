import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe secret key is not configured' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })

    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('id')

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    // Retrieve payment intent with expanded charges
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['charges'],
    })

    // Get charges if available
    interface ChargeInfo {
      id: string
      status: string
      amount: number
      paid: boolean
    }
    
    const charges: ChargeInfo[] = []
    if (paymentIntent.latest_charge) {
      try {
        // latest_charge can be a string ID or a Charge object
        const chargeId = typeof paymentIntent.latest_charge === 'string' 
          ? paymentIntent.latest_charge 
          : paymentIntent.latest_charge.id
        
        const charge = await stripe.charges.retrieve(chargeId)
        charges.push({
          id: charge.id,
          status: charge.status,
          amount: charge.amount / 100,
          paid: charge.paid,
        })
      } catch (err) {
        // If charge retrieval fails, just continue without charges
        console.error('Error retrieving charge:', err)
      }
    }

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, 
      currency: paymentIntent.currency,
      created: new Date(paymentIntent.created * 1000).toISOString(),
      charges: charges,
    })
  } catch (error: any) {
    console.error('Error retrieving payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve payment' },
      { status: 500 }
    )
  }
}

