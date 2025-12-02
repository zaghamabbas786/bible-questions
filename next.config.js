/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Allow data URLs and other unoptimized images
    remotePatterns: [],
  },
}

module.exports = nextConfig

