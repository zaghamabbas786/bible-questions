import type { Metadata } from 'next'
import { Inter, Merriweather, Cinzel } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import GoogleAnalytics from './components/GoogleAnalytics'
import MetaPixel from './components/MetaPixel'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const merriweather = Merriweather({ 
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-merriweather',
  display: 'swap',
})

const cinzel = Cinzel({ 
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bible Questions',
  description: 'An ultra-minimalist, focused Bible study assistant that provides historical context, original language analysis (Greek/Hebrew), and theological insights.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${merriweather.variable} ${cinzel.variable} font-sans`} suppressHydrationWarning>
          {children}
          <GoogleAnalytics />
          <MetaPixel />
        </body>
      </html>
    </ClerkProvider>
  )
}

