import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/search(.*)',
  '/api/search(.*)',
  '/api/searches(.*)',
  '/api/track-search',
  '/api/map',
  '/api/resources',
  '/api/interlinear',
  '/api/search-count',
  '/api/create-payment-intent',
  '/api/test-stripe',
  '/api/test-supabase',
  '/api/test-welcome-email', // Test endpoint for welcome emails (requires auth)
  '/api/webhooks/clerk', // Clerk webhook for welcome emails
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

// Note: The middleware file convention is being migrated to "proxy" in Next.js
// This will continue to work, but consider migrating when Next.js provides more guidance

