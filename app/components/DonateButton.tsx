'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

// Note: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is safe to use on frontend
// The secret key (STRIPE_SECRET_KEY) is ONLY used in the backend API route
const getStripePromise = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!publishableKey) {
    return null
  }
  return loadStripe(publishableKey)
}

const DonateButton: React.FC = () => {
  const searchParams = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

  // Check for successful payment redirect from Stripe
  useEffect(() => {
    const donationSuccess = searchParams.get('donation')
    const paymentIntentIdParam = searchParams.get('payment_intent')
    const redirectStatus = searchParams.get('redirect_status')
    
    if (donationSuccess === 'success' && paymentIntentIdParam && redirectStatus === 'succeeded') {
      // Payment succeeded via redirect (3D Secure, etc.)
      
      // Fetch payment details to get the amount
      fetch(`/api/check-payment?id=${paymentIntentIdParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.amount) {
            setPaymentAmount(data.amount)
            setPaymentIntentId(paymentIntentIdParam)
            setPaymentSuccess(true)
            setShowModal(true)
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname)
          }
        })
        .catch((err) => {
          console.error('Error fetching payment details:', err)
        })
    }
  }, [searchParams])

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  const handleDonateClick = async () => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      alert('Stripe is not configured. Please contact the administrator.')
      return
    }

    const amount = selectedAmount || parseFloat(customAmount)
    
    if (!amount || amount < 1) {
      alert('Please select an amount or enter a valid amount (minimum $1)')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Payment API route not found. Please restart the dev server.')
        }
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        alert(data.error)
        setIsProcessing(false)
        return
      }

      if (!data.clientSecret) {
        throw new Error('No client secret received from server')
      }

      // Store the amount for success message (use the amount from server response if available)
      const confirmedAmount = data.amount || amount
      setPaymentAmount(confirmedAmount)
      setPaymentIntentId(data.paymentIntentId || null)
      setClientSecret(data.clientSecret)
      setShowModal(true)
    } catch (error: any) {
      console.error('Error creating payment intent:', error)
      alert(error.message || 'Failed to initialize payment. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    setClientSecret(null)
    setSelectedAmount(null)
    setCustomAmount('')
    setIsProcessing(false)
    setPaymentSuccess(false)
    setPaymentAmount(null)
    setPaymentIntentId(null)
  }

  const handleOpenModal = () => {
    // Reset everything when opening the modal
    setClientSecret(null)
    setSelectedAmount(null)
    setCustomAmount('')
    setIsProcessing(false)
    setPaymentSuccess(false)
    setPaymentAmount(null)
    setPaymentIntentId(null)
    setShowModal(true)
  }

  const amount = selectedAmount || parseFloat(customAmount) || 0

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="px-4 sm:px-6 py-2 bg-gold text-surface font-sans uppercase tracking-widest text-xs sm:text-sm hover:bg-gold/90 transition-colors rounded-sm shadow-sm whitespace-nowrap"
      >
        Donate
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-sm shadow-xl max-w-md w-full p-4 sm:p-6 relative my-auto">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-stone hover:text-ink transition-colors z-10 p-1"
              aria-label="Close donation modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="font-display text-xl sm:text-2xl text-ink mb-6 pr-10 sm:pr-12">
              {paymentSuccess ? 'Thank You!' : 'Support Bible Questions'}
            </h2>

            {paymentSuccess ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-gold">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-display text-xl text-ink">Payment Successful!</h3>
                <p className="font-serif text-clay">
                  Thank you for your generous donation of <span className="font-bold text-gold">${paymentAmount?.toFixed(2)}</span>
                </p>
                <p className="font-serif text-sm text-stone">
                  Your support helps keep this resource free and accessible to everyone.
                </p>
                {paymentIntentId && (
                  <p className="font-sans text-xs text-stone/70 mt-2">
                    Payment ID: {paymentIntentId.substring(0, 20)}...
                  </p>
                )}
                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 bg-gold text-surface font-sans uppercase tracking-widest text-sm hover:bg-gold/90 transition-colors rounded-sm mt-4"
                >
                  Close
                </button>
              </div>
            ) : !clientSecret ? (
              <div className="space-y-4">
                <p className="font-serif text-clay text-sm">
                  Your donation helps keep this resource free and accessible to everyone.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {[1, 5, 10].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleAmountSelect(amt)}
                      className={`px-4 py-3 border-2 rounded-sm font-sans font-semibold transition-all ${
                        selectedAmount === amt
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-stone text-clay hover:border-gold/50'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-sans text-clay mb-2">
                    Or enter custom amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-2 border border-stone rounded-sm bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>

                <button
                  onClick={handleDonateClick}
                  disabled={isProcessing || (!selectedAmount && !customAmount)}
                  className="w-full px-6 py-3 bg-gold text-surface font-sans uppercase tracking-widest text-sm hover:bg-gold/90 transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : `Donate $${amount.toFixed(2)}`}
                </button>
              </div>
            ) : clientSecret ? (
              <Elements 
                stripe={getStripePromise()} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                  },
                }}
                key={clientSecret} // Force re-render with new client secret
              >
                <CheckoutForm 
                  onSuccess={(amount) => {
                    setPaymentAmount(amount)
                    setPaymentSuccess(true)
                    setClientSecret(null) // Clear client secret to show success message
                  }} 
                />
              </Elements>
            ) : (
              <div className="text-red-600 text-sm">Stripe is not configured. Please add Stripe keys to your environment variables.</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const CheckoutForm: React.FC<{ onSuccess: (amount: number) => void }> = ({ onSuccess }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || 'An error occurred')
      setIsProcessing(false)
      return
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/?donation=success`,
      },
      redirect: 'if_required', // Only redirect if required (3D Secure, etc.)
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed')
      setIsProcessing(false)
    } else if (paymentIntent) {
      // Check payment status
      const amount = paymentIntent.amount / 100 // Convert from cents to dollars
      
      if (paymentIntent.status === 'succeeded') {
        // Payment succeeded immediately
        onSuccess(amount)
      } else if (paymentIntent.status === 'requires_action') {
        // Payment requires additional action (3D Secure, etc.)
        // Stripe will handle the redirect automatically
        setError('Please complete the authentication step.')
        setIsProcessing(false)
      } else if (paymentIntent.status === 'processing') {
        // Payment is processing
        onSuccess(amount)
      } else {
        // Other statuses
        onSuccess(amount)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="text-red-600 text-sm font-sans">{error}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full px-6 py-3 bg-gold text-surface font-sans uppercase tracking-widest text-sm hover:bg-gold/90 transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : 'Complete Donation'}
      </button>
    </form>
  )
}

export default DonateButton

