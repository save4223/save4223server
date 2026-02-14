import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Allow Tailscale and other dev origins
  allowedDevOrigins: ['100.83.123.68', '*.tailscale.net', '*.ts.net'],
}

export default nextConfig
