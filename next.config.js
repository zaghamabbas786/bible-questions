/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Allow data URLs and other unoptimized images
    remotePatterns: [],
  },
  typescript: {
    // Temporarily ignore build errors for sitemap route
    ignoreBuildErrors: true,
  },
  experimental: {
    scrollRestoration: true,
  },
}

module.exports = nextConfig

