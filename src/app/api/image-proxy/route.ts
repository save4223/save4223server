import { NextRequest, NextResponse } from 'next/server'

// Blocked hosts (private/internal networks)
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
  '[::]',
]

// Blocked IP ranges (private networks)
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  const privateRanges = [
    /^127\./, // Loopback
    /^10\./, // Private Class A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
    /^192\.168\./, // Private Class C
    /^169\.254\./, // Link-local
    /^0\./, // Current network
  ]
  return privateRanges.some(range => range.test(ip))
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  // Only allow HTTPS for security
  if (parsed.protocol !== 'https:') {
    return new NextResponse('Only HTTPS URLs are allowed', { status: 403 })
  }

  // Block private/internal hosts
  if (BLOCKED_HOSTS.includes(parsed.hostname) || isPrivateIP(parsed.hostname)) {
    return new NextResponse('Host not allowed', { status: 403 })
  }

  // Block common internal ports
  const port = parsed.port
  if (port && !['443', ''].includes(port)) {
    return new NextResponse('Port not allowed', { status: 403 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      console.error(`Image proxy failed: ${url} - ${response.status}`)
      return new NextResponse(`Failed to fetch image: ${response.status}`, { status: 502 })
    }

    // Validate content type is an image
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return new NextResponse('URL does not point to a valid image', { status: 400 })
    }

    const buffer = await response.arrayBuffer()

    // Limit size to 10MB
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return new NextResponse('Image too large (max 10MB)', { status: 413 })
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return new NextResponse('Failed to fetch image', { status: 502 })
  }
}
