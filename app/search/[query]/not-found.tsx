import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-display text-ink mb-4">404</h1>
        <p className="text-stone-600 mb-8">This search result could not be found.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gold text-white rounded hover:bg-gold/90 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
}


