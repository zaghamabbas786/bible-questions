import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <h1 className="font-display text-6xl text-gold">404</h1>
        <h2 className="font-display text-2xl text-ink">Question Not Found</h2>
        <p className="font-serif text-lg text-clay italic">
          "Ask, and it will be given to you; seek, and you will find."
        </p>
        <p className="font-sans text-sm text-stone">
          This biblical question doesn't exist yet. Try asking it on our home page.
        </p>
        <Link 
          href="/" 
          className="inline-block px-6 py-3 bg-gold text-paper font-sans uppercase tracking-widest text-sm hover:bg-gold/90 transition-colors rounded-sm"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}

