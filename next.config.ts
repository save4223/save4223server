import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Explicitly set Turbopack root to prevent workspace detection issues
  turbopack: {
    root: __dirname,
  },
  // Allow Tailscale and other dev origins
  allowedDevOrigins: ['100.83.123.68','100.125.135.46', '*.tailscale.net', '*.ts.net'],
}

export default nextConfig
