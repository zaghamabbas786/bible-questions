import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  try {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const secretKey = process.env.STRIPE_SECRET_KEY

    const results: {
      publishableKey: {
        exists: boolean
        format: string
        preview: string
      }
      secretKey: {
        exists: boolean
        format: string
        preview: string
        testResult?: string
        accountId?: string
        accountType?: string
        error?: string
      }
    } = {
      publishableKey: {
        exists: !!publishableKey,
        format: publishableKey ? (publishableKey.startsWith('pk_') ? 'valid' : 'invalid format') : 'missing',
        preview: publishableKey ? `${publishableKey.substring(0, 12)}...` : 'not set',
      },
      secretKey: {
        exists: !!secretKey,
        format: secretKey ? (secretKey.startsWith('sk_') ? 'valid' : 'invalid format') : 'missing',
        preview: secretKey ? `${secretKey.substring(0, 12)}...` : 'not set',
      },
    }

    // Test the secret key by making a simple API call
    if (secretKey && secretKey.startsWith('sk_')) {
      try {
        const stripe = new Stripe(secretKey, {
          apiVersion: '2023-10-16',
        })
        
        // Make a simple API call to verify the key works
        const account = await stripe.accounts.retrieve()
        results.secretKey = {
          ...results.secretKey,
          testResult: 'success',
          accountId: account.id,
          accountType: account.type,
        }
      } catch (error: any) {
        results.secretKey = {
          ...results.secretKey,
          testResult: 'failed',
          error: error.message || 'Unknown error',
        }
      }
    } else {
      results.secretKey = {
        ...results.secretKey,
        testResult: 'not tested (invalid or missing key)',
      }
    }

    return NextResponse.json({
      status: 'completed',
      results,
      message: results.secretKey.testResult === 'success' 
        ? '✅ Stripe keys are valid and working!'
        : '❌ Stripe keys need to be checked',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message || 'Failed to test Stripe keys',
      },
      { status: 500 }
    )
  }
}

